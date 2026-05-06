<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ForumPost extends Model
{
    protected $fillable = ['course_id', 'user_id', 'content', 'is_pinned'];

    protected $casts = ['is_pinned' => 'boolean'];

    public function course()  { return $this->belongsTo(Course::class); }
    public function user()    { return $this->belongsTo(User::class); }
    public function replies() { return $this->hasMany(ForumReply::class, 'post_id')->orderBy('created_at'); }
}