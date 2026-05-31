import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import {
  TeacherDashboardStudentSummary,
  TeacherDashboardSummary,
  TeacherDashboardWeakTopic,
  TeacherQuizAttemptAnswer,
  TeacherQuizAttemptDetail,
  TeacherQuizAttemptListItem,
  TeacherStudentIdentity,
  TeacherStudentListItem,
  TeacherStudentProgress,
  TeacherStudentProgressSummary,
  TeacherStudentScoreRange,
  TeacherStudentTopicProgress,
  TeacherStudentTopicQuizAttempts
} from './teacher-dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class TeacherDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getDashboard(): Observable<TeacherDashboardSummary> {
    return this.http
      .get<unknown>(this.appConfig.teacherDashboardUrl)
      .pipe(map((response) => this.mapDashboard(this.unwrapData(response))));
  }

  getStudents(): Observable<TeacherStudentListItem[]> {
    return this.http.get<unknown>(this.appConfig.teacherStudentsUrl).pipe(
      map((response) =>
        this.extractArray(response).map((item) => ({
          studentId: this.readNumber(item, 'id', 'studentId', 'student_id') ?? 0,
          userId: this.readNumber(item, 'userId', 'user_id') ?? 0,
          fullName: this.readString(item, 'fullName', 'full_name') ?? 'Student',
          email: this.readString(item, 'email') ?? 'No email provided',
          phone: this.readString(item, 'phone') ?? 'No phone provided',
          attemptsCount: this.readNumber(item, 'totalAttempts', 'attemptsCount', 'attempts_count') ?? 0,
          completedQuizzes: this.readNumber(item, 'passedAttempts', 'completedQuizzes', 'completed_quizzes') ?? 0,
          averageScore: this.readNumber(item, 'averageScore', 'average_score') ?? 0,
          bestScore: this.readNumber(item, 'bestScore', 'best_score', 'averageScore', 'average_score') ?? 0
        }))
      )
    );
  }

  getStudentScoreRanges(): Observable<TeacherStudentScoreRange[]> {
    return this.http.get<unknown>(this.appConfig.teacherStudentScoreRangesUrl).pipe(
      map((response) =>
        this.extractArray(response).map((item) => ({
          studentId: this.readNumber(item, 'studentId', 'student_id') ?? 0,
          userId: this.readNumber(item, 'userId', 'user_id') ?? 0,
          fullName: this.readString(item, 'fullName', 'full_name') ?? 'Student',
          email: this.readString(item, 'email') ?? 'No email provided',
          attemptsCount: this.readNumber(item, 'attemptsCount', 'attempts_count') ?? 0,
          bestScore: this.readNumber(item, 'bestScore', 'best_score') ?? 0,
          lowScore: this.readNumber(item, 'lowScore', 'low_score') ?? 0
        }))
      )
    );
  }

  getStudentProgress(studentId: number): Observable<TeacherStudentProgress> {
    return this.http
      .get<unknown>(this.appConfig.teacherStudentProgressUrl(String(studentId)))
      .pipe(map((response) => this.mapStudentProgress(this.unwrapData(response), studentId)));
  }

  getStudentTopicQuizAttempts(
    studentId: number,
    topicId: number
  ): Observable<TeacherStudentTopicQuizAttempts> {
    return this.http
      .get<unknown>(this.appConfig.teacherStudentTopicQuizAttemptsUrl(String(studentId), String(topicId)))
      .pipe(map((response) => this.mapTopicQuizAttempts(this.unwrapData(response), studentId, topicId)));
  }

  getQuizAttempt(quizAttemptId: number): Observable<TeacherQuizAttemptDetail> {
    return this.http
      .get<unknown>(this.appConfig.teacherQuizAttemptUrl(String(quizAttemptId)))
      .pipe(map((response) => this.mapQuizAttemptDetail(this.unwrapData(response))));
  }

  private mapDashboard(data: unknown): TeacherDashboardSummary {
    const weakStudents = this.readArray(data, 'weakStudents', 'weak_students').map((item) =>
      this.mapWeakStudent(item)
    );
    const topStudents = this.readArray(data, 'topStudents', 'top_students').map((item) =>
      this.mapTopStudent(item)
    );
    const weakTopics = this.readArray(data, 'weakTopics', 'weak_topics').map((item) =>
      this.mapWeakTopic(item)
    );

    return {
      studentsCount: this.readNumber(data, 'totalStudents', 'students_count') ?? 0,
      studentsWithAttemptsCount: this.readNumber(data, 'studentsWithAttemptsCount', 'students_with_attempts_count') ?? 0,
      totalAttemptsCount: this.readNumber(data, 'totalAttempts', 'total_attempts_count') ?? 0,
      averageScore: this.readNumber(data, 'averageScore', 'average_score') ?? 0,
      passedAttemptsCount: this.readNumber(data, 'passedAttemptsCount', 'passed_attempts_count') ?? 0,
      failedAttemptsCount: this.readNumber(data, 'failedAttemptsCount', 'failed_attempts_count') ?? 0,
      weakStudents,
      topStudents,
      weakTopics
    };
  }

  private mapWeakStudent(item: unknown): TeacherDashboardStudentSummary {
    return {
      studentId: this.readNumber(item, 'studentId', 'student_id') ?? 0,
      userId: this.readNumber(item, 'userId', 'user_id') ?? 0,
      fullName: this.readString(item, 'fullName', 'full_name') ?? 'Student',
      email: this.readString(item, 'email') ?? 'No email provided',
      averageScore: this.readNumber(item, 'averageScore', 'average_score') ?? 0,
      attemptsCount: this.readNumber(item, 'failedAttempts', 'attemptsCount', 'attempts_count') ?? 0
    };
  }

  private mapTopStudent(item: unknown): TeacherDashboardStudentSummary {
    return {
      studentId: this.readNumber(item, 'studentId', 'student_id') ?? 0,
      userId: this.readNumber(item, 'userId', 'user_id') ?? 0,
      fullName: this.readString(item, 'fullName', 'full_name') ?? 'Student',
      email: this.readString(item, 'email') ?? 'No email provided',
      averageScore: this.readNumber(item, 'averageScore', 'average_score') ?? 0,
      bestScore: this.readNumber(item, 'bestScore', 'best_score', 'averageScore', 'average_score') ?? 0,
      attemptsCount: this.readNumber(item, 'passedAttempts', 'attemptsCount', 'attempts_count') ?? 0
    };
  }

  private mapWeakTopic(item: unknown): TeacherDashboardWeakTopic {
    return {
      topicId: this.readNumber(item, 'topicId', 'topic_id') ?? 0,
      topicName: this.readString(item, 'topicName', 'topic_name') ?? 'Topic',
      averageScore: this.readNumber(item, 'averageScore', 'average_score') ?? 0,
      attemptsCount: this.readNumber(item, 'attemptsCount', 'attempts_count') ?? 0,
      failedAttemptsCount: this.readNumber(item, 'failedAttempts', 'failed_attempts_count') ?? 0
    };
  }

  private mapStudentProgress(data: unknown, fallbackStudentId: number): TeacherStudentProgress {
    const progress = this.readValue(data, 'progress') ?? this.readValue(data, 'summary') ?? data;
    const topics = this.readArray(progress, 'topics').map((topic) => this.mapStudentTopicProgress(topic));

    return {
      student: this.mapStudentIdentity(this.readValue(data, 'student'), fallbackStudentId),
      summary: this.mapStudentProgressSummary(progress, topics),
      topics: topics.sort((firstTopic, secondTopic) => firstTopic.topicName.localeCompare(secondTopic.topicName))
    };
  }

  private mapTopicQuizAttempts(
    data: unknown,
    fallbackStudentId: number,
    fallbackTopicId: number
  ): TeacherStudentTopicQuizAttempts {
    const attemptsSource = Array.isArray(data) ? data : this.readArray(data, 'attempts');
    const attempts = attemptsSource.map((attempt) => this.mapQuizAttempt(attempt, fallbackTopicId));
    const firstAttempt = attempts[0];

    return {
      student: this.mapStudentIdentity(this.readValue(data, 'student'), fallbackStudentId),
      topic: {
        topicId: this.readNumber(this.readValue(data, 'topic'), 'id') ?? firstAttempt?.topicId ?? fallbackTopicId,
        topicName: this.readString(this.readValue(data, 'topic'), 'name') ?? firstAttempt?.topicName ?? 'Topic'
      },
      attempts: attempts.sort(
        (firstAttemptItem, secondAttemptItem) =>
          new Date(firstAttemptItem.submittedAt).getTime() -
          new Date(secondAttemptItem.submittedAt).getTime()
      )
    };
  }

  private mapQuizAttemptDetail(data: unknown): TeacherQuizAttemptDetail {
    const topic = this.readValue(data, 'topic');
    const topicId = this.readNumber(topic, 'id') ?? this.readNumber(data, 'topicId', 'topic_id') ?? 0;
    const topicName = this.readString(topic, 'name') ?? this.readString(data, 'topicName', 'topic_name') ?? 'Topic';
    const attemptId = this.readNumber(data, 'id', 'attemptId', 'attempt_id') ?? 0;

    return {
      attemptId,
      student: this.mapStudentIdentity(this.readValue(data, 'student')),
      topic: {
        topicId,
        topicName
      },
      summary: this.mapQuizAttempt(data, topicId, topicName),
      answers: this.readArray(data, 'answers').map((answer) => this.mapQuizAttemptAnswer(answer))
    };
  }

  private mapStudentIdentity(item?: unknown, fallbackStudentId = 0): TeacherStudentIdentity {
    return {
      studentId: this.readNumber(item, 'id', 'studentId', 'student_id') ?? fallbackStudentId,
      userId: this.readNumber(item, 'userId', 'user_id') ?? 0,
      fullName: this.readString(item, 'fullName', 'full_name') ?? 'Student',
      email: this.readString(item, 'email') ?? 'No email provided',
      phone: this.readString(item, 'phone') ?? 'No phone provided'
    };
  }

  private mapStudentProgressSummary(
    item: unknown,
    topics: TeacherStudentTopicProgress[]
  ): TeacherStudentProgressSummary {
    return {
      completedQuizzes: this.readNumber(item, 'completedTopics', 'completed_quizzes') ?? 0,
      attemptsCount: this.readNumber(item, 'totalAttempts', 'attempts_count') ?? 0,
      averageScore: this.readNumber(item, 'averageScore', 'average_score') ?? 0,
      bestScore: topics.reduce((maxScore, topic) => Math.max(maxScore, topic.bestScore), 0),
      passedQuizzesCount: this.readNumber(item, 'passedAttempts', 'passed_quizzes_count') ?? 0,
      failedQuizzesCount: this.readNumber(item, 'failedAttempts', 'failed_quizzes_count') ?? 0
    };
  }

  private mapStudentTopicProgress(item: unknown): TeacherStudentTopicProgress {
    const bestScore = this.readNumber(item, 'bestScore', 'best_score') ?? 0;

    return {
      topicId: this.readNumber(item, 'topicId', 'topic_id') ?? 0,
      topicName: this.readString(item, 'topicName', 'topic_name') ?? 'Topic',
      attemptsCount: this.readNumber(item, 'attemptsCount', 'attempts_count') ?? 0,
      latestScore: this.readNumber(item, 'latestScore', 'latest_score') ?? bestScore,
      bestScore,
      averageScore: this.readNumber(item, 'averageScore', 'average_score') ?? bestScore,
      isImproving: this.readValue(item, 'isImproving', 'is_improving', 'passed') === true
    };
  }

  private mapQuizAttempt(
    item: unknown,
    fallbackTopicId: number,
    fallbackTopicName = 'Topic'
  ): TeacherQuizAttemptListItem {
    return {
      attemptId: this.readNumber(item, 'id', 'attemptId', 'attempt_id') ?? 0,
      topicId: this.readNumber(item, 'topicId', 'topic_id') ?? this.readNumber(this.readValue(item, 'topic'), 'id') ?? fallbackTopicId,
      topicName: this.readString(item, 'topicName', 'topic_name') ?? this.readString(this.readValue(item, 'topic'), 'name') ?? fallbackTopicName,
      totalQuestions: this.readNumber(item, 'totalQuestions', 'total_questions') ?? 0,
      correctAnswersCount: this.readNumber(item, 'correctAnswersCount', 'correct_answers_count') ?? 0,
      wrongAnswersCount: this.readNumber(item, 'wrongAnswersCount', 'wrong_answers_count') ?? 0,
      scorePercentage: this.readNumber(item, 'scorePercentage', 'score_percentage') ?? 0,
      passed: this.readValue(item, 'passed') === true,
      startedAt: this.readString(item, 'startedAt', 'started_at') ?? '',
      submittedAt: this.readString(item, 'submittedAt', 'submitted_at') ?? ''
    };
  }

  private mapQuizAttemptAnswer(item: unknown): TeacherQuizAttemptAnswer {
    return {
      questionId: this.readNumber(item, 'questionId', 'question_id') ?? 0,
      questionText: this.readString(item, 'questionText', 'question_text') ?? 'Question',
      choices: [],
      selectedAnswer: this.readString(item, 'selectedAnswer', 'selected_answer') ?? '',
      selectedAnswerText: this.readString(item, 'selectedAnswerText', 'selected_answer_text') ?? this.readString(item, 'selectedAnswer', 'selected_answer') ?? 'No answer selected',
      correctAnswer: this.readString(item, 'correctAnswer', 'correct_answer') ?? '',
      correctAnswerText: this.readString(item, 'correctAnswerText', 'correct_answer_text') ?? this.readString(item, 'correctAnswer', 'correct_answer') ?? '',
      isCorrect: this.readValue(item, 'isCorrect', 'is_correct') === true
    };
  }

  private extractArray(response: unknown): unknown[] {
    const unwrapped = this.unwrapData(response);

    if (Array.isArray(unwrapped)) {
      return unwrapped;
    }

    return this.readArray(unwrapped, 'items');
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
    const rawValue = this.readValue(value, ...keys);

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
}
