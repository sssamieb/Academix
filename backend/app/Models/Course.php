<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = [
        'instructor_id', 'category_id', 'title', 'slug',
        'short_description', 'description', 'thumbnail',
        'level', 'status', 'token_price', 'rejection_reason',
        'submitted_at', 'approved_at', 'launch_date',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'approved_at'  => 'datetime',
        'launch_date'  => 'datetime',
    ];

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function category()
    {
        return $this->belongsTo(CourseCategory::class);
    }

    public function sections()
    {
        return $this->hasMany(CourseSection::class)->orderBy('order');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function reviews()
    {
        return $this->hasMany(CourseReview::class);
    }

    public function finalExam()
    {
        return $this->hasOne(Quiz::class)->where('type', 'exam');
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }
}