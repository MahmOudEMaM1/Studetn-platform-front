import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import { SKIP_APP_LOADING } from '../../core/interceptors/app-loading.interceptor';
import {
  CatalogQuizChoice,
  CatalogQuizChoiceApiItem,
  CatalogQuizQuestion,
  CatalogQuizReviewAnswer,
  CatalogQuizReviewAnswerApiItem,
  CatalogQuizReviewChoice,
  CatalogQuizReviewChoiceApiItem,
  CatalogQuizReviewRequest,
  CatalogQuizReviewResult,
  CatalogQuizSubmitResult,
  CatalogTab,
  CatalogTabApiItem,
  CatalogTabDetails,
  CatalogTabDetailsApiItem,
  CatalogTopic,
  CatalogTopicApiItem,
  CatalogTopicCategory,
  CatalogTopicCategoryApiItem,
  CatalogTopicDetails,
  CatalogTopicDetailsApiItem,
  CatalogTopicTerm,
  CatalogTopicTermApiItem
} from './catalog-tabs.models';

@Injectable({
  providedIn: 'root'
})
export class CatalogTabsApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getTabs(): Observable<CatalogTab[]> {
    return this.http
      .get<unknown>(this.appConfig.catalogTabsUrl)
      .pipe(map((response) => this.extractArray(response).map((item, index) => this.mapTab(item, index))));
  }

  getTabById(tabId: string): Observable<CatalogTabDetails> {
    return this.http
      .get<unknown>(this.appConfig.catalogTabByIdUrl(tabId))
      .pipe(map((response) => this.mapTabDetails(this.unwrapData(response), tabId)));
  }

  getTopicById(topicId: string): Observable<CatalogTopicDetails> {
    return this.http
      .get<unknown>(this.appConfig.catalogTopicByIdUrl(topicId))
      .pipe(map((response) => this.mapTopicDetails(this.unwrapData(response), topicId)));
  }

  getTopicQuizById(topicId: string): Observable<CatalogQuizQuestion[]> {
    return this.http
      .get<unknown>(this.appConfig.catalogTopicQuizByIdUrl(topicId))
      .pipe(
        map((response) =>
          this.extractArray(response)
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
      .post<unknown>(this.appConfig.studentTopicQuizReviewUrl(topicId), payload)
      .pipe(map((response) => this.mapQuizReviewResult(this.unwrapData(response), topicId)));
  }

  submitTopicQuiz(
    topicId: string,
    payload: CatalogQuizReviewRequest
  ): Observable<CatalogQuizSubmitResult> {
    return this.http
      .post<unknown>(this.appConfig.studentTopicQuizSubmitUrl(topicId), payload, {
        context: new HttpContext().set(SKIP_APP_LOADING, true)
      })
      .pipe(map((response) => this.mapQuizSubmitResult(this.unwrapData(response), topicId)));
  }

  private mapTab(item: unknown, index: number): CatalogTab {
    const title = this.pickFirstString(
      this.readString(item, 'title'),
      this.readString(item, 'name'),
      this.readString(item, 'label'),
      `Tab ${index + 1}`
    );
    const subtitle = this.pickFirstString(
      this.readString(item, 'subtitle'),
      this.readString(item, 'description'),
      this.readString(item, 'summary'),
      'Course tab'
    );
    const badge = this.normalizeBadge(
      this.pickFirstString(this.readString(item, 'badge'), this.readString(item, 'status'), null)
    );

    return {
      id: String(this.readValue(item, 'id') ?? index + 1),
      title,
      subtitle,
      imageUrl: this.pickFirstString(
        this.readString(item, 'imageUrl', 'image_url'),
        this.readString(item, 'image'),
        this.readString(item, 'thumbnail'),
        this.readString(item, 'cover'),
        null
      ),
      badge,
      tags: this.extractTags(this.readValue(item, 'tags') ?? this.readValue(item, 'categories'))
    };
  }

  private mapTabDetails(item: unknown, fallbackTabId: string): CatalogTabDetails {
    const topics = this.readArray(item, 'topics')
      .map((topic, index) => this.mapTopic(topic, fallbackTabId, index))
      .sort((firstTopic, secondTopic) => firstTopic.sortOrder - secondTopic.sortOrder);

    return {
      id: String(this.readValue(item, 'id') ?? fallbackTabId),
      title: this.pickFirstString(this.readString(item, 'name'), `Tab ${fallbackTabId}`),
      sortOrder: this.readNumber(item, 'sortOrder', 'sort_order') ?? 0,
      topicsCount: this.readNumber(item, 'topicsCount', 'topics_count') ?? topics.length,
      topics
    };
  }

  private mapTopic(item: unknown, fallbackTabId: string, index: number): CatalogTopic {
    return {
      id: String(this.readValue(item, 'id') ?? index + 1),
      tabId: String(this.readValue(item, 'tabId', 'tab_id') ?? fallbackTabId),
      title: this.pickFirstString(this.readString(item, 'name'), `Topic ${index + 1}`),
      sortOrder: this.readNumber(item, 'sortOrder', 'sort_order') ?? index,
      termsCount: this.readNumber(item, 'termsCount', 'terms_count') ?? 0,
      questionsCount: this.readNumber(item, 'questionsCount', 'questions_count') ?? 0
    };
  }

  private mapTopicDetails(item: unknown, fallbackTopicId: string): CatalogTopicDetails {
    const terms = this.readArray(item, 'terms')
      .map((term, index) => this.mapTerm(term, fallbackTopicId, index))
      .sort((firstTerm, secondTerm) => firstTerm.sortOrder - secondTerm.sortOrder);
    const tab = this.readValue(item, 'tab');

    return {
      id: String(this.readValue(item, 'id') ?? fallbackTopicId),
      tabId: String(this.readValue(item, 'tabId', 'tab_id') ?? this.readValue(tab, 'id') ?? ''),
      title: this.pickFirstString(this.readString(item, 'name'), `Topic ${fallbackTopicId}`),
      sortOrder: this.readNumber(item, 'sortOrder', 'sort_order') ?? 0,
      termsCount: this.readNumber(item, 'termsCount', 'terms_count') ?? terms.length,
      questionsCount: this.readNumber(item, 'questionsCount', 'questions_count') ?? 0,
      tabTitle: this.pickFirstString(this.readString(tab, 'name'), ''),
      terms
    };
  }

  private mapTerm(item: unknown, fallbackTopicId: string, index: number): CatalogTopicTerm {
    const termId = String(this.readValue(item, 'id') ?? index + 1);

    return {
      id: termId,
      topicId: String(this.readValue(item, 'topicId', 'topic_id') ?? fallbackTopicId),
      title: this.pickFirstString(this.readString(item, 'name'), `Term ${index + 1}`),
      sortOrder: this.readNumber(item, 'sortOrder', 'sort_order') ?? index,
      explanation: this.pickFirstString(
        this.readString(item, 'correctExplanation', 'correct_explanation'),
        'Explanation will be added soon.'
      ),
      imageUrls: this.extractImageUrls(this.readArray(item, 'images')),
      categories: this.readArray(item, 'categories')
        .map((category, categoryIndex) => this.mapCategory(category, termId, categoryIndex))
        .sort((firstCategory, secondCategory) => firstCategory.sortOrder - secondCategory.sortOrder)
    };
  }

  private mapCategory(item: unknown, fallbackTermId: string, index: number): CatalogTopicCategory {
    const children = this.readArray(item, 'children')
      .map((child, childIndex) => this.mapCategory(child, fallbackTermId, childIndex))
      .sort((firstChild, secondChild) => firstChild.sortOrder - secondChild.sortOrder);

    return {
      id: String(this.readValue(item, 'id') ?? index + 1),
      termId: String(this.readValue(item, 'termId', 'term_id') ?? fallbackTermId),
      parentId: this.readValue(item, 'parentId', 'parent_id') == null ? null : String(this.readValue(item, 'parentId', 'parent_id')),
      title: this.pickFirstString(this.readString(item, 'name'), `Category ${index + 1}`),
      explanation: this.pickFirstString(this.readString(item, 'explanation'), ''),
      sortOrder: this.readNumber(item, 'sortOrder', 'sort_order') ?? index,
      children
    };
  }

  private mapQuizQuestion(item: unknown, fallbackTopicId: string, index: number): CatalogQuizQuestion {
    const choices = this.extractQuizChoices(item);

    return {
      id: String(this.readValue(item, 'id') ?? index + 1),
      topicId: String(this.readValue(item, 'topicId', 'topic_id') ?? fallbackTopicId),
      questionText: this.pickFirstString(
        this.readString(item, 'questionText', 'question_text'),
        `Question ${index + 1}`
      ),
      sortOrder: this.readNumber(item, 'sortOrder', 'sort_order') ?? index,
      choices
    };
  }

  private extractQuizChoices(item: unknown): CatalogQuizChoice[] {
    const oldChoices = this.readArray(item, 'choices');

    if (oldChoices.length > 0) {
      return oldChoices.map((choice, choiceIndex) => this.mapQuizChoice(choice, choiceIndex));
    }

    const choice = this.readValue(item, 'choice');
    const entries: Array<[string, string | null]> = [
      ['A', this.readString(choice, 'choiceA', 'choice_a')],
      ['B', this.readString(choice, 'choiceB', 'choice_b')],
      ['C', this.readString(choice, 'choiceC', 'choice_c')],
      ['D', this.readString(choice, 'choiceD', 'choice_d')]
    ];

    return entries
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
      .map(([key, text]) => ({ key, text }));
  }

  private mapQuizChoice(item: unknown, index: number): CatalogQuizChoice {
    const fallbackKey = String.fromCharCode(65 + index);

    return {
      key: this.pickFirstString(this.readString(item, 'key'), fallbackKey),
      text: this.pickFirstString(this.readString(item, 'text'), `Choice ${fallbackKey}`)
    };
  }

  private mapQuizReviewResult(item: unknown, fallbackTopicId: string): CatalogQuizReviewResult {
    const answers = this.readArray(item, 'answers').map((answer, index) =>
      this.mapQuizReviewAnswer(answer, index)
    );

    return {
      topicId: String(this.readValue(item, 'topicId', 'topic_id') ?? fallbackTopicId),
      topicName: this.pickFirstString(this.readString(item, 'topicName', 'topic_name'), 'Quiz review'),
      answers
    };
  }

  private mapQuizReviewAnswer(item: unknown, index: number): CatalogQuizReviewAnswer {
    return {
      questionId: String(this.readValue(item, 'questionId', 'question_id') ?? index + 1),
      questionText: this.pickFirstString(
        this.readString(item, 'questionText', 'question_text'),
        `Question ${index + 1}`
      ),
      choices: this.readArray(item, 'choices').map((choice, choiceIndex) =>
        this.mapQuizReviewChoice(choice, choiceIndex)
      ),
      selectedAnswer: this.pickFirstString(this.readString(item, 'selectedAnswer', 'selected_answer'), null),
      selectedAnswerText: this.pickFirstString(this.readString(item, 'selectedAnswerText', 'selected_answer_text'), null),
      correctAnswer: this.pickFirstString(this.readString(item, 'correctAnswer', 'correct_answer'), null),
      correctAnswerText: this.pickFirstString(this.readString(item, 'correctAnswerText', 'correct_answer_text'), null),
      reference: this.pickFirstString(this.readString(item, 'reference'), null),
      isCorrect: this.readValue(item, 'isCorrect', 'is_correct') === true
    };
  }

  private mapQuizReviewChoice(item: unknown, index: number): CatalogQuizReviewChoice {
    const fallbackKey = String.fromCharCode(65 + index);

    return {
      key: this.pickFirstString(this.readString(item, 'key'), fallbackKey),
      text: this.pickFirstString(this.readString(item, 'text'), '')
    };
  }

  private mapQuizSubmitResult(item: unknown, fallbackTopicId: string): CatalogQuizSubmitResult {
    const scoreValue = this.readValue(item, 'scorePercentage', 'score_percentage');

    return {
      id: String(this.readValue(item, 'id') ?? ''),
      topicId: String(this.readValue(item, 'topicId', 'topic_id') ?? this.readValue(this.readValue(item, 'topic'), 'id') ?? fallbackTopicId),
      topicName: this.pickFirstString(
        this.readString(item, 'topicName', 'topic_name'),
        this.readString(this.readValue(item, 'topic'), 'name'),
        'Topic quiz'
      ),
      totalQuestions: this.readNumber(item, 'totalQuestions', 'total_questions') ?? 0,
      correctAnswersCount: this.readNumber(item, 'correctAnswersCount', 'correct_answers_count') ?? 0,
      wrongAnswersCount: this.readNumber(item, 'wrongAnswersCount', 'wrong_answers_count') ?? 0,
      scorePercentage: typeof scoreValue === 'string' ? Number.parseFloat(scoreValue) || 0 : (this.readNumber(item, 'scorePercentage', 'score_percentage') ?? 0),
      passed: this.readValue(item, 'passed') === true,
      startedAt: this.pickFirstString(this.readString(item, 'startedAt', 'started_at'), null),
      submittedAt: this.pickFirstString(this.readString(item, 'submittedAt', 'submitted_at'), null),
      message: 'Quiz submitted successfully.'
    };
  }

  private extractArray(response: unknown): unknown[] {
    const unwrapped = this.unwrapData(response);

    if (Array.isArray(unwrapped)) {
      return unwrapped;
    }

    return this.readArray(unwrapped, 'tabs', 'items');
  }

  private unwrapData(response: unknown): unknown {
    const record = this.asRecord(response);

    return record && record['data'] !== undefined && record['data'] !== null ? record['data'] : response;
  }

  private readValue(value: unknown, ...keys: string[]): unknown {
    const record = this.asRecord(value);

    if (!record) {
      return undefined;
    }

    for (const key of keys) {
      if (record[key] !== undefined) {
        return record[key];
      }
    }

    return undefined;
  }

  private readString(value: unknown, ...keys: string[]): string | null {
    const rawValue = keys.length > 0 ? this.readValue(value, ...keys) : value;

    return typeof rawValue === 'string' && rawValue.trim().length > 0 ? rawValue.trim() : null;
  }

  private readNumber(value: unknown, ...keys: string[]): number | null {
    const rawValue = this.readValue(value, ...keys);

    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      return rawValue;
    }

    if (typeof rawValue === 'string') {
      const parsedValue = Number(rawValue);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
  }

  private readArray(value: unknown, ...keys: string[]): unknown[] {
    for (const key of keys) {
      const rawValue = this.readValue(value, key);

      if (Array.isArray(rawValue)) {
        return rawValue;
      }
    }

    return [];
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  }

  private extractTags(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .slice(0, 4);
  }

  private extractImageUrls(value: unknown[]): string[] {
    return value
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }

        return this.readString(entry, 'imagePath', 'image_path');
      })
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map((entry) => this.toAssetUrl(entry.trim()));
  }

  private toAssetUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const backendOrigin = this.appConfig.catalogBaseUrl.replace(/\/api\/?$/i, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${backendOrigin}${normalizedPath}`;
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
