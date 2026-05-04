import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import { LoginRole } from '../auth/auth.models';
import {
  CommunityQuestion,
  CommunityQuestionApiItem,
  CommunityQuestionsResponse,
  CommunityReply,
  CommunityReplyApiItem,
  CreateStudentQuestionRequest,
  CreateStudentQuestionResponse,
  CreateTeacherReplyRequest,
  CreateTeacherReplyResponse
} from './community.models';

@Injectable({
  providedIn: 'root'
})
export class CommunityApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getQuestions(role: Extract<LoginRole, 'student' | 'teacher'>): Observable<CommunityQuestion[]> {
    const request$ =
      role === 'teacher'
        ? this.http.get<CommunityQuestionsResponse>(this.appConfig.teacherQuestionsUrl)
        : this.http.get<CommunityQuestionsResponse>(this.appConfig.studentQuestionsUrl);

    return request$.pipe(
      map((response) =>
        (response.data ?? [])
          .map((question) => this.mapQuestion(question))
          .sort((firstQuestion, secondQuestion) => secondQuestion.id - firstQuestion.id)
      )
    );
  }

  createStudentQuestion(question: string): Observable<CommunityQuestion> {
    const payload: CreateStudentQuestionRequest = { question };

    return this.http
      .post<CreateStudentQuestionResponse>(this.appConfig.studentQuestionsUrl, payload)
      .pipe(map((response) => this.mapQuestion(response.data ?? {})));
  }

  createTeacherReply(questionId: number, reply: string): Observable<CommunityReply> {
    const payload: CreateTeacherReplyRequest = { reply };

    return this.http
      .post<CreateTeacherReplyResponse>(this.appConfig.teacherQuestionRepliesUrl(String(questionId)), payload)
      .pipe(map((response) => this.mapReply(response.data ?? {})));
  }

  private mapQuestion(item: CommunityQuestionApiItem): CommunityQuestion {
    const replies = (item?.replies ?? []).map((reply) => this.mapReply(reply));

    return {
      id: item?.id ?? 0,
      question: item?.question?.trim() || 'Untitled question',
      isVisible: item?.is_visible === true || item?.is_visible === 1,
      studentId: item?.student?.id ?? 0,
      studentName: item?.student?.full_name?.trim() || 'Student',
      replies,
      createdAt: item?.created_at?.trim() || '',
      solved: replies.length > 0
    };
  }

  private mapReply(item: CommunityReplyApiItem): CommunityReply {
    return {
      id: item?.id ?? 0,
      reply: item?.reply?.trim() || '',
      teacherId: item?.teacher?.id ?? 0,
      teacherName: item?.teacher?.full_name?.trim() || 'Teacher',
      createdAt: item?.created_at?.trim() || ''
    };
  }
}
