import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '@entities/course/model/CoursesContext';

// Feature "Запись на курс"
// Используется в списке курсов (CourseCard) и на странице курса.
// На странице курса (CourseDetailPage) есть свой встроенный плеер —
// там EnrollButton не используется.

interface EnrollButtonProps {
  courseId: string;
}

export function EnrollButton({ courseId }: EnrollButtonProps) {
  const { enroll, getEnrollment } = useCourses();
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const enrollment = getEnrollment(courseId);
  const status = enrollment?.status ?? 'not_enrolled';

  const handleEnroll = async () => {
    if (status !== 'not_enrolled') return;
    setIsPending(true);
    await enroll(courseId);
    setIsPending(false);
    navigate(`/courses/${courseId}`);
  };

  if (status === 'completed') {
    return (
      <button
        onClick={() => navigate(`/courses/${courseId}`)}
        style={{ ...btn, background: '#38a169', cursor: 'pointer' }}
      >
        Курс завершён ✓
      </button>
    );
  }

  if (status === 'in_progress') {
    return (
      <button
        onClick={() => navigate(`/courses/${courseId}`)}
        style={{ ...btn, background: '#4299e1', cursor: 'pointer' }}
      >
        Продолжить курс →
      </button>
    );
  }

  return (
    <button
      onClick={() => void handleEnroll()}
      disabled={isPending}
      style={{ ...btn, background: '#4299e1', cursor: 'pointer', opacity: isPending ? 0.7 : 1 }}
    >
      {isPending ? 'Записываем...' : 'Записаться на курс'}
    </button>
  );
}

const btn: CSSProperties = {
  padding: '12px 28px',
  borderRadius: 8,
  border: 'none',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
};
