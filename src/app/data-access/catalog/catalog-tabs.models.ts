export interface CatalogTab {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly imageUrl: string | null;
  readonly badge: string | null;
  readonly tags: string[];
}

export interface CatalogTabApiItem {
  readonly id?: string | number | null;
  readonly title?: string | null;
  readonly name?: string | null;
  readonly label?: string | null;
  readonly subtitle?: string | null;
  readonly description?: string | null;
  readonly summary?: string | null;
  readonly image?: string | null;
  readonly image_url?: string | null;
  readonly thumbnail?: string | null;
  readonly cover?: string | null;
  readonly badge?: string | null;
  readonly status?: string | null;
  readonly tags?: unknown;
  readonly categories?: unknown;
}

export interface CatalogTabsResponse {
  readonly data?: CatalogTabApiItem[] | { readonly tabs?: CatalogTabApiItem[] | null } | null;
  readonly tabs?: CatalogTabApiItem[] | null;
  readonly items?: CatalogTabApiItem[] | null;
}

export interface CatalogTopic {
  readonly id: string;
  readonly tabId: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly termsCount: number;
  readonly questionsCount: number;
}

export interface CatalogTabDetails {
  readonly id: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly topicsCount: number;
  readonly topics: CatalogTopic[];
}

export interface CatalogTopicApiItem {
  readonly id?: string | number | null;
  readonly tab_id?: string | number | null;
  readonly name?: string | null;
  readonly sort_order?: number | null;
  readonly terms_count?: number | null;
  readonly questions_count?: number | null;
}

export interface CatalogTabDetailsApiItem {
  readonly id?: string | number | null;
  readonly name?: string | null;
  readonly sort_order?: number | null;
  readonly topics_count?: number | null;
  readonly topics?: CatalogTopicApiItem[] | null;
}

export interface CatalogTabDetailsResponse {
  readonly data?: CatalogTabDetailsApiItem | null;
}

export interface CatalogTopicCategoryApiItem {
  readonly id?: string | number | null;
  readonly term_id?: string | number | null;
  readonly parent_id?: string | number | null;
  readonly name?: string | null;
  readonly explanation?: string | null;
  readonly sort_order?: number | null;
  readonly children?: CatalogTopicCategoryApiItem[] | null;
}

export interface CatalogTopicTermApiItem {
  readonly id?: string | number | null;
  readonly topic_id?: string | number | null;
  readonly name?: string | null;
  readonly sort_order?: number | null;
  readonly correct_explanation?: string | null;
  readonly images?: unknown;
  readonly categories?: CatalogTopicCategoryApiItem[] | null;
}

export interface CatalogTopicParentApiItem {
  readonly id?: string | number | null;
  readonly name?: string | null;
  readonly sort_order?: number | null;
}

export interface CatalogTopicDetailsApiItem {
  readonly id?: string | number | null;
  readonly tab_id?: string | number | null;
  readonly name?: string | null;
  readonly sort_order?: number | null;
  readonly terms_count?: number | null;
  readonly questions_count?: number | null;
  readonly tab?: CatalogTopicParentApiItem | null;
  readonly terms?: CatalogTopicTermApiItem[] | null;
}

export interface CatalogTopicDetailsResponse {
  readonly data?: CatalogTopicDetailsApiItem | null;
}

export interface CatalogTopicCategory {
  readonly id: string;
  readonly termId: string;
  readonly parentId: string | null;
  readonly title: string;
  readonly explanation: string;
  readonly sortOrder: number;
  readonly children: CatalogTopicCategory[];
}

export interface CatalogTopicTerm {
  readonly id: string;
  readonly topicId: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly explanation: string;
  readonly imageUrls: string[];
  readonly categories: CatalogTopicCategory[];
}

export interface CatalogTopicDetails {
  readonly id: string;
  readonly tabId: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly termsCount: number;
  readonly questionsCount: number;
  readonly tabTitle: string;
  readonly terms: CatalogTopicTerm[];
}

