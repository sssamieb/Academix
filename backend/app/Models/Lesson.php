<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = [
        'section_id', 'title', 'type',
        'video_url', 'article_content', 'notes',
        'duration', 'order', 'is_preview',
    ];

    protected $casts = [
        'is_preview' => 'boolean',
    ];

    public function section()
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function quiz()
    {
    return $this->hasOne(Quiz::class)->where('type', 'practice');
    }

    public function progress()
    {
        return $this->hasMany(LessonProgress::class);
    }
    
}