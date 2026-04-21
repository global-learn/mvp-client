import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@entities/user/model/UserContext';
import { canCreateCourse } from '@entities/user/model/types';
import { CourseBuilder } from '@widgets/course-builder/ui/CourseBuilder';

// Доступ: admin | руководитель отдела | старший менеджер

export function CourseCreatePage() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!canCreateCourse(user)) {
      navigate('/courses', { replace: true });
    }
  }, [user, navigate]);

  if (!canCreateCourse(user)) return null;

  return <CourseBuilder />;
}
