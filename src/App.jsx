// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import './styles/global.css';

// ── Public Pages ──────────────────────────────────────────────
import LandingPage        from './pages/LandingPage';
import CoursesPage        from './pages/CoursesPage';
import CourseDetailPage   from './pages/CourseDetailPage';
import GuestDashboardPage from './pages/GuestDashboardPage';

// ── Auth Pages ────────────────────────────────────────────────
import LoginPage          from './pages/auth/LoginPage';
import RegisterPage       from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/auth/ResetPasswordPage';
import AdminLogin         from './pages/auth/AdminLogin';
import OAuth2RedirectHandler from './pages/auth/OAuth2RedirectHandler';

// ── Student Pages ─────────────────────────────────────────────
import StudentDashboard   from './pages/student/StudentDashboard';
import MyLearningPage     from './pages/student/MyLearningPage';
import LessonPlayerPage   from './pages/student/LessonPlayerPage';
import QuizPage           from './pages/student/QuizPage';
import QuizzesPage        from './pages/student/QuizzesPage';
import QuizResultPage    from './pages/student/QuizResultPage';
import ProgressPage       from './pages/student/ProgressPage';
import CertificatePage    from './pages/student/CertificatePage';
import DiscussionPage     from './pages/student/DiscussionPage';
import NotificationsPage  from './pages/student/NotificationsPage';

// ── Shared Pages ──────────────────────────────────────────────
import ProfilePage        from './pages/ProfilePage';

// ── Instructor Pages ──────────────────────────────────────────
import InstructorDashboard    from './pages/instructor/InstructorDashboard';
import InstructorCoursesPage  from './pages/instructor/InstructorCoursesPage';
import CreateCoursePage       from './pages/instructor/CreateCoursePage';
import InstructorEnrollmentsPage from './pages/instructor/InstructorEnrollmentsPage';
import CourseCurriculumPage   from './pages/instructor/CourseCurriculumPage';
import PaymentsPage           from './pages/instructor/PaymentsPage';
import InstructorCertificatesPage from './pages/instructor/InstructorCertificatesPage';

// ── Admin Pages ───────────────────────────────────────────────
import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminUsersPage     from './pages/admin/AdminUsersPage';
import AdminCoursesPage   from './pages/admin/AdminCoursesPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminPaymentsPage  from './pages/admin/AdminPaymentsPage';
import AdminEnrollmentsPage from './pages/admin/AdminEnrollmentsPage';
import AdminCertificatesPage from './pages/admin/AdminCertificatesPage';

const HomeSelector = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <LandingPage />;

  switch (user.role) {
    case 'STUDENT':    return <Navigate to="/student/dashboard" replace />;
    case 'INSTRUCTOR': return <Navigate to="/instructor/dashboard" replace />;
    case 'ADMIN':      return <Navigate to="/admin/dashboard" replace />;
    default:           return <LandingPage />;
  }
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public Routes ─────────────────────────────── */}
          <Route path="/" element={<HomeSelector />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />

          {/* ── Auth Routes ───────────────────────────────── */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/admin/login"     element={<AdminLogin />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* ── Student Routes ────────────────────────────── */}
          <Route path="/student/dashboard"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/my-learning"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><MyLearningPage /></ProtectedRoute>} />
          <Route path="/student/lesson/:courseId"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><LessonPlayerPage /></ProtectedRoute>} />
          <Route path="/student/quiz/:assessmentId"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><QuizPage /></ProtectedRoute>} />
          <Route path="/student/quiz/result/:attemptId"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><QuizResultPage /></ProtectedRoute>} />
          <Route path="/student/quiz"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><QuizzesPage /></ProtectedRoute>} />
          <Route path="/student/progress"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><ProgressPage /></ProtectedRoute>} />
          <Route path="/student/certificates"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><CertificatePage /></ProtectedRoute>} />
          <Route path="/student/discussion/:courseId"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><DiscussionPage /></ProtectedRoute>} />
          <Route path="/student/discussion"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><DiscussionPage /></ProtectedRoute>} />
          <Route path="/student/notifications"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/student/profile"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><ProfilePage /></ProtectedRoute>} />

          {/* ── Instructor Routes ─────────────────────────── */}
          <Route path="/instructor/dashboard"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>} />
          <Route path="/instructor/courses"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCoursesPage /></ProtectedRoute>} />
          <Route path="/instructor/create-course"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><CreateCoursePage /></ProtectedRoute>} />
          <Route path="/instructor/edit-course/:courseId"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><CreateCoursePage /></ProtectedRoute>} />
          <Route path="/instructor/course/:courseId/curriculum"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><CourseCurriculumPage /></ProtectedRoute>} />
          <Route path="/instructor/enrollments"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorEnrollmentsPage /></ProtectedRoute>} />
          <Route path="/instructor/payments"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><PaymentsPage /></ProtectedRoute>} />
          <Route path="/instructor/notifications"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/instructor/discussion/:courseId"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><DiscussionPage /></ProtectedRoute>} />
          <Route path="/instructor/discussion"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><DiscussionPage /></ProtectedRoute>} />
          <Route path="/instructor/profile"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><ProfilePage /></ProtectedRoute>} />
          <Route path="/instructor/certificates"
            element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCertificatesPage /></ProtectedRoute>} />

          {/* ── Admin Routes ──────────────────────────────── */}
          <Route path="/admin/dashboard"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/courses"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCoursesPage /></ProtectedRoute>} />
          <Route path="/admin/enrollments"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminEnrollmentsPage /></ProtectedRoute>} />
          <Route path="/admin/certificates"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCertificatesPage /></ProtectedRoute>} />
          <Route path="/admin/analytics"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAnalyticsPage /></ProtectedRoute>} />
          <Route path="/admin/payments"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPaymentsPage /></ProtectedRoute>} />
          <Route path="/admin/notifications"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/admin/profile"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><ProfilePage /></ProtectedRoute>} />

          {/* ── Fallback ──────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
