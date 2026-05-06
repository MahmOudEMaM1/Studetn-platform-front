import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationsCenterService } from '../../core/services/notifications-center.service';
import { CommunityApiService } from '../../data-access/community/community-api.service';
import { CommunityQuestion, CommunityReply } from '../../data-access/community/community.models';
import { LoginRole } from '../../data-access/auth/auth.models';

type ThreadFilter = 'all' | 'unanswered' | 'solved';
type CommunityRole = Extract<LoginRole, 'student' | 'teacher'>;

@Component({
  selector: 'app-student-community',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './student-community.component.html',
  styleUrl: './student-community.component.scss'
})
export class StudentCommunityComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authSession = inject(AuthSessionService);
  private readonly notificationsCenter = inject(NotificationsCenterService);
  private readonly communityApi = inject(CommunityApiService);
  private readonly route = inject(ActivatedRoute);
  private lastHandledRealtimeNotificationId: string | null = null;

  protected readonly activeUser = this.authSession.currentUser;
  protected readonly activeUserName = computed(
    () => this.activeUser()?.full_name || this.activeUser()?.username || 'Community member'
  );
  protected readonly activeRole = computed<CommunityRole>(
    () => (this.authSession.getCurrentUserRole() === 'teacher' ? 'teacher' : 'student')
  );
  protected readonly isStudentView = computed(() => this.activeRole() === 'student');
  protected readonly isTeacherView = computed(() => this.activeRole() === 'teacher');
  protected readonly canReply = computed(() => this.isStudentView() || this.isTeacherView());

  protected readonly filters: { key: ThreadFilter; label: string }[] = [
    { key: 'all', label: 'All questions' },
    { key: 'unanswered', label: 'Needs reply' },
    { key: 'solved', label: 'Answered' }
  ];

  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');
  protected readonly selectedFilter = signal<ThreadFilter>('all');
  protected readonly questionDraft = signal('');
  protected readonly replyDraft = signal('');
  protected readonly isSubmittingQuestion = signal(false);
  protected readonly isSubmittingReply = signal(false);
  protected readonly questions = signal<CommunityQuestion[]>([]);
  protected readonly selectedQuestionId = signal<number | null>(null);

  protected readonly filteredQuestions = computed(() => {
    const filter = this.selectedFilter();
    const questions = [...this.questions()];

    switch (filter) {
      case 'unanswered':
        return questions.filter((question) => !question.solved);
      case 'solved':
        return questions.filter((question) => question.solved);
      default:
        return questions;
    }
  });

  protected readonly selectedQuestion = computed(() => {
    const activeId = this.selectedQuestionId();
    const visibleQuestions = this.filteredQuestions();

    return (
      visibleQuestions.find((question) => question.id === activeId) ||
      visibleQuestions[0] ||
      this.questions()[0] ||
      null
    );
  });

  protected readonly totalReplies = computed(() =>
    this.questions().reduce((count, question) => count + question.replies.length, 0)
  );

  protected readonly unansweredCount = computed(
    () => this.questions().filter((question) => !question.solved).length
  );

  protected readonly headerEyebrow = computed(() =>
    this.isTeacherView() ? 'Teacher Community' : 'Student Community'
  );

  protected readonly heroTitle = computed(() =>
    this.isTeacherView()
      ? 'Review student questions, jump into threads, and guide the class clearly.'
      : 'Ask the class, learn in threads, and keep the conversation moving.'
  );

  protected readonly heroDescription = computed(() =>
    this.isTeacherView()
      ? 'See every student question in one place, reply where it matters most, and keep support visible for the whole class.'
      : 'Post a question, follow the discussion, and collect helpful answers from teachers in one clean feed.'
  );

  constructor() {
    effect(() => {
      const notification = this.notificationsCenter.latestRealtimeNotification();

      if (
        !notification ||
        notification.id === this.lastHandledRealtimeNotificationId ||
        !this.shouldRefreshForNotification(notification)
      ) {
        return;
      }

      this.lastHandledRealtimeNotificationId = notification.id;

      if (notification.questionId !== null) {
        this.selectedQuestionId.set(notification.questionId);
      }

      this.loadQuestions();
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const rawQuestionId = params.get('questionId');
      const questionId = rawQuestionId ? Number(rawQuestionId) : null;

      if (questionId && Number.isFinite(questionId)) {
        this.selectedQuestionId.set(questionId);
      }
    });

    this.loadQuestions();
  }

  protected setFilter(filter: ThreadFilter): void {
    this.selectedFilter.set(filter);

    const visibleQuestions = this.filteredQuestions();
    const currentId = this.selectedQuestionId();

    if (!visibleQuestions.some((question) => question.id === currentId) && visibleQuestions[0]) {
      this.selectedQuestionId.set(visibleQuestions[0].id);
    }
  }

  protected selectQuestion(questionId: number): void {
    this.selectedQuestionId.set(questionId);
  }

  protected submitQuestion(): void {
    const question = this.questionDraft().trim();

    if (!this.isStudentView() || !question || this.isSubmittingQuestion()) {
      return;
    }

    this.isSubmittingQuestion.set(true);

    this.communityApi
      .createStudentQuestion(question)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdQuestion) => {
          this.questions.update((questions) => [createdQuestion, ...questions]);
          this.selectedQuestionId.set(createdQuestion.id);
          this.questionDraft.set('');
          this.isSubmittingQuestion.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(this.extractErrorMessage(error, 'We could not post the question.'));
          this.isSubmittingQuestion.set(false);
        }
      });
  }

  protected submitReply(): void {
    const reply = this.replyDraft().trim();
    const selectedQuestion = this.selectedQuestion();

    if (!this.canReply() || !reply || !selectedQuestion || this.isSubmittingReply()) {
      return;
    }

    this.isSubmittingReply.set(true);

    this.communityApi
      .createReply(this.activeRole(), selectedQuestion.id, reply)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdReply) => {
          this.questions.update((questions) =>
            questions.map((question) =>
              question.id === selectedQuestion.id
                ? {
                    ...question,
                    replies: [...question.replies, createdReply],
                    solved: true
                  }
                : question
            )
          );
          this.replyDraft.set('');
          this.isSubmittingReply.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(this.extractErrorMessage(error, 'We could not post the reply.'));
          this.isSubmittingReply.set(false);
        }
      });
  }

  protected trackReply(_index: number, reply: CommunityReply): number {
    return reply.id;
  }

  private loadQuestions(): void {
    this.communityApi
      .getQuestions(this.activeRole())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (questions) => {
          this.questions.set(questions);
          const preferredQuestionId = this.selectedQuestionId();
          const hasPreferredQuestion = questions.some((question) => question.id === preferredQuestionId);

          this.selectedQuestionId.set(hasPreferredQuestion ? preferredQuestionId : (questions[0]?.id ?? null));
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(
            this.extractErrorMessage(error, 'We could not load the community feed right now.')
          );
          this.isLoading.set(false);
        }
      });
  }

  private shouldRefreshForNotification(notification: { readonly type: string }): boolean {
    const role = this.activeRole();

    return (
      (role === 'student' && notification.type === 'student_question_replied') ||
      (role === 'teacher' && notification.type === 'student_question_created')
    );
  }

  private extractErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const errorMessage = error.error?.message;

    return typeof errorMessage === 'string' && errorMessage.trim().length > 0
      ? errorMessage
      : fallbackMessage;
  }
}
