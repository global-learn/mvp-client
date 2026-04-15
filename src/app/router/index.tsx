import { Routes, Route, Navigate } from 'react-router-dom';
import { CoursesListPage } from '@pages/courses-list/ui/CoursesListPage';
import { CourseDetailPage } from '@pages/course-detail/ui/CourseDetailPage';
import { CourseCreatePage } from '@pages/course-create/ui/CourseCreatePage';

// ================================================================
// Все маршруты приложения — только здесь, в app слое.
// ================================================================
// Страницы НЕ знают своих URL. Роутер — единственное место где
// URL и компоненты связываются. Это важно: если URL меняется,
// меняешь только здесь, не трогая сами страницы.
//
// Порядок маршрутов важен: /courses/create должен быть ДО /courses/:id,
// иначе "create" будет воспринято как id курса.

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/courses" replace />} />
      <Route path="/courses" element={<CoursesListPage />} />
      <Route path="/courses/create" element={<CourseCreatePage />} />
      <Route path="/courses/:id" element={<CourseDetailPage />} />
    </Routes>
  );
}
