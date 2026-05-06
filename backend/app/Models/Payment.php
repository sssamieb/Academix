<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'user_id', 'stripe_payment_intent_id', 'stripe_invoice_id',
        'plan_name', 'plan_type', 'amount', 'currency', 'status', 'paid_at',
    ];

    protected $casts = ['paid_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }
}