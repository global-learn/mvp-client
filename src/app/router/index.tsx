import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@app/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage }   from '@pages/dashboard/ui/DashboardPage';
import { CoursesListPage } from '@pages/courses-list/ui/CoursesListPage';
import { CourseDetailPage } from '@pages/course-detail/ui/CourseDetailPage';
import { CourseCreatePage } from '@pages/course-create/ui/CourseCreatePage';
import { ProfilePage }     from '@pages/profile/ui/ProfilePage';
import { ClientsPage }     from '@pages/clients/ui/ClientsPage';
import { CompanyPage }     from '@pages/company/ui/CompanyPage';
import { ControlPage }     from '@pages/control/ui/ControlPage';
import { ChatPage }        from '@pages/chat/ui/ChatPage';
import { LoginPage }       from '@pages/login/ui/LoginPage';
import { RegisterPage }    from '@pages/register/ui/RegisterPage';
import { VerifyEmailPage } from '@pages/verify-email/ui/VerifyEmailPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Публичные маршруты (без AppLayout и авторизации) */}
      <Route path="/login"        element={<LoginPage />} />
      <Route path="/register"     element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Защищённые маршруты */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/"               element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"      element={<DashboardPage />} />
          <Route path="/courses"        element={<CoursesListPage />} />
          <Route path="/courses/create" element={<CourseCreatePage />} />
          <Route path="/courses/:id"    element={<CourseDetailPage />} />
          <Route path="/profile"        element={<ProfilePage />} />
          <Route path="/clients"        element={<ClientsPage />} />
          <Route path="/company"        element={<CompanyPage />} />
          <Route path="/control"        element={<ControlPage />} />
          <Route path="/chat"           element={<ChatPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
