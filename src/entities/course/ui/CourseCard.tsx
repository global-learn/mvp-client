import { Link } from 'react-router-dom';
import type { Course, Enrollment } from '../model/types';

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment; // опционально — если не записан, бейджа нет
}

const statusLabel: Record<string, string> = {
  in_progress: 'В процессе',
  completed: 'Завершён',
};

const statusColors: Record<string, { bg: string; color: string }> = {
  in_progress: { bg: '#bee3f8', color: '#2a69ac' },
  completed: { bg: '#c6f6d5', color: '#276749' },
};

// CourseCard — "тупой" компонент.
// Получает данные через пропсы, ничего не знает о контексте.
// Это сущность (entity) — отображает бизнес-объект "Курс".
export function CourseCard({ course, enrollment }: CourseCardProps) {
  const status = enrollment?.status;
  const badge = status && status !== 'not_enrolled' ? statusColors[status] : null;

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '20px 24px',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Заголовок + бейдж статуса записи */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a202c', lineHeight: 1.3 }}>
          {course.title}
        </h3>
        {badge && status && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 12,
              padding: '3px 10px',
              borderRadius: 20,
              background: badge.bg,
              color: badge.color,
              fontWeight: 500,
            }}
          >
            {statusLabel[status]}
          </span>
        )}
      </div>

      {/* Описание */}
      <p
        style={{
          margin: '0 0 16px',
          fontSize: 14,
          color: '#718096',
          lineHeight: 1.5,
          flexGrow: 1,
        }}
      >
        {course.description}
      </p>

      {/* Прогресс-бар — только если есть прогресс */}
      {enrollment && enrollment.progress > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#a0aec0' }}>Прогресс</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#718096' }}>
              {enrollment.progress}%
            </span>
          </div>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
            <div
              style={{
                width: `${enrollment.progress}%`,
                height: '100%',
                background: '#4299e1',
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      )}

      {/* Футер: мета-инфо + ссылка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#a0aec0' }}>{course.lessonsCount} уроков</span>
        <Link
          to={`/courses/${course.id}`}
          style={{ fontSize: 14, color: '#4299e1', textDecoration: 'none', fontWeight: 500 }}
        >
          Открыть →
        </Link>
      </div>
    </div>
  );
}
