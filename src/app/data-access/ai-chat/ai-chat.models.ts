export interface ChatHistoryItem {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface AskRequest {
  readonly question: string;
  readonly top_k: number;
  readonly chat_history: ChatHistoryItem[];
}

export interface RagReference {
  readonly source_book?: string;
  readonly page_number?: number;
}

export interface AskResponse {
  readonly answer?: string;
  readonly response?: string;
  readonly result?: string;
  readonly message?: string;
  readonly content?: string;
  readonly references?: RagReference[];
}

export interface AiSource {
  readonly sourceBook: string;
  readonly pages: number[];
}

export interface AiChatAnswer {
  readonly text: string;
  readonly sources: AiSource[];
}
