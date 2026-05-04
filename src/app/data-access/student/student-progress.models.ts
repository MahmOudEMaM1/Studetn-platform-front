export interface StudentProgressApiItem {
  readonly completed_quizzes?: number | null;
  readonly attempts_count?: number | null;
  readonly average_score?: number | null;
  readonly best_score?: number | null;
  readonly passed_quizzes_count?: number | null;
  readonly failed_quizzes_count?: number | null;
}

export interface StudentProgressResponse {
  readonly data?: StudentProgressApiItem | null;
}

export interface StudentProgress {
  readonly completedQuizzes: number;
  readonly attemptsCount: number;
  readonly averageScore: number;
  readonly bestScore: number;
  readonly passedQuizzesCount: number;
  readonly failedQuizzesCount: number;
}

export interface StudentQuizAttemptChartApiItem {
  readonly attempt_order?: number | null;
  readonly quiz_attempt_id?: number | null;
  readonly topic_id?: number | null;
  readonly topic_name?: string | null;
  readonly score_percentage?: number | null;
  readonly passed?: boolean | null;
  readonly submitted_at?: string | null;
}

export interface StudentQuizAttemptsChartResponse {
  readonly data?: StudentQuizAttemptChartApiItem[] | null;
}

export interface StudentQuizAttemptChartItem {
  readonly attemptOrder: number;
  readonly quizAttemptId: number;
  readonly topicId: number;
  readonly topicName: string;
  readonly scorePercentage: number;
  readonly passed: boolean;
  readonly submittedAt: string;
}
