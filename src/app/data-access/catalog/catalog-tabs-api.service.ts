import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import { SKIP_APP_LOADING } from '../../core/interceptors/app-loading.interceptor';
import {
  CatalogTab,
  CatalogTabDetails,
  CatalogTabDetailsApiItem,
  CatalogTabDetailsResponse,
  CatalogTabApiItem,
  CatalogQuizChoice,
  CatalogQuizChoiceApiItem,
  CatalogQuizQuestion,
  CatalogQuizQuestionApiItem,
  CatalogQuizReviewAnswer,
  CatalogQuizReviewAnswerApiItem,
  CatalogQuizReviewChoice,
  CatalogQuizReviewChoiceApiItem,
  CatalogQuizReviewRequest,
  CatalogQuizReviewResult,
  CatalogQuizReviewResponse,
  CatalogQuizSubmitResponse,
  CatalogQuizSubmitResult,
  CatalogTopicCategory,
  CatalogTopicCategoryApiItem,
  CatalogTopicDetails,
  CatalogTopicDetailsApiItem,
  CatalogTopicDetailsResponse,
  CatalogTopicTerm,
  CatalogTopicTermApiItem,
  CatalogTopic,
  CatalogTopicApiItem,
  CatalogTabsResponse,
  CatalogTopicQuizResponse
} from './catalog-tabs.models';

