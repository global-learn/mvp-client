import { Link } from 'react-router-dom';
import type { Course, Enrollment } from '../model/types';
import { COURSE_TYPE_LABELS } from '../model/types';

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
}

const enrollStatusConfig: Record<string, { label: string; bg: string; color: string }> = {
  in_progress: { label: 'В процессе', bg: '#bee3f8', color: '#2a69ac' },
  completed:   { label: 'Завершён',   bg: '#c6f6d5', color: '#276749' },
};

const courseTypeConfig: Record<string, { bg: string; color: string }> = {
  employee: { bg: '#ebf4ff', color: '#4299e1' },
  client:   { bg: '#faf5ff', color: '#9f7aea' },
  all:      { bg: '#f0fff4', color: '#48bb78' },
};

export function CourseCard({ course, enrollment }: CourseCardProps) {
  const enrollConfig = enrollment?.status && enrollment.status !== 'not_enrolled'
    ? enrollStatusConfig[enrollment.status]
    : null;
  const typeConfig = courseTypeConfig[course.courseType];

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px 24px',
      background: 'var(--card)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Заголовок + статус записи */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.3 }}>
          {course.title}
        </h3>
        {enrollConfig && (
          <span style={{ flexShrink: 0, fontSize: 12, padding: '3px 10px', borderRadius: 20, background: enrollConfig.bg, color: enrollConfig.color, fontWeight: 500 }}>
            {enrollConfig.label}
          </span>
        )}
      </div>

      {/* Тип курса */}
      <span style={{ display: 'inline-block', marginBottom: 10, fontSize: 11, padding: '2px 8px', borderRadius: 999, background: typeConfig.bg, color: typeConfig.color, fontWeight: 500, width: 'fit-content' }}>
        {COURSE_TYPE_LABELS[course.courseType]}
      </span>

      {/* Описание */}
      <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--muted-foreground)', lineHeight: 1.5, flexGrow: 1 }}>
        {course.description}
      </p>

      {/* Прогресс */}
      {enrollment && enrollment.progress > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Прогресс</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)' }}>{enrollment.progress}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
            <div style={{ width: `${enrollment.progress}%`, height: '100%', background: 'var(--primary)', borderRadius: 2 }} />
          </div>
        </div>
      )}

      {/* Футер */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{course.lessonsCount} уроков</span>
        <Link to={`/courses/${course.id}`} style={{ fontSize: 14, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
          Открыть →
        </Link>
      </div>
    </div>
  );
}
