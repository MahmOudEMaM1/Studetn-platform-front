export interface ApiEndpointsConfig {
  readonly aiChatBaseUrl: string;
  readonly authBaseUrl: string;
  readonly catalogBaseUrl: string;
  readonly studentBaseUrl: string;
  readonly teacherBaseUrl: string;
  readonly notificationsBaseUrl: string;
  readonly notificationsHubUrl: string;
  readonly aiChat: {
    readonly ask: string;
  };
  readonly auth: {
    readonly login: string;
    readonly me: string;
  };
  readonly catalog: {
    readonly tabs: string;
    readonly tabById: string;
    readonly topicById: string;
    readonly topicQuizById: string;
  };
  readonly student: {
    readonly progress: string;
    readonly topicQuizReviewById: string;
    readonly topicQuizSubmitById: string;
    readonly quizAttemptsChart: string;
    readonly questions: string;
    readonly questionRepliesById: string;
  };
  readonly teacher: {
    readonly dashboard: string;
    readonly students: string;
    readonly studentProgressById: string;
    readonly studentTopicQuizAttemptsById: string;
    readonly quizAttemptById: string;
    readonly questions: string;
    readonly questionRepliesById: string;
  };
  readonly notifications: {
    readonly list: string;
    readonly unread: string;
    readonly readByRef: string;
    readonly readAll: string;
  };
}

export const appApiConfig: ApiEndpointsConfig = {
  aiChatBaseUrl: 'https://mahmoudengemam-studentplatform-rag.hf.space',
  authBaseUrl: 'https://student-platform.runasp.net/api',
  catalogBaseUrl: 'https://student-platform.runasp.net/api',
  studentBaseUrl: 'https://student-platform.runasp.net/api',
  teacherBaseUrl: 'https://student-platform.runasp.net/api',
  notificationsBaseUrl: 'https://student-platform.runasp.net/api',
  notificationsHubUrl: 'https://student-platform.runasp.net/hubs/notifications',
  aiChat: {
    ask: '/api/v1/ask'
  },
  auth: {
    login: '/auth/login',
    me: '/me'
  },
  catalog: {
    tabs: '/catalog/tabs',
    tabById: '/catalog/tabs',
    topicById: '/catalog/topics',
    topicQuizById: '/catalog/topics'
  },
  student: {
    progress: '/student/progress',
    topicQuizReviewById: '/student/topics',
    topicQuizSubmitById: '/student/topics',
    quizAttemptsChart: '/student/quiz-attempts/chart',
    questions: '/student/questions',
    questionRepliesById: '/student/questions'
  },
  teacher: {
    dashboard: '/teacher/dashboard',
    students: '/teacher/students',
    studentProgressById: '/teacher/students',
    studentTopicQuizAttemptsById: '/teacher/students',
    quizAttemptById: '/teacher/quiz-attempts',
    questions: '/teacher/questions',
    questionRepliesById: '/teacher/questions'
  },
  notifications: {
    list: '/notifications',
    unread: '/notifications/unread',
    readByRef: '/notifications',
    readAll: '/notifications/read-all'
  }
};
