import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@entities/user/model/UserContext';
import { canCreateCourses } from '@entities/user/model/types';
import { CourseBuilder } from '@widgets/course-builder/ui/CourseBuilder';

// CourseCreatePage защищает маршрут и рендерит CourseBuilder.
// Доступна admin и departmentHead.

export function CourseCreatePage() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!canCreateCourses(user)) {
      navigate('/courses', { replace: true });
    }
  }, [user, navigate]);

  if (!canCreateCourses(user)) return null;

  return <CourseBuilder />;
}
