<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstructorProfile extends Model
{
    protected $fillable = [
        'user_id', 'title', 'bio',
        'linkedin', 'github', 'twitter', 'website', 'avatar_color',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}