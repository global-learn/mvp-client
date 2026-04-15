import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@app/layouts/AppLayout';
import { DashboardPage } from '@pages/dashboard/ui/DashboardPage';
import { CoursesListPage } from '@pages/courses-list/ui/CoursesListPage';
import { CourseDetailPage } from '@pages/course-detail/ui/CourseDetailPage';
import { CourseCreatePage } from '@pages/course-create/ui/CourseCreatePage';

// Nested routes (React Router v6):
// AppLayout рендерит <Outlet /> — в него подставляется активная дочерняя страница.
// Все страницы автоматически получают Sidebar без дублирования.

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesListPage />} />
        <Route path="/courses/create" element={<CourseCreatePage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
      </Route>
    </Routes>
  );
}
