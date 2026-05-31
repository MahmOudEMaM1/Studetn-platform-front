export interface TeacherDashboardWeakStudentApiItem {
  readonly student_id?: number | null;
  readonly user_id?: number | null;
  readonly full_name?: string | null;
  readonly email?: string | null;
  readonly average_score?: number | null;
  readonly attempts_count?: number | null;
}

export interface TeacherDashboardTopStudentApiItem {
  readonly student_id?: number | null;
  readonly user_id?: number | null;
  readonly full_name?: string | null;
  readonly email?: string | null;
  readonly average_score?: number | null;
  readonly best_score?: number | null;
  readonly attempts_count?: number | null;
}

export interface TeacherDashboardWeakTopicApiItem {
  readonly topic_id?: number | null;
  readonly topic_name?: string | null;
  readonly average_score?: number | null;
  readonly attempts_count?: number | null;
  readonly failed_attempts_count?: number | null;
}

export interface TeacherDashboardResponse {
  readonly data?: {
    readonly students_count?: number | null;
    readonly students_with_attempts_count?: number | null;
    readonly total_attempts_count?: number | null;
    readonly average_score?: number | null;
    readonly passed_attempts_count?: number | null;
    readonly failed_attempts_count?: number | null;
    readonly weak_students?: TeacherDashboardWeakStudentApiItem[] | null;
    readonly top_students?: TeacherDashboardTopStudentApiItem[] | null;
    readonly weak_topics?: TeacherDashboardWeakTopicApiItem[] | null;
  } | null;
}

export interface TeacherStudentApiItem {
  readonly id?: number | null;
  readonly user_id?: number | null;
  readonly full_name?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly attempts_count?: number | null;
  readonly completed_quizzes?: number | null;
  readonly average_score?: number | null;
  readonly best_score?: number | null;
}

export interface TeacherStudentsResponse {
  readonly data?: TeacherStudentApiItem[] | null;
}

export interface TeacherStudentScoreRangeApiItem {
  readonly student_id?: number | null;
  readonly studentId?: number | null;
  readonly user_id?: number | null;
  readonly userId?: number | null;
  readonly full_name?: string | null;
  readonly fullName?: string | null;
  readonly email?: string | null;
  readonly attempts_count?: number | null;
  readonly attemptsCount?: number | null;
  readonly best_score?: number | null;
  readonly bestScore?: number | null;
  readonly low_score?: number | null;
  readonly lowScore?: number | null;
}

export interface TeacherStudentIdentityApiItem {
  readonly id?: number | null;
  readonly user_id?: number | null;
  readonly full_name?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
}

export interface TeacherStudentProgressSummaryApiItem {
  readonly completed_quizzes?: number | null;
  readonly attempts_count?: number | null;
  readonly average_score?: number | null;
  readonly best_score?: number | null;
  readonly passed_quizzes_count?: number | null;
  readonly failed_quizzes_count?: number | null;
}

export interface TeacherStudentTopicProgressApiItem {
  readonly topic_id?: number | null;
  readonly topic_name?: string | null;
  readonly attempts_count?: number | null;
  readonly latest_score?: number | null;
  readonly best_score?: number | null;
  readonly average_score?: number | null;
  readonly is_improving?: boolean | null;
}

export interface TeacherStudentProgressResponse {
  readonly data?: {
    readonly student?: TeacherStudentIdentityApiItem | null;
    readonly summary?: TeacherStudentProgressSummaryApiItem | null;
    readonly topics?: TeacherStudentTopicProgressApiItem[] | null;
  } | null;
}

export interface TeacherQuizAttemptTopicApiItem {
  readonly id?: number | null;
  readonly name?: string | null;
}

export interface TeacherQuizAttemptApiItem {
  readonly id?: number | null;
  readonly topic?: TeacherQuizAttemptTopicApiItem | null;
  readonly total_questions?: number | null;
  readonly correct_answers_count?: number | null;
  readonly wrong_answers_count?: number | null;
  readonly score_percentage?: number | string | null;
  readonly passed?: boolean | null;
  readonly started_at?: string | null;
  readonly submitted_at?: string | null;
}

export interface TeacherStudentTopicQuizAttemptsResponse {
  readonly data?: {
    readonly student?: TeacherStudentIdentityApiItem | null;
    readonly topic?: TeacherQuizAttemptTopicApiItem | null;
    readonly attempts?: TeacherQuizAttemptApiItem[] | null;
  } | null;
}

export interface TeacherQuizAttemptSummaryApiItem {
  readonly total_questions?: number | null;
  readonly correct_answers_count?: number | null;
  readonly wrong_answers_count?: number | null;
  readonly score_percentage?: number | string | null;
  readonly passed?: boolean | null;
  readonly started_at?: string | null;
  readonly submitted_at?: string | null;
}

