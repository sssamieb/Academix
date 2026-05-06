<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Customer;
use Stripe\Subscription;
use Stripe\Exception\ApiErrorException;

class SubscriptionController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    // Obtener planes disponibles
    public function plans(): JsonResponse
    {
        $plans = Plan::all();
        return response()->json(['plans' => $plans]);
    }

    // Crear sesión de checkout para suscripción
    public function checkout(Request $request): JsonResponse
    {
        $request->validate([
            'plan_type' => 'required|in:basic,pro,premium',
        ]);

        $user = $request->user();

        $priceMap = [
            'basic'   => config('services.stripe.price_basic'),
            'pro'     => config('services.stripe.price_pro'),
            'premium' => config('services.stripe.price_premium'),
        ];

        $priceId = $priceMap[$request->plan_type];

        try {
            // Crear o recuperar customer en Stripe
            if (!$user->stripe_customer_id) {
                $customer = Customer::create([
                    'email' => $user->email,
                    'name'  => $user->name,
                    'metadata' => ['user_id' => $user->id],
                ]);
                $user->update(['stripe_customer_id' => $customer->id]);
            }

            // Crear sesión de checkout
            $session = \Stripe\Checkout\Session::create([
                'customer'            => $user->stripe_customer_id,
                'payment_method_types' => ['card'],
                'line_items'          => [[
                    'price'    => $priceId,
                    'quantity' => 1,
                ]],
                'mode'                => 'subscription',
                'success_url'         => env('FRONTEND_URL') . '/student/subscription/success?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url'          => env('FRONTEND_URL') . '/student/plans',
                'metadata'            => [
                    'user_id'   => $user->id,
                    'plan_type' => $request->plan_type,
                ],
            ]);

            return response()->json(['checkout_url' => $session->url]);

        } catch (ApiErrorException $e) {
            return response()->json(['message' => 'Error al crear sesión de pago: ' . $e->getMessage()], 500);
        }
    }

    // Webhook de Stripe — confirmar pago y activar suscripción
    public function webhook(Request $request): JsonResponse
    {
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret    = env('STRIPE_WEBHOOK_SECRET');

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        match ($event->type) {
            'checkout.session.completed'    => $this->handleCheckoutCompleted($event->data->object),
            'customer.subscription.deleted' => $this->handleSubscriptionCancelled($event->data->object),
            default                         => null,
        };

        return response()->json(['status' => 'ok']);
    }

    private function handleCheckoutCompleted($session): void
    {
        $userId   = $session->metadata->user_id;
        $planType = $session->metadata->plan_type;

        $user = User::find($userId);
        $plan = Plan::where('type', $planType)->first();

        if (!$user || !$plan) return;

        $subscription = Subscription::retrieve($session->subscription);

        $tokensToAdd = match($planType) {
            'basic'   => 200,
            'pro'     => 600,
            'premium' => 999999,
            default   => 0,
        };

        $user->update([
            'plan_id'                => $plan->id,
            'stripe_subscription_id' => $subscription->id,
            'subscription_status'    => 'active',
            'subscription_ends_at'   => now()->addMonth(),
            'tokens'                 => $user->tokens + $tokensToAdd,
        ]);

        // Guardar pago en la base de datos
        \App\Models\Payment::create([
            'user_id'                  => $user->id,
            'stripe_payment_intent_id' => $session->payment_intent ?? null,
            'stripe_invoice_id'        => $session->invoice ?? null,
            'plan_name'                => $plan->name,
            'plan_type'                => $planType,
            'amount'                   => ($session->amount_total ?? 0) / 100,
            'currency'                 => $session->currency ?? 'usd',
            'status'                   => 'succeeded',
            'paid_at'                  => now(),
        ]);
    }
    private function handleSubscriptionCancelled($subscription): void
    {
        $user = User::where('stripe_subscription_id', $subscription->id)->first();
        if (!$user) return;

        $user->update([
            'plan_id'             => null,
            'subscription_status' => 'cancelled',
        ]);
    }

    // Cancelar suscripción
    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->stripe_subscription_id) {
            return response()->json(['message' => 'No tenés una suscripción activa.'], 422);
        }

        try {
            Subscription::retrieve($user->stripe_subscription_id)->cancel();

            $user->update([
                'plan_id'             => null,
                'subscription_status' => 'cancelled',
            ]);

            return response()->json(['message' => 'Suscripción cancelada.']);

        } catch (ApiErrorException $e) {
            return response()->json(['message' => 'Error al cancelar: ' . $e->getMessage()], 500);
        }
    }

    // Estado de suscripción del usuario
    public function status(Request $request): JsonResponse
    {
        $user = $request->user()->load('plan');

        return response()->json([
            'subscription_status' => $user->subscription_status,
            'subscription_ends_at' => $user->subscription_ends_at,
            'tokens'              => $user->tokens,
            'plan'                => $user->plan,
        ]);
    }
}