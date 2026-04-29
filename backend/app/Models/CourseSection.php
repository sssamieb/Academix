<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class CourseSection extends Model
{
    protected $fillable = [
        'course_id', 'title', 'order',
        'presentation_content', 'is_presentation', 'is_final_exam'
    ];

    protected $casts = [
        'is_presentation' => 'boolean',
        'is_final_exam'   => 'boolean',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'section_id')->orderBy('order');
    }
}