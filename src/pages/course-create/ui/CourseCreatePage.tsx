import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@entities/user/model/UserContext';
import { CourseBuilder } from '@widgets/course-builder/ui/CourseBuilder';

// CourseCreatePage теперь просто защищает маршрут и рендерит CourseBuilder.
// Вся логика создания курса (структура, сохранение) — внутри CourseBuilder.

export function CourseCreatePage() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user.role !== 'admin') {
      navigate('/courses', { replace: true });
    }
  }, [user.role, navigate]);

  if (user.role !== 'admin') return null;

  return <CourseBuilder />;
}
