import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@app/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage } from '@pages/dashboard/ui/DashboardPage';
import { CoursesListPage } from '@pages/courses-list/ui/CoursesListPage';
import { CourseDetailPage } from '@pages/course-detail/ui/CourseDetailPage';
import { CourseCreatePage } from '@pages/course-create/ui/CourseCreatePage';
import { CoursePlayerPage } from '@pages/course-player/ui/CoursePlayerPage';
import { ProfilePage } from '@pages/profile/ui/ProfilePage';
import { ClientsPage } from '@pages/clients/ui/ClientsPage';
import { CompanyPage } from '@pages/company/ui/CompanyPage';
import { LoginPage } from '@pages/login/ui/LoginPage';

// Структура маршрутов:
//
//   /login                → LoginPage (публичный, без Sidebar)
//   ProtectedRoute        → проверяет isAuthenticated, иначе → /login
//     AppLayout           → Sidebar + CoursesProvider + <Outlet />
//       /                 → /dashboard
//       /dashboard        → DashboardPage
//       /courses          → CoursesListPage
//       /courses/create   → CourseCreatePage (admin / departmentHead)
//       /courses/:id      → CourseDetailPage
//       /courses/:id/play → CoursePlayerPage (пошаговый плеер)
//       /profile          → ProfilePage
//       /clients          → ClientsPage
//       /company          → CompanyPage (admin)

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
          <Route path="/courses/:id/play" element={<CoursePlayerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/company" element={<CompanyPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
