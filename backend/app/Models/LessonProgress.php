<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class LessonProgress extends Model
{
    protected $fillable = [
        'user_id', 'lesson_id', 'enrollment_id',
        'is_completed', 'completed_at',
    ];

    protected $casts = [
        'is_completed'  => 'boolean',
        'completed_at'  => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}