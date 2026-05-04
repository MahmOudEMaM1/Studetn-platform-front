import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, catchError, map, of, switchMap } from 'rxjs';

import { appRouteLinks } from '../../core/routing/app-route-paths';
import { CatalogTabsApiService } from '../../data-access/catalog/catalog-tabs-api.service';
import {
  CatalogQuizQuestion,
  CatalogQuizReviewAnswer,
  CatalogQuizReviewResult
} from '../../data-access/catalog/catalog-tabs.models';

@Component({
  selector: 'app-quiz-page',
  standalone: true,
  imports: [],
  templateUrl: './quiz-page.component.html',
  styleUrl: './quiz-page.component.scss'
})
export class QuizPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly catalogTabsApi = inject(CatalogTabsApiService);

  protected readonly questions = signal<CatalogQuizQuestion[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly selectedAnswers = signal<Record<string, string>>({});
  protected readonly submitted = signal(false);
  protected readonly isSubmittingReview = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');
  protected readonly reviewError = signal('');
  protected readonly reviewResult = signal<CatalogQuizReviewResult | null>(null);
  protected readonly isReviewModalOpen = signal(false);
  protected readonly topicId = signal('');
  protected readonly topicTitle = signal('Topic quiz');
  protected readonly tabId = signal('');
  protected readonly tabTitle = signal('Course contents');

  protected readonly currentQuestion = computed(
    () => this.questions()[this.currentIndex()] ?? null
  );
  protected readonly isLastQuestion = computed(
    () => this.currentIndex() === this.questions().length - 1
  );
  protected readonly answeredCount = computed(
    () => Object.keys(this.selectedAnswers()).length
  );
  protected readonly progressLabel = computed(() => {
    const total = this.questions().length;

    return total > 0 ? `Question ${this.currentIndex() + 1} of ${total}` : 'No questions';
  });
  protected readonly backToTopicLink = computed(() => {
    const tabId = this.tabId();

    return tabId ? [appRouteLinks.courseContents, tabId] : [appRouteLinks.courseContents];
  });
  protected readonly reviewCorrectCount = computed(
    () => this.reviewResult()?.answers.filter((answer) => answer.isCorrect).length ?? 0
  );

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        this.tabId.set(queryParams.get('tabId')?.trim() ?? '');
        this.topicTitle.set(queryParams.get('topicTitle')?.trim() || 'Topic quiz');
        this.tabTitle.set(queryParams.get('tabTitle')?.trim() || 'Course contents');
      });

    this.route.paramMap
      .pipe(
        map((params) => params.get('topicId')?.trim() ?? ''),
        switchMap((topicId) => {
          this.topicId.set(topicId);
          this.isLoading.set(true);
          this.loadError.set('');
          this.questions.set([]);
          this.currentIndex.set(0);
          this.selectedAnswers.set({});
          this.submitted.set(false);
          this.reviewResult.set(null);
          this.isReviewModalOpen.set(false);
          this.reviewError.set('');

          if (!topicId) {
            this.isLoading.set(false);
            return of<CatalogQuizQuestion[]>([]);
          }

          return this.catalogTabsApi.getTopicQuizById(topicId);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (questions) => {
          this.questions.set(questions);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(this.extractErrorMessage(error));
          this.isLoading.set(false);
        }
      });
  }

  protected selectOption(choiceKey: string): void {
    const question = this.currentQuestion();

    if (!question || this.submitted()) {
      return;
    }

    this.selectedAnswers.update((answers) => ({
      ...answers,
      [question.id]: choiceKey
    }));
  }

  protected nextQuestion(): void {
    if (!this.isLastQuestion()) {
      this.currentIndex.update((index) => index + 1);
    }
  }

  protected previousQuestion(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((index) => index - 1);
    }
  }

  protected submitQuiz(): void {
    if (this.submitted() || this.isSubmittingReview() || !this.topicId()) {
      return;
    }

    this.isSubmittingReview.set(true);
    this.reviewError.set('');

    const payload = {
      answers: this.buildAnswerPayload()
    };

    this.catalogTabsApi
      .submitTopicQuiz(this.topicId(), payload)
      .pipe(catchError(() => EMPTY))
      .subscribe();

    this.catalogTabsApi
      .reviewTopicQuiz(this.topicId(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.reviewResult.set(result);
          this.submitted.set(true);
          this.isReviewModalOpen.set(true);
          this.isSubmittingReview.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.reviewError.set(this.extractReviewErrorMessage(error));
          this.isSubmittingReview.set(false);
        }
      });
  }

  protected restartQuiz(): void {
    this.currentIndex.set(0);
    this.selectedAnswers.set({});
    this.submitted.set(false);
    this.reviewResult.set(null);
    this.isReviewModalOpen.set(false);
    this.reviewError.set('');
  }

  protected isSelected(choiceKey: string): boolean {
    const question = this.currentQuestion();

    return question ? this.selectedAnswers()[question.id] === choiceKey : false;
  }

  protected questionCount(): number {
    return this.questions().length;
  }

  protected closeReviewModal(): void {
    this.isReviewModalOpen.set(false);
  }

  protected trackReviewAnswer(index: number, answer: CatalogQuizReviewAnswer): string {
    return `${answer.questionId}-${index}`;
  }

  protected isReviewChoiceCorrect(
    answer: CatalogQuizReviewAnswer,
    choice: CatalogQuizReviewAnswer['choices'][number]
  ): boolean {
    const normalizedChoiceText = choice.text?.trim();
    const normalizedCorrectText = answer.correctAnswerText?.trim() || answer.correctAnswer?.trim();

    if (normalizedCorrectText && normalizedChoiceText) {
      return normalizedChoiceText === normalizedCorrectText;
    }

    return answer.isCorrect && answer.selectedAnswer === choice.key;
  }

  protected isReviewChoiceSelected(
    answer: CatalogQuizReviewAnswer,
    choice: CatalogQuizReviewAnswer['choices'][number]
  ): boolean {
    return answer.selectedAnswer === choice.key;
  }

  protected isReviewChoiceWrong(
    answer: CatalogQuizReviewAnswer,
    choice: CatalogQuizReviewAnswer['choices'][number]
  ): boolean {
    return this.isReviewChoiceSelected(answer, choice) && !this.isReviewChoiceCorrect(answer, choice);
  }

  private buildAnswerPayload(): { question_id: number | string; selected_answer: string }[] {
    return this.questions()
      .map((question) => {
        const selectedAnswer = this.selectedAnswers()[question.id];

        if (!selectedAnswer) {
          return null;
        }

        return {
          question_id: /^\d+$/.test(question.id) ? Number(question.id) : question.id,
          selected_answer: selectedAnswer
        };
      })
      .filter((answer): answer is { question_id: number | string; selected_answer: string } =>
        answer !== null
      );
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const fallbackMessage =
      'We could not load the quiz for this topic right now. Please try again in a moment.';
    const errorMessage = error.error?.message;

    return typeof errorMessage === 'string' && errorMessage.trim().length > 0
      ? errorMessage
      : fallbackMessage;
  }

  private extractReviewErrorMessage(error: HttpErrorResponse): string {
    const fallbackMessage =
      'We could not review this quiz right now. Please try again in a moment.';
    const errorMessage = error.error?.message;

    return typeof errorMessage === 'string' && errorMessage.trim().length > 0
      ? errorMessage
      : fallbackMessage;
  }
}
