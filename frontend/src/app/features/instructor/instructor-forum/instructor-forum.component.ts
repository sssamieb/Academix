import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../../core/services/forum.service';
import { InstructorCourseService } from '../../../core/services/instructor-course.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-instructor-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-forum.component.html',
  styleUrls: ['./instructor-forum.component.scss'],
})
export class InstructorForumComponent implements OnInit {
  courses:      any[] = [];
  selectedCourse: any = null;
  forumPosts:   any[] = [];
  isLoadingCourses = true;
  isLoadingPosts   = false;

  replyContent:  Record<number, string>  = {};
  isReplying:    Record<number, boolean> = {};
  expandedPost:  number | null = null;

  constructor(
    private forumService: ForumService,
    private courseService: InstructorCourseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseService.getCourses().subscribe({
      next: (res) => {
        this.courses         = res.courses.filter((c: any) => c.status === 'published');
        this.isLoadingCourses = false;
        if (this.courses.length > 0) {
          this.selectCourse(this.courses[0]);
        }
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingCourses = false; }
    });
  }

  selectCourse(course: any): void {
    this.selectedCourse = course;
    this.loadPosts();
  }

  loadPosts(): void {
    if (!this.selectedCourse) return;
    this.isLoadingPosts = true;
    this.forumPosts     = [];

    this.forumService.getPosts(this.selectedCourse.id).subscribe({
      next: (res) => {
        this.forumPosts     = res.posts;
        this.isLoadingPosts = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingPosts = false; }
    });
  }

  togglePost(postId: number): void {
    this.expandedPost = this.expandedPost === postId ? null : postId;
  }

  submitReply(postId: number): void {
    const content = this.replyContent[postId]?.trim();
    if (!content || this.isReplying[postId]) return;
    this.isReplying[postId] = true;

    this.forumService.createReply(this.selectedCourse.id, postId, content).subscribe({
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

    this.forumService.deletePost(this.selectedCourse.id, postId).subscribe({
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

    this.forumService.deleteReply(this.selectedCourse.id, postId, replyId).subscribe({
      next: () => {
        const post = this.forumPosts.find(p => p.id === postId);
        if (post) post.replies = post.replies.filter((r: any) => r.id !== replyId);
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() ?? '?';
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

  getTotalReplies(): number {
    return this.forumPosts.reduce((acc, p) => acc + (p.replies?.length ?? 0), 0);
  }

  getPendingPosts(): number {
    return this.forumPosts.filter(p => !p.replies?.length).length;
  }

  isPremium(user: any): boolean {
    return user?.plan?.type === 'premium';
  }
}