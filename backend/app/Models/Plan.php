<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name', 'slug', 'price', 'period', 'type',
        'monthly_tokens', 'tokens_accumulate', 'unlimited_tokens',
        'quiz_attempts', 'exam_attempts', 'unlimited_attempts',
        'early_access', 'state_certificate', 'featured_profile',
        'instructor_consultation',
    ];

    protected $casts = [
        'tokens_accumulate'       => 'boolean',
        'unlimited_tokens'        => 'boolean',
        'unlimited_attempts'      => 'boolean',
        'early_access'            => 'boolean',
        'state_certificate'       => 'boolean',
        'featured_profile'        => 'boolean',
        'instructor_consultation' => 'boolean',
        'price'                   => 'decimal:2',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}