import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ForumService } from '../../../core/services/forum.service';
import { CourseService } from '../../../core/services/course.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-forum.component.html',
  styleUrls: ['./student-forum.component.scss'],
})
export class StudentForumComponent implements OnInit {
  courseId!:  number;
  course:     any = null;
  forumPosts: any[] = [];
  isLoading   = true;
  canPost     = false;
  isInstructor = false;

  newPostContent = '';
  isPosting      = false;
  replyContent:  Record<number, string>  = {};
  isReplying:    Record<number, boolean> = {};

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private forumService: ForumService,
    private courseService: CourseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadForum();
  }

  loadForum(): void {
    this.forumService.getPosts(this.courseId).subscribe({
      next: (res) => {
        this.forumPosts  = res.posts;
        this.canPost     = res.can_post;
        this.isInstructor = res.is_instructor;
        this.isLoading   = false;

        // Cargar info del curso para el header
        this.courseService.getStudentCourse(this.courseId).subscribe({
          next: (r) => { this.course = r.course; this.cdr.detectChanges(); }
        });

        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  submitPost(): void {
    if (!this.newPostContent.trim() || this.isPosting) return;
    this.isPosting = true;

    this.forumService.createPost(this.courseId, this.newPostContent).subscribe({
      next: (res) => {
        res.post.replies    = [];
        this.forumPosts.unshift(res.post);
        this.newPostContent = '';
        this.isPosting      = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isPosting = false;
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo publicar.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  submitReply(postId: number): void {
    const content = this.replyContent[postId]?.trim();
    if (!content || this.isReplying[postId]) return;
    this.isReplying[postId] = true;

    this.forumService.createReply(this.courseId, postId, content).subscribe({
      next: (res) => {
        const post = this.forumPosts.find(p => p.id === postId);
        if (post) {
          if (!post.replies) post.replies = [];
          post.replies.push(res.reply);
        }
        this.replyContent[postId] = '';
        this.isReplying[postId]   = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isReplying[postId] = false;
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo responder.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  async deletePost(postId: number): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar publicación?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
    });
    if (!result.isConfirmed) return;

    this.forumService.deletePost(this.courseId, postId).subscribe({
      next: () => {
        this.forumPosts = this.forumPosts.filter(p => p.id !== postId);
        this.cdr.detectChanges();
      }
    });
  }

  async deleteReply(postId: number, replyId: number): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar respuesta?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
    });
    if (!result.isConfirmed) return;

    this.forumService.deleteReply(this.courseId, postId, replyId).subscribe({
      next: () => {
        const post = this.forumPosts.find(p => p.id === postId);
        if (post) post.replies = post.replies.filter((r: any) => r.id !== replyId);
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() ?? '?';
  }

  getTimeAgo(dateStr: string): string {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days > 0)  return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (mins > 0)  return `hace ${mins}min`;
    return 'ahora mismo';
  }

  goBack(): void {
    this.router.navigate(['/student/my-courses', this.courseId]);
  }
}