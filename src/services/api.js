// src/services/api.js
// All API calls mapped to your Spring Boot microservices via Gateway
// Requests are proxied through the Vite dev server to avoid CORS issues.

import axios from 'axios';

// Use relative URL so Vite proxy handles routing to the gateway
const api = axios.create({ baseURL: '' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth Service ─────────────────────────────────────────────
export const authAPI = {
  sendOtp:        (email)        => api.post(`/api/v1/auth/send-otp`, { email }),
  register:       (data)         => api.post(`/api/v1/auth/register`, data),
  login:          (data)         => api.post(`/api/v1/auth/login`, data),
  logout:         ()             => api.post(`/api/v1/auth/logout`),
  refresh:        (data)         => api.post(`/api/v1/auth/refresh`, data),
  getProfile:     (userId)       => api.get(`/api/v1/auth/profile/${userId}`),
  updateProfile:  (userId, data) => api.put(`/api/v1/auth/profile/${userId}`, data),
  changePassword: (userId, data) => api.put(`/api/v1/auth/password/${userId}`, data),
  getAllUsers:     ()             => api.get(`/api/v1/auth/users`),
  getUsersByRole: (role)         => api.get(`/api/v1/auth/users/role/${role}`),
  suspendUser:    (userId)       => api.put(`/api/v1/auth/users/${userId}/suspend`),
  deleteUser:     (userId)       => api.delete(`/api/v1/auth/users/${userId}`),
  forgotPassword: (email)        => api.post(`/api/v1/auth/forgot-password`, { email }),
  resetPassword:  (token, newPassword) => api.post(`/api/v1/auth/reset-password`, { token, newPassword }),
};

// ── Course Service ───────────────────────────────────────────
export const courseAPI = {
  getAll:           ()           => api.get(`/api/v1/courses`),
  getById:          (id)         => api.get(`/api/v1/courses/${id}`),
  getFeatured:      ()           => api.get(`/api/v1/courses/featured`),
  search:           (kw)         => api.get(`/api/v1/courses/search?keyword=${kw}`),
  getByCategory:    (cat)        => api.get(`/api/v1/courses/category/${cat}`),
  getByLevel:       (lvl)        => api.get(`/api/v1/courses/level/${lvl}`),
  getByInstructor:  (id)         => api.get(`/api/v1/courses/instructor/${id}`),
  getByLanguage:    (lang)       => api.get(`/api/v1/courses/language/${lang}`),
  getByMaxPrice:    (max)        => api.get(`/api/v1/courses/price?max=${max}`),
  create:           (data)       => api.post(`/api/v1/courses`, data),
  update:           (id, data)   => api.put(`/api/v1/courses/${id}`, data),
  publish:          (id)         => api.put(`/api/v1/courses/${id}/publish`),
  unpublish:        (id)         => api.put(`/api/v1/courses/${id}/unpublish`),
  approve:          (id)         => api.put(`/api/v1/courses/${id}/approve`),
  reject:           (id)         => api.put(`/api/v1/courses/${id}/reject`),
  delete:           (id)         => api.delete(`/api/v1/courses/${id}`),
};

// ── Lesson Service ───────────────────────────────────────────
export const lessonAPI = {
  getByCourse:  (courseId)       => api.get(`/api/v1/lessons/course/${courseId}`),
  getById:      (id)             => api.get(`/api/v1/lessons/${id}`),
  getPreview:   (courseId)       => api.get(`/api/v1/lessons/preview/${courseId}`),
  add:          (data)           => api.post(`/api/v1/lessons`, data),
  update:       (id, data)       => api.put(`/api/v1/lessons/${id}`, data),
  delete:       (id)             => api.delete(`/api/v1/lessons/${id}`),
  reorder:      (courseId, ids)  => api.put(`/api/v1/lessons/reorder/${courseId}`, ids),
  addResource:  (lessonId, data) => api.post(`/api/v1/lessons/${lessonId}/resources`, data),
  removeResource:(resourceId)    => api.delete(`/api/v1/lessons/resources/${resourceId}`),
  getCount:     (courseId)       => api.get(`/api/v1/lessons/count/${courseId}`),
};

// ── Enrollment Service ───────────────────────────────────────
export const enrollmentAPI = {
  getAll:          ()            => api.get(`/api/v1/enrollments/all`),
  enroll:          (data)        => api.post(`/api/v1/enrollments`, data),
  unenroll:        (id)          => api.delete(`/api/v1/enrollments/${id}`),
  removeStudent:   (sId, cId)    => api.delete(`/api/v1/enrollments/${sId}/${cId}`),
  getByStudent:    (studentId)   => api.get(`/api/v1/enrollments/student/${studentId}`),
  getByCourse:     (courseId)    => api.get(`/api/v1/enrollments/course/${courseId}`),
  updateProgress:  (data)        => api.put(`/api/v1/enrollments/progress`, data),
  markComplete:    (sId, cId)    => api.put(`/api/v1/enrollments/complete/${sId}/${cId}`),
  isEnrolled:      (sId, cId)    => api.get(`/api/v1/enrollments/check?studentId=${sId}&courseId=${cId}`),
  issueCertificate:(sId, cId)    => api.post(`/api/v1/enrollments/certificate/${sId}/${cId}`),
  getCount:        (courseId)    => api.get(`/api/v1/enrollments/count/${courseId}`),
};

// ── Assessment Service ───────────────────────────────────────
export const assessmentAPI = {
  createQuiz:      (data)        => api.post(`/api/v1/quizzes`, data),
  getQuiz:         (id)          => api.get(`/api/v1/quizzes/${id}`),
  getQuizByCourse: (courseId)    => api.get(`/api/v1/quizzes/course/${courseId}`),
  updateQuiz:      (id, data)    => api.put(`/api/v1/quizzes/${id}`, data),
  publishQuiz:     (id)          => api.put(`/api/v1/quizzes/${id}/publish`),
  deleteQuiz:      (id)          => api.delete(`/api/v1/quizzes/${id}`),
  addQuestion:     (quizId, data)=> api.post(`/api/v1/quizzes/${quizId}/questions`, data),
  deleteQuestion:  (qId)         => api.delete(`/api/v1/questions/${qId}`),
  startAttempt:    (qId, sId)    => api.post(`/api/v1/attempts/start?quizId=${qId}&studentId=${sId}`),
  submitAttempt:   (data)        => api.post(`/api/v1/attempts/submit`, data),
  getAttempts:     (studentId)   => api.get(`/api/v1/attempts/student/${studentId}`),
  getAttemptDetails: (attemptId) => api.get(`/api/v1/attempts/${attemptId}/details`),
  getBestScore:     (studentId, quizId) => api.get(`/api/v1/attempts/best?studentId=${studentId}&quizId=${quizId}`),
};

// ── Payment Service ──────────────────────────────────────────
export const paymentAPI = {
  // Payments
  getAllPayments:  ()            => api.get(`/api/v1/payments/all`),
  createOrder:     (data)        => api.post(`/api/v1/payments/create-order`, data),
  verifyPayment:   (data)        => api.post(`/api/v1/payments/verify`, data),
  refund:          (paymentId)   => api.post(`/api/v1/payments/${paymentId}/refund`),
  getByStudent:    (studentId)   => api.get(`/api/v1/payments/student/${studentId}`),
  getByCourse:     (courseId)    => api.get(`/api/v1/payments/course/${courseId}`),
  getTotalAmount:  (studentId)   => api.get(`/api/v1/payments/total/${studentId}`),
  // Subscriptions
  subscribe:       (data)        => api.post(`/api/v1/subscriptions`, data),
  getSubscription: (studentId)   => api.get(`/api/v1/subscriptions/student/${studentId}`),
  isActive:        (studentId)   => api.get(`/api/v1/subscriptions/active/${studentId}`),
  cancelSub:       (studentId)   => api.put(`/api/v1/subscriptions/cancel/${studentId}`),
  cancelSubscription: (studentId) => api.put(`/api/v1/subscriptions/cancel/${studentId}`),
  renewSub:        (studentId)   => api.put(`/api/v1/subscriptions/renew/${studentId}`),
};

// ── Notification Service ─────────────────────────────────────
export const notificationAPI = {
  getByUser:       (userId)      => api.get(`/api/v1/notifications/user/${userId}`),
  markAsRead:      (id)          => api.put(`/api/v1/notifications/${id}/read`),
  markAllRead:     (userId)      => api.put(`/api/v1/notifications/user/${userId}/read-all`),
  getUnreadCount:  (userId)      => api.get(`/api/v1/notifications/user/${userId}/unread-count`),
  delete:          (id)          => api.delete(`/api/v1/notifications/${id}`),
};

// ── Discussion Service ───────────────────────────────────────
export const discussionAPI = {
  // Threads
  createThread:       (data)     => api.post('/api/v1/threads', data),
  getThreadsByCourse: (courseId) => api.get(`/api/v1/threads/course/${courseId}`),
  getLessonThreads:   (lessonId) => api.get(`/api/v1/threads/lesson/${lessonId}`),
  pinThread:          (id)       => api.put(`/api/v1/threads/${id}/pin`),
  closeThread:        (id)       => api.put(`/api/v1/threads/${id}/close`),
  deleteThread:       (id)       => api.delete(`/api/v1/threads/${id}`),

  // Replies
  postReply:          (data)     => api.post('/api/v1/replies', data),
  getReplies:         (threadId) => api.get(`/api/v1/replies/thread/${threadId}`),
  upvoteReply:        (id, userId) => api.put(`/api/v1/replies/${id}/upvote?userId=${userId}`),
  acceptReply:        (id)       => api.put(`/api/v1/replies/${id}/accept`),
  deleteReply:        (id)       => api.delete(`/api/v1/replies/${id}`),
};

// ── Progress Service ─────────────────────────────────────────
export const progressAPI = {
  trackProgress:      (data) => api.post(`/api/v1/progress/track`, data),
  markLessonComplete: (sId, cId, lId) => api.put(`/api/v1/progress/complete/${sId}/${cId}/${lId}`),
  getCourseProgress:  (sId, cId) => api.get(`/api/v1/progress/course?studentId=${sId}&courseId=${cId}`),
  getLessonProgress:  (sId, lId) => api.get(`/api/v1/progress/lesson?studentId=${sId}&lessonId=${lId}`),
  getAllProgressByStudent: (sId) => api.get(`/api/v1/progress/student/${sId}`),
  
  issueCertificate:   (sId, cId, courseName, instructorName) => api.post(`/api/v1/certificates/issue?studentId=${sId}&courseId=${cId}&courseName=${encodeURIComponent(courseName)}&instructorName=${encodeURIComponent(instructorName)}`),
  getCertificate:     (sId, cId) => api.get(`/api/v1/certificates?studentId=${sId}&courseId=${cId}`),
  verifyCertificate:  (code) => api.get(`/api/v1/certificates/verify/${code}`),
};

export default api;

