import {
  computed,
  DestroyRef,
  Component,
  ElementRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import {
  AiChatApiService
} from '../../data-access/ai-chat/ai-chat-api.service';
import {
  AiSource,
  ChatHistoryItem
} from '../../data-access/ai-chat/ai-chat.models';

const SERVICE_UNAVAILABLE_MESSAGE =
  'I could not reach the AI service right now. Please check that the RAG API is running and try again.';

interface ResponseTextSegment {
  readonly text: string;
  readonly bold: boolean;
}

interface ResponseBlock {
  readonly id: number;
  readonly type: 'paragraph' | 'ordered' | 'bullet';
  readonly level: number;
  readonly marker?: string;
  readonly segments: ResponseTextSegment[];
}

interface SuggestionChip {
  readonly id: number;
  readonly label: string;
}

interface UserMessage {
  readonly id: number;
  readonly role: 'user';
  readonly text: string;
}

interface AiLoadingMessage {
  readonly id: number;
  readonly role: 'ai';
  readonly status: 'loading';
}

interface AiResponseMessage {
  readonly id: number;
  readonly role: 'ai';
  readonly status: 'response';
  readonly text: string;
  readonly blocks: ResponseBlock[];
  readonly sources: AiSource[];
}

type ChatMessage = UserMessage | AiLoadingMessage | AiResponseMessage;

@Component({
  selector: 'app-ai-chat-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-chat-page.component.html',
  styleUrls: ['./ai-chat-page.component.scss']
})
export class AiChatPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly aiChatApi = inject(AiChatApiService);
  private nextMessageId = 1;

  protected readonly prompt = signal('');
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly hasConversation = computed(() => this.messages().length > 0);
  protected readonly hasPendingResponse = computed(() =>
    this.messages().some((message) => message.role === 'ai' && message.status === 'loading')
  );

  protected readonly suggestions: SuggestionChip[] = [
    {
      id: 1,
      label: 'What can I ask you to do?'
    },
    {
      id: 2,
      label: 'Which one of my projects is performing the best?'
    },
    {
      id: 3,
      label: 'What projects should I be concerned about right now?'
    }
  ];

  protected useSuggestion(prompt: string): void {
    this.prompt.set(prompt);
  }

  protected submitPrompt(): void {
    const trimmedPrompt = this.prompt().trim();

    if (!trimmedPrompt || this.hasPendingResponse()) {
      return;
    }

    const chatHistory = this.buildChatHistory();
    const userMessage: UserMessage = {
      id: this.nextId(),
      role: 'user',
      text: trimmedPrompt
    };

    const loadingMessage: AiLoadingMessage = {
      id: this.nextId(),
      role: 'ai',
      status: 'loading'
    };

    this.messages.update((messages) => [...messages, userMessage, loadingMessage]);
    this.prompt.set('');
    this.scrollPageToLatestMessage();

    const requestBody = {
      question: trimmedPrompt,
      chat_history: chatHistory
    };

    this.aiChatApi
      .askQuestion(requestBody)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.replaceLoadingMessage(
            loadingMessage.id,
            response.text,
            response.sources
          );
          this.scrollPageToLatestMessage();
        },
        error: () => {
          this.replaceLoadingMessage(
            loadingMessage.id,
            SERVICE_UNAVAILABLE_MESSAGE,
            []
          );
          this.scrollPageToLatestMessage();
        }
      });
  }

  protected isRtlText(text: string): boolean {
    return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(text);
  }

  protected isRtlMessage(message: ChatMessage): boolean {
    if (message.role === 'user') {
      return this.isRtlText(message.text);
    }

    return message.status === 'response' && this.isRtlText(message.text);
  }

  private nextId(): number {
    return this.nextMessageId++;
  }

  private scrollPageToLatestMessage(): void {
    requestAnimationFrame(() => {
      const chatShell = this.elementRef.nativeElement.querySelector('.chat-shell');

      chatShell?.scrollTo({
        top: chatShell.scrollHeight,
        behavior: 'smooth'
      });
    });
  }

  private buildChatHistory(): ChatHistoryItem[] {
    return this.messages().flatMap((message): ChatHistoryItem[] => {
      if (message.role === 'user') {
        return [
          {
            role: 'user',
            content: message.text
          }
        ];
      }

      if (message.status !== 'response') {
        return [];
      }

      return [
        {
          role: 'assistant',
          content: message.text
        }
      ];
    });
  }

  private replaceLoadingMessage(messageId: number, text: string, sources: AiSource[]): void {
    this.messages.update((messages) =>
      messages.map((message) => {
        if (message.id !== messageId) {
          return message;
        }

        return {
          id: message.id,
          role: 'ai',
          status: 'response',
          text,
          blocks: this.parseResponseBlocks(text),
          sources
        } satisfies AiResponseMessage;
      })
    );
  }

  private parseResponseBlocks(text: string): ResponseBlock[] {
    return text
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.trim())
      .map((line, index) => {
        const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
        const bulletMatch = line.match(/^(\s*)[*-]\s+(.*)$/);

        if (orderedMatch) {
          return {
            id: index,
            type: 'ordered',
            level: 0,
            marker: `${orderedMatch[1]}.`,
            segments: this.parseInlineSegments(orderedMatch[2])
          };
        }

        if (bulletMatch) {
          return {
            id: index,
            type: 'bullet',
            level: bulletMatch[1].length > 0 ? 1 : 0,
            segments: this.parseInlineSegments(bulletMatch[2])
          };
        }

        return {
          id: index,
          type: 'paragraph',
          level: 0,
          segments: this.parseInlineSegments(line.trim())
        };
      });
  }

  private parseInlineSegments(text: string): ResponseTextSegment[] {
    const segments: ResponseTextSegment[] = [];
    const boldPattern = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = boldPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          text: text.slice(lastIndex, match.index),
          bold: false
        });
      }

      segments.push({
        text: match[1],
        bold: true
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({
        text: text.slice(lastIndex),
        bold: false
      });
    }

    return segments;
  }
}
