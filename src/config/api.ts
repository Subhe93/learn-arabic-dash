export const API_BASE_URL = "https://learnarabic.iwings-digital.com";

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    register: "/auth/register",
    info: "/auth/info",
    resendConfirmation: "/auth/resend-confirmation",
    confirm: "/auth/confirm",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  // Upload
  upload: {
    image: "/upload/image",
    video: "/upload/video",
    audio: "/upload/audio",
    file: "/upload/file",
  },

  // Admin Accounts
  adminAccounts: "/admin/admin-accounts",

  // Levels
  levels: "/admin/levels",

  // Lessons
  lessons: "/admin/lessons",
  lessonsForLevel: (levelId: number) => `/admin/lessons/level/${levelId}`,

  // Admin Files
  files: "/admin/files",

  // Teachers
  teachers: "/admin/teachers",

  // Students
  students: "/admin/students",
  studentLevels: (studentId: number) => `/admin/students/${studentId}/levels`,
  studentLessons: (studentId: number) => `/admin/students/${studentId}/lessons`,
  studentTransactionsForStudent: (studentId: number) =>
    `/admin/students/${studentId}/transactions`,
  studentAddBalance: (studentId: number) =>
    `/admin/students/${studentId}/transactions/add-balance`,

  // Teacher Classes
  teacherClasses: "/admin/teacher-classes",
  teacherClassStudents: (classId: number) =>
    `/admin/teacher-classes/${classId}/students`,
  teacherClassSessions: (classId: number) =>
    `/admin/teacher-classes/${classId}/sessions`,
  teacherClassFiles: (classId: number) =>
    `/admin/teacher-classes/${classId}/files`,

  // Assignments
  assignments: "/admin/assignments",
  assignmentsByTarget: "/admin/assignments/target",

  // Assignment Blocks
  assignmentBlocks: "/admin/assignment-blocks",

  // Questions
  questions: "/admin/questions",

  // Certificates
  certificates: "/admin/certificates",
  certificatesGenerate: "/admin/certificates/generate",

  // Plans
  plans: "/admin/plans",

  // Student Subscribes
  studentSubscribes: "/admin/student-plans",

  // Student Transactions
  studentTransactions: "/admin/student-transactions",

  // Answer Reviews
  answerReviews: "/admin/answer-reviews",
  answerReviewsReview: "/admin/answer-reviews/review",
};
