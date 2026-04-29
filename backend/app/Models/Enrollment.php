<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $fillable = [
        'user_id', 'course_id', 'tokens_spent',
        'status', 'trial_decision_at', 'completed_at',
    ];

    protected $casts = [
        'trial_decision_at' => 'datetime',
        'completed_at'      => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lessonProgress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function quizAttempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function certificate()
    {
        return $this->hasOne(Certificate::class);
    }
}