export interface CatalogQuizChoiceApiItem {
  readonly key?: string | null;
  readonly text?: string | null;
}

export interface CatalogQuizQuestionApiItem {
  readonly id?: string | number | null;
  readonly topic_id?: string | number | null;
  readonly question_text?: string | null;
  readonly sort_order?: number | null;
  readonly choices?: CatalogQuizChoiceApiItem[] | null;
}

export interface CatalogTopicQuizResponse {
  readonly data?: CatalogQuizQuestionApiItem[] | null;
}

export interface CatalogQuizChoice {
  readonly key: string;
  readonly text: string;
}

export interface CatalogQuizQuestion {
  readonly id: string;
  readonly topicId: string;
  readonly questionText: string;
  readonly sortOrder: number;
  readonly choices: CatalogQuizChoice[];
}

export interface CatalogQuizReviewAnswerPayload {
  readonly question_id: number | string;
  readonly selected_answer: string;
}

export interface CatalogQuizReviewRequest {
  readonly answers: CatalogQuizReviewAnswerPayload[];
}

export interface CatalogQuizReviewChoiceApiItem {
  readonly key?: string | null;
  readonly text?: string | null;
}

export interface CatalogQuizReviewAnswerApiItem {
  readonly question_id?: string | number | null;
  readonly question_text?: string | null;
  readonly choices?: CatalogQuizReviewChoiceApiItem[] | null;
  readonly selected_answer?: string | null;
  readonly selected_answer_text?: string | null;
  readonly correct_answer?: string | null;
  readonly correct_answer_text?: string | null;
  readonly reference?: string | null;
  readonly is_correct?: boolean | null;
}

export interface CatalogQuizReviewResultApiItem {
  readonly topic_id?: string | number | null;
  readonly topic_name?: string | null;
  readonly answers?: CatalogQuizReviewAnswerApiItem[] | null;
}

export interface CatalogQuizReviewResponse {
  readonly data?: CatalogQuizReviewResultApiItem | null;
}

export interface CatalogQuizSubmitTopicApiItem {
  readonly id?: string | number | null;
  readonly name?: string | null;
}

export interface CatalogQuizSubmitResultApiItem {
  readonly id?: string | number | null;
  readonly topic?: CatalogQuizSubmitTopicApiItem | null;
  readonly total_questions?: number | null;
  readonly correct_answers_count?: number | null;
  readonly wrong_answers_count?: number | null;
  readonly score_percentage?: string | number | null;
  readonly passed?: boolean | null;
  readonly started_at?: string | null;
  readonly submitted_at?: string | null;
}

export interface CatalogQuizSubmitResponse {
  readonly message?: string | null;
  readonly data?: CatalogQuizSubmitResultApiItem | null;
}

export interface CatalogQuizReviewChoice {
  readonly key: string;
  readonly text: string;
}

export interface CatalogQuizReviewAnswer {
  readonly questionId: string;
  readonly questionText: string;
  readonly choices: CatalogQuizReviewChoice[];
  readonly selectedAnswer: string | null;
  readonly selectedAnswerText: string | null;
  readonly correctAnswer: string | null;
  readonly correctAnswerText: string | null;
  readonly reference: string | null;
  readonly isCorrect: boolean;
}

export interface CatalogQuizReviewResult {
  readonly topicId: string;
  readonly topicName: string;
  readonly answers: CatalogQuizReviewAnswer[];
}

export interface CatalogQuizSubmitResult {
  readonly id: string;
  readonly topicId: string;
  readonly topicName: string;
  readonly totalQuestions: number;
  readonly correctAnswersCount: number;
  readonly wrongAnswersCount: number;
  readonly scorePercentage: number;
  readonly passed: boolean;
  readonly startedAt: string | null;
  readonly submittedAt: string | null;
  readonly message: string;
}
