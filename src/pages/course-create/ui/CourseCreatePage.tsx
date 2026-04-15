import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin } from '@entities/user/model/types';
import { CourseBuilder } from '@widgets/course-builder/ui/CourseBuilder';

// CourseCreatePage защищает маршрут и рендерит CourseBuilder.
// Только admin (EMPLOYEE с role.name === 'admin') может создавать курсы.

export function CourseCreatePage() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin(user)) {
      navigate('/courses', { replace: true });
    }
  }, [user, navigate]);

  if (!isAdmin(user)) return null;

  return <CourseBuilder />;
}
