import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminAccounts from './pages/AdminAccounts';
import Countries from './pages/Countries';
import Levels from './pages/Levels';
import Lessons from './pages/Lessons';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import StudentLevels from './pages/StudentLevels';
import StudentLessons from './pages/StudentLessons';
import StudentBalance from './pages/StudentBalance';
import TeacherClasses from './pages/TeacherClasses';
import TeacherClassStudents from './pages/TeacherClassStudents';
import TeacherClassSessions from './pages/TeacherClassSessions';
import TeacherClassFiles from './pages/TeacherClassFiles';
import TeacherSpaces from './pages/TeacherSpaces';
import Assignments from './pages/Assignments';
import AssignmentBlocks from './pages/AssignmentBlocks';
import Questions from './pages/Questions';
import Certificates from './pages/Certificates';
import Files from './pages/Files';
import Upload from './pages/Upload';
import Plans from './pages/Plans';
import StudentSubscribes from './pages/StudentSubscribes';
import StudentTransactions from './pages/StudentTransactions';
import AnswerReviews from './pages/AnswerReviews';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="admin-accounts" element={<AdminAccounts />} />
        <Route path="countries" element={<Countries />} />
        <Route path="levels" element={<Levels />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:studentId/levels" element={<StudentLevels />} />
        <Route path="students/:studentId/lessons" element={<StudentLessons />} />
        <Route path="students/:studentId/balance" element={<StudentBalance />} />
        <Route path="teacher-classes" element={<TeacherClasses />} />
        <Route path="teacher-classes/:classId/students" element={<TeacherClassStudents />} />
        <Route path="teacher-classes/:classId/sessions" element={<TeacherClassSessions />} />
        <Route path="teacher-classes/:classId/files" element={<TeacherClassFiles />} />
        <Route path="teacher-spaces" element={<TeacherSpaces />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="assignment-blocks" element={<AssignmentBlocks />} />
        <Route path="questions" element={<Questions />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="plans" element={<Plans />} />
        <Route path="student-subscribes" element={<StudentSubscribes />} />
        <Route path="student-transactions" element={<StudentTransactions />} />
        <Route path="answer-reviews" element={<AnswerReviews />} />
        <Route path="files" element={<Files />} />
        <Route path="upload" element={<Upload />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
