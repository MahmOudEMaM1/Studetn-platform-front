type DashboardRole = 'admin' | 'teacher' | 'student';

export const appRoutePaths = {
  root: '',
  dashboardRedirect: 'dashboard',
  login: 'login',
  aiChat: 'ai-chat',
  teacherAdminDashboard: 'teacher-admin-dashboard',
  teacherDashboard: 'teacher-dashboard',
  studentDashboard: 'student-dashboard',
  studentCommunity: 'student-community',
  courseContents: 'course-contents',
  courseContentsDetail: 'course-contents/:tabId',
  quiz: 'quiz',
  quizDetail: 'quiz/:topicId',
  wildcard: '**'
} as const;

export const appRouteLinks = {
  login: `/${appRoutePaths.login}`,
  aiChat: `/${appRoutePaths.aiChat}`,
  teacherAdminDashboard: `/${appRoutePaths.teacherAdminDashboard}`,
  teacherDashboard: `/${appRoutePaths.teacherDashboard}`,
  studentDashboard: `/${appRoutePaths.studentDashboard}`,
  studentCommunity: `/${appRoutePaths.studentCommunity}`,
  courseContents: `/${appRoutePaths.courseContents}`,
  quiz: `/${appRoutePaths.quiz}`
} as const;

export const roleDashboardRouteLinks: Record<DashboardRole, string> = {
  admin: appRouteLinks.teacherAdminDashboard,
  teacher: appRouteLinks.teacherDashboard,
  student: appRouteLinks.studentDashboard
};
