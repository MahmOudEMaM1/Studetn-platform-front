import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import { SKIP_APP_LOADING } from '../../core/interceptors/app-loading.interceptor';
import {
  AiChatAnswer,
  AiSource,
  AskRequest,
  AskResponse
} from './ai-chat.models';

const DEFAULT_TOP_K = 3;
const EMPTY_RESPONSE_MESSAGE =
  'I received a response, but it did not include an answer field.';

@Injectable({
  providedIn: 'root'
})
export class AiChatApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  askQuestion(request: Omit<AskRequest, 'top_k'> & { top_k?: number }): Observable<AiChatAnswer> {
    const payload: AskRequest = {
      ...request,
      top_k: request.top_k ?? DEFAULT_TOP_K
    };

    return this.http
      .post<AskResponse | string>(this.appConfig.aiChatAskUrl, payload, {
        context: new HttpContext().set(SKIP_APP_LOADING, true)
      })
      .pipe(
        map((response) => ({
          text: this.extractResponseText(response),
          sources: this.extractSources(response)
        }))
      );
  }

  private extractResponseText(response: AskResponse | string): string {
    if (typeof response === 'string') {
      return response;
    }

    return (
      response.answer ??
      response.response ??
      response.result ??
      response.message ??
      response.content ??
      EMPTY_RESPONSE_MESSAGE
    );
  }

  private extractSources(response: AskResponse | string): AiSource[] {
    if (typeof response === 'string' || !response.references?.length) {
      return [];
    }

    const sourceMap = new Map<string, Set<number>>();

    for (const reference of response.references) {
      const sourceBook = reference.source_book?.trim();

      if (!sourceBook || typeof reference.page_number !== 'number') {
        continue;
      }

      const pages = sourceMap.get(sourceBook) ?? new Set<number>();
      pages.add(reference.page_number);
      sourceMap.set(sourceBook, pages);
    }

    return Array.from(sourceMap.entries()).map(([sourceBook, pages]) => ({
      sourceBook,
      pages: [...pages].sort((firstPage, secondPage) => firstPage - secondPage)
    }));
  }
}
