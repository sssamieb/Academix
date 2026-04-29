<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        Plan::insert([
            [
                'name'                    => 'Básico',
                'slug'                    => 'basic',
                'price'                   => 9.99,
                'period'                  => 'mes',
                'type'                    => 'basic',
                'monthly_tokens'          => 200,
                'tokens_accumulate'       => false,
                'unlimited_tokens'        => false,
                'quiz_attempts'           => 2,
                'exam_attempts'           => 1,
                'unlimited_attempts'      => false,
                'early_access'            => false,
                'state_certificate'       => false,
                'featured_profile'        => false,
                'instructor_consultation' => false,
                'created_at'              => now(),
                'updated_at'              => now(),
            ],
            [
                'name'                    => 'Pro',
                'slug'                    => 'pro',
                'price'                   => 19.99,
                'period'                  => 'mes',
                'type'                    => 'pro',
                'monthly_tokens'          => 600,
                'tokens_accumulate'       => true,
                'unlimited_tokens'        => false,
                'quiz_attempts'           => 4,
                'exam_attempts'           => 3,
                'unlimited_attempts'      => false,
                'early_access'            => false,
                'state_certificate'       => false,
                'featured_profile'        => false,
                'instructor_consultation' => false,
                'created_at'              => now(),
                'updated_at'              => now(),
            ],
            [
                'name'                    => 'Premium',
                'slug'                    => 'premium',
                'price'                   => 69.99,
                'period'                  => 'mes',
                'type'                    => 'premium',
                'monthly_tokens'          => 0,
                'tokens_accumulate'       => true,
                'unlimited_tokens'        => true,
                'quiz_attempts'           => 0,
                'exam_attempts'           => 0,
                'unlimited_attempts'      => true,
                'early_access'            => true,
                'state_certificate'       => true,
                'featured_profile'        => true,
                'instructor_consultation' => true,
                'created_at'              => now(),
                'updated_at'              => now(),
            ],
        ]);
    }
}