export interface TeacherQuizAttemptAnswerChoiceApiItem {
  readonly key?: string | null;
  readonly text?: string | null;
}

export interface TeacherQuizAttemptAnswerApiItem {
  readonly question_id?: number | null;
  readonly question_text?: string | null;
  readonly choices?: TeacherQuizAttemptAnswerChoiceApiItem[] | null;
  readonly selected_answer?: string | null;
  readonly selected_answer_text?: string | null;
  readonly correct_answer?: string | null;
  readonly correct_answer_text?: string | null;
  readonly is_correct?: boolean | null;
}

export interface TeacherQuizAttemptDetailResponse {
  readonly data?: {
    readonly id?: number | null;
    readonly student?: TeacherStudentIdentityApiItem | null;
    readonly topic?: TeacherQuizAttemptTopicApiItem | null;
    readonly summary?: TeacherQuizAttemptSummaryApiItem | null;
    readonly answers?: TeacherQuizAttemptAnswerApiItem[] | null;
  } | null;
}

export interface TeacherDashboardStudentSummary {
  readonly studentId: number;
  readonly userId: number;
  readonly fullName: string;
  readonly email: string;
  readonly averageScore: number;
  readonly attemptsCount: number;
  readonly bestScore?: number;
}

export interface TeacherDashboardWeakTopic {
  readonly topicId: number;
  readonly topicName: string;
  readonly averageScore: number;
  readonly attemptsCount: number;
  readonly failedAttemptsCount: number;
}

export interface TeacherDashboardSummary {
  readonly studentsCount: number;
  readonly studentsWithAttemptsCount: number;
  readonly totalAttemptsCount: number;
  readonly averageScore: number;
  readonly passedAttemptsCount: number;
  readonly failedAttemptsCount: number;
  readonly weakStudents: TeacherDashboardStudentSummary[];
  readonly topStudents: TeacherDashboardStudentSummary[];
  readonly weakTopics: TeacherDashboardWeakTopic[];
}

export interface TeacherStudentListItem {
  readonly studentId: number;
  readonly userId: number;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly attemptsCount: number;
  readonly completedQuizzes: number;
  readonly averageScore: number;
  readonly bestScore: number;
}

export interface TeacherStudentScoreRange {
  readonly studentId: number;
  readonly userId: number;
  readonly fullName: string;
  readonly email: string;
  readonly attemptsCount: number;
  readonly bestScore: number;
  readonly lowScore: number;
}

export interface TeacherStudentIdentity {
  readonly studentId: number;
  readonly userId: number;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
}

export interface TeacherStudentProgressSummary {
  readonly completedQuizzes: number;
  readonly attemptsCount: number;
  readonly averageScore: number;
  readonly bestScore: number;
  readonly passedQuizzesCount: number;
  readonly failedQuizzesCount: number;
}

export interface TeacherStudentTopicProgress {
  readonly topicId: number;
  readonly topicName: string;
  readonly attemptsCount: number;
  readonly latestScore: number;
  readonly bestScore: number;
  readonly averageScore: number;
  readonly isImproving: boolean;
}

export interface TeacherStudentProgress {
  readonly student: TeacherStudentIdentity;
  readonly summary: TeacherStudentProgressSummary;
  readonly topics: TeacherStudentTopicProgress[];
}

export interface TeacherQuizAttemptListItem {
  readonly attemptId: number;
  readonly topicId: number;
  readonly topicName: string;
  readonly totalQuestions: number;
  readonly correctAnswersCount: number;
  readonly wrongAnswersCount: number;
  readonly scorePercentage: number;
  readonly passed: boolean;
  readonly startedAt: string;
  readonly submittedAt: string;
}

export interface TeacherStudentTopicQuizAttempts {
  readonly student: TeacherStudentIdentity;
  readonly topic: {
    readonly topicId: number;
    readonly topicName: string;
  };
  readonly attempts: TeacherQuizAttemptListItem[];
}

export interface TeacherQuizAttemptAnswerChoice {
  readonly key: string;
  readonly text: string;
}

export interface TeacherQuizAttemptAnswer {
  readonly questionId: number;
  readonly questionText: string;
  readonly choices: TeacherQuizAttemptAnswerChoice[];
  readonly selectedAnswer: string;
  readonly selectedAnswerText: string;
  readonly correctAnswer: string;
  readonly correctAnswerText: string;
  readonly isCorrect: boolean;
}

export interface TeacherQuizAttemptDetail {
  readonly attemptId: number;
  readonly student: TeacherStudentIdentity;
  readonly topic: {
    readonly topicId: number;
    readonly topicName: string;
  };
  readonly summary: TeacherQuizAttemptListItem;
  readonly answers: TeacherQuizAttemptAnswer[];
}