@Injectable({
  providedIn: 'root'
})
export class CatalogTabsApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getTabs(): Observable<CatalogTab[]> {
    return this.http
      .get<CatalogTabsResponse | CatalogTabApiItem[]>(this.appConfig.catalogTabsUrl)
      .pipe(map((response) => this.extractTabs(response).map((item, index) => this.mapTab(item, index))));
  }

  getTabById(tabId: string): Observable<CatalogTabDetails> {
    return this.http
      .get<CatalogTabDetailsResponse>(this.appConfig.catalogTabByIdUrl(tabId))
      .pipe(map((response) => this.mapTabDetails(response.data, tabId)));
  }

  getTopicById(topicId: string): Observable<CatalogTopicDetails> {
    return this.http
      .get<CatalogTopicDetailsResponse>(this.appConfig.catalogTopicByIdUrl(topicId))
      .pipe(map((response) => this.mapTopicDetails(response.data, topicId)));
  }

  getTopicQuizById(topicId: string): Observable<CatalogQuizQuestion[]> {
    return this.http
      .get<CatalogTopicQuizResponse>(this.appConfig.catalogTopicQuizByIdUrl(topicId))
      .pipe(
        map((response) =>
          (response.data ?? [])
            .map((question, index) => this.mapQuizQuestion(question, topicId, index))
            .sort((firstQuestion, secondQuestion) => firstQuestion.sortOrder - secondQuestion.sortOrder)
        )
      );
  }

  reviewTopicQuiz(
    topicId: string,
    payload: CatalogQuizReviewRequest
  ): Observable<CatalogQuizReviewResult> {
    return this.http
      .post<CatalogQuizReviewResponse>(this.appConfig.studentTopicQuizReviewUrl(topicId), payload)
      .pipe(map((response) => this.mapQuizReviewResult(response.data, topicId)));
  }

  submitTopicQuiz(
    topicId: string,
    payload: CatalogQuizReviewRequest
  ): Observable<CatalogQuizSubmitResult> {
    return this.http
      .post<CatalogQuizSubmitResponse>(this.appConfig.studentTopicQuizSubmitUrl(topicId), payload, {
        context: new HttpContext().set(SKIP_APP_LOADING, true)
      })
      .pipe(map((response) => this.mapQuizSubmitResult(response, topicId)));
  }

  private extractTabs(
    response: CatalogTabsResponse | CatalogTabApiItem[]
  ): CatalogTabApiItem[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.tabs)) {
      return response.tabs;
    }

    if (Array.isArray(response.items)) {
      return response.items;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (response.data && 'tabs' in response.data && Array.isArray(response.data.tabs)) {
      return response.data.tabs;
    }

    return [];
  }

  private mapTab(item: CatalogTabApiItem, index: number): CatalogTab {
    const title = this.pickFirstString(item.title, item.name, item.label, `Tab ${index + 1}`);
    const subtitle = this.pickFirstString(
      item.subtitle,
      item.description,
      item.summary,
      'Course tab'
    );
    const badge = this.normalizeBadge(item.badge ?? item.status ?? null);

    return {
      id: String(item.id ?? index + 1),
      title,
      subtitle,
      imageUrl: this.pickFirstString(
        item.image_url,
        item.image,
        item.thumbnail,
        item.cover,
        null
      ),
      badge,
      tags: this.extractTags(item.tags ?? item.categories)
    };
  }

  private mapTabDetails(
    item: CatalogTabDetailsApiItem | null | undefined,
    fallbackTabId: string
  ): CatalogTabDetails {
    const topics = (item?.topics ?? [])
      .map((topic, index) => this.mapTopic(topic, fallbackTabId, index))
      .sort((firstTopic, secondTopic) => firstTopic.sortOrder - secondTopic.sortOrder);

    return {
      id: String(item?.id ?? fallbackTabId),
      title: this.pickFirstString(item?.name, `Tab ${fallbackTabId}`),
      sortOrder: item?.sort_order ?? 0,
      topicsCount: item?.topics_count ?? topics.length,
      topics
    };
  }

  private mapTopic(
    item: CatalogTopicApiItem,
    fallbackTabId: string,
    index: number
  ): CatalogTopic {
    return {
      id: String(item.id ?? index + 1),
      tabId: String(item.tab_id ?? fallbackTabId),
      title: this.pickFirstString(item.name, `Topic ${index + 1}`),
      sortOrder: item.sort_order ?? index,
      termsCount: item.terms_count ?? 0,
      questionsCount: item.questions_count ?? 0
    };
  }

  private mapTopicDetails(
    item: CatalogTopicDetailsApiItem | null | undefined,
    fallbackTopicId: string
  ): CatalogTopicDetails {
    const terms = (item?.terms ?? [])
      .map((term, index) => this.mapTerm(term, fallbackTopicId, index))
      .sort((firstTerm, secondTerm) => firstTerm.sortOrder - secondTerm.sortOrder);

    return {
      id: String(item?.id ?? fallbackTopicId),
      tabId: String(item?.tab_id ?? item?.tab?.id ?? ''),
      title: this.pickFirstString(item?.name, `Topic ${fallbackTopicId}`),
      sortOrder: item?.sort_order ?? 0,
      termsCount: item?.terms_count ?? terms.length,
      questionsCount: item?.questions_count ?? 0,
      tabTitle: this.pickFirstString(item?.tab?.name, ''),
      terms
    };
  }

  private mapTerm(
    item: CatalogTopicTermApiItem,
    fallbackTopicId: string,
    index: number
  ): CatalogTopicTerm {
    const termId = String(item.id ?? index + 1);

    return {
      id: termId,
      topicId: String(item.topic_id ?? fallbackTopicId),
      title: this.pickFirstString(item.name, `Term ${index + 1}`),
      sortOrder: item.sort_order ?? index,
      explanation: this.pickFirstString(item.correct_explanation, 'Explanation will be added soon.'),
      imageUrls: this.extractImageUrls(item.images),
      categories: (item.categories ?? [])
        .map((category, categoryIndex) => this.mapCategory(category, termId, categoryIndex))
        .sort((firstCategory, secondCategory) => firstCategory.sortOrder - secondCategory.sortOrder)
    };
  }

  private mapCategory(
    item: CatalogTopicCategoryApiItem,
    fallbackTermId: string,
    index: number
  ): CatalogTopicCategory {
    const children = (item.children ?? [])
      .map((child, childIndex) => this.mapCategory(child, fallbackTermId, childIndex))
      .sort((firstChild, secondChild) => firstChild.sortOrder - secondChild.sortOrder);

    return {
      id: String(item.id ?? index + 1),
      termId: String(item.term_id ?? fallbackTermId),
      parentId:
        item.parent_id === null || item.parent_id === undefined ? null : String(item.parent_id),
      title: this.pickFirstString(item.name, `Category ${index + 1}`),
      explanation: this.pickFirstString(item.explanation, ''),
      sortOrder: item.sort_order ?? index,
      children
    };
  }

  private mapQuizQuestion(
    item: CatalogQuizQuestionApiItem,
    fallbackTopicId: string,
    index: number
  ): CatalogQuizQuestion {
    return {
      id: String(item.id ?? index + 1),
      topicId: String(item.topic_id ?? fallbackTopicId),
      questionText: this.pickFirstString(item.question_text, `Question ${index + 1}`),
      sortOrder: item.sort_order ?? index,
      choices: (item.choices ?? []).map((choice, choiceIndex) =>
        this.mapQuizChoice(choice, choiceIndex)
      )
    };
  }

  private mapQuizChoice(item: CatalogQuizChoiceApiItem, index: number): CatalogQuizChoice {
    const fallbackKey = String.fromCharCode(65 + index);

    return {
      key: this.pickFirstString(item.key, fallbackKey),
      text: this.pickFirstString(item.text, `Choice ${fallbackKey}`)
    };
  }

  private mapQuizReviewResult(
    item: CatalogQuizReviewResponse['data'],
    fallbackTopicId: string
  ): CatalogQuizReviewResult {
    const answers = (item?.answers ?? []).map((answer, index) =>
      this.mapQuizReviewAnswer(answer, index)
    );

    return {
      topicId: String(item?.topic_id ?? fallbackTopicId),
      topicName: this.pickFirstString(item?.topic_name, 'Quiz review'),
      answers
    };
  }

  private mapQuizReviewAnswer(
    item: CatalogQuizReviewAnswerApiItem,
    index: number
  ): CatalogQuizReviewAnswer {
    return {
      questionId: String(item.question_id ?? index + 1),
      questionText: this.pickFirstString(item.question_text, `Question ${index + 1}`),
      choices: (item.choices ?? []).map((choice, choiceIndex) =>
        this.mapQuizReviewChoice(choice, choiceIndex)
      ),
      selectedAnswer: this.pickFirstString(item.selected_answer, null),
      selectedAnswerText: this.pickFirstString(item.selected_answer_text, null),
      correctAnswer: this.pickFirstString(item.correct_answer, null),
      correctAnswerText: this.pickFirstString(item.correct_answer_text, null),
      reference: this.pickFirstString(item.reference, null),
      isCorrect: item.is_correct === true
    };
  }

  private mapQuizReviewChoice(
    item: CatalogQuizReviewChoiceApiItem,
    index: number
  ): CatalogQuizReviewChoice {
    const fallbackKey = String.fromCharCode(65 + index);

    return {
      key: this.pickFirstString(item.key, fallbackKey),
      text: this.pickFirstString(item.text, '')
    };
  }

  private mapQuizSubmitResult(
    response: CatalogQuizSubmitResponse,
    fallbackTopicId: string
  ): CatalogQuizSubmitResult {
    const data = response.data;
    const scoreValue = data?.score_percentage;

    return {
      id: String(data?.id ?? ''),
      topicId: String(data?.topic?.id ?? fallbackTopicId),
      topicName: this.pickFirstString(data?.topic?.name, 'Topic quiz'),
      totalQuestions: data?.total_questions ?? 0,
      correctAnswersCount: data?.correct_answers_count ?? 0,
      wrongAnswersCount: data?.wrong_answers_count ?? 0,
      scorePercentage:
        typeof scoreValue === 'string' ? Number.parseFloat(scoreValue) || 0 : (scoreValue ?? 0),
      passed: data?.passed === true,
      startedAt: this.pickFirstString(data?.started_at, null),
      submittedAt: this.pickFirstString(data?.submitted_at, null),
      message: this.pickFirstString(response.message, 'Quiz submitted successfully.')
    };
  }

  private extractTags(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .slice(0, 4);
  }

  private extractImageUrls(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map((entry) => entry.trim());
  }

  private normalizeBadge(value: string | null): string | null {
    if (!value) {
      return null;
    }

    return value
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  private pickFirstString<TFallback extends string | null>(
    ...values: [...Array<string | null | undefined>, TFallback]
  ): string | TFallback {
    const fallback = values[values.length - 1] as TFallback;

    for (const value of values.slice(0, -1)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return fallback;
  }
}
