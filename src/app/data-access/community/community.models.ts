export interface CommunityStudentApiRef {
  readonly id?: number | null;
  readonly full_name?: string | null;
}

export interface CommunityTeacherApiRef {
  readonly id?: number | null;
  readonly full_name?: string | null;
}

export interface CommunityReplyApiItem {
  readonly id?: number | null;
  readonly reply?: string | null;
  readonly teacher?: CommunityTeacherApiRef | null;
  readonly created_at?: string | null;
}

export interface CommunityQuestionApiItem {
  readonly id?: number | null;
  readonly question?: string | null;
  readonly is_visible?: boolean | number | null;
  readonly student?: CommunityStudentApiRef | null;
  readonly replies?: CommunityReplyApiItem[] | null;
  readonly created_at?: string | null;
}

export interface CommunityQuestionsResponse {
  readonly data?: CommunityQuestionApiItem[] | null;
}

export interface CreateStudentQuestionRequest {
  readonly question: string;
}

export interface CreateStudentQuestionResponse {
  readonly data?: CommunityQuestionApiItem | null;
}

export interface CreateTeacherReplyRequest {
  readonly reply: string;
}

export interface CreateTeacherReplyResponse {
  readonly data?: CommunityReplyApiItem | null;
}

export interface CommunityReply {
  readonly id: number;
  readonly reply: string;
  readonly teacherId: number;
  readonly teacherName: string;
  readonly createdAt: string;
}

export interface CommunityQuestion {
  readonly id: number;
  readonly question: string;
  readonly isVisible: boolean;
  readonly studentId: number;
  readonly studentName: string;
  readonly replies: CommunityReply[];
  readonly createdAt: string;
  readonly solved: boolean;
}
