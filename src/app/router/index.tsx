import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@app/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage } from '@pages/dashboard/ui/DashboardPage';
import { CoursesListPage } from '@pages/courses-list/ui/CoursesListPage';
import { CourseDetailPage } from '@pages/course-detail/ui/CourseDetailPage';
import { CourseCreatePage } from '@pages/course-create/ui/CourseCreatePage';
import { LoginPage } from '@pages/login/ui/LoginPage';

// Структура маршрутов:
//
//   /login              → LoginPage (публичный, без Sidebar)
//   ProtectedRoute      → проверяет isAuthenticated, иначе → /login
//     AppLayout         → рендерит Sidebar + <Outlet />
//       /               → редирект на /dashboard
//       /dashboard      → DashboardPage
//       /courses        → CoursesListPage
//       /courses/create → CourseCreatePage (доступна только admin)
//       /courses/:id    → CourseDetailPage

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesListPage />} />
          <Route path="/courses/create" element={<CourseCreatePage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
