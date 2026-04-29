<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class CourseReview extends Model
{
    protected $fillable = [
        'user_id', 'course_id', 'enrollment_id',
        'rating', 'comment',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}