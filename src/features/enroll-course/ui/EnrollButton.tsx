import { useState, type CSSProperties } from 'react';
import { useCourses } from '@entities/course/model/CoursesContext';

// Feature "Запись на курс"
// ---------------------------------------------------------------
// Feature — это пользовательское действие с бизнес-ценностью.
// CourseCard просто отображает данные (entity).
// EnrollButton — делает действие: записывает пользователя на курс.
// Именно поэтому они в разных слоях.

interface EnrollButtonProps {
  courseId: string;
}

export function EnrollButton({ courseId }: EnrollButtonProps) {
  const { enroll, getEnrollment } = useCourses();
  const [isPending, setIsPending] = useState(false);

  const enrollment = getEnrollment(courseId);
  const status = enrollment?.status ?? 'not_enrolled';

  const handleEnroll = async () => {
    if (status !== 'not_enrolled') return;
    setIsPending(true);
    await enroll(courseId);
    setIsPending(false);
  };

  if (status === 'completed') {
    return (
      <button disabled style={{ ...btn, background: '#68d391', cursor: 'default' }}>
        Курс завершён ✓
      </button>
    );
  }

  if (status === 'in_progress') {
    return (
      <button disabled style={{ ...btn, background: '#63b3ed', cursor: 'default' }}>
        Обучение идёт...
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
