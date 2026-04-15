import { useParams, Link } from 'react-router-dom';
import { useCourses } from '@entities/course/model/CoursesContext';
import { EnrollButton } from '@features/enroll-course/ui/EnrollButton';

// Page "Детальная страница курса" — /courses/:id
// useParams — хук React Router, достаёт параметры из URL.
// Для /courses/42 → { id: '42' }

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { courses, getEnrollment, isLoading } = useCourses();

  if (isLoading) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#a0aec0' }}>Загрузка...</div>;
  }

  const course = courses.find(c => c.id === id);

  if (!course) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <p style={{ color: '#718096', marginBottom: 16 }}>Курс не найден</p>
        <Link to="/courses" style={{ color: '#4299e1', textDecoration: 'none' }}>
          ← Все курсы
        </Link>
      </div>
    );
  }

  const enrollment = getEnrollment(course.id);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <Link
        to="/courses"
        style={{
          fontSize: 14,
          color: '#4299e1',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 28,
        }}
      >
        ← Все курсы
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a202c', margin: '0 0 8px' }}>
        {course.title}
      </h1>
      <p style={{ color: '#a0aec0', fontSize: 14, margin: '0 0 32px' }}>
        {course.lessonsCount} уроков · Добавлен {course.createdAt}
      </p>

      {/* Описание */}
      <div
        style={{
          background: '#f7fafc',
          borderRadius: 12,
          padding: '24px 28px',
          marginBottom: 28,
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: 18, color: '#2d3748' }}>О курсе</h2>
        <p style={{ margin: 0, lineHeight: 1.7, color: '#4a5568', fontSize: 15 }}>
          {course.description}
        </p>
      </div>

      {/* Прогресс — только если записан и есть прогресс */}
      {enrollment && enrollment.progress > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#4a5568' }}>Ваш прогресс</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>
              {enrollment.progress}%
            </span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4 }}>
            <div
              style={{
                width: `${enrollment.progress}%`,
                height: '100%',
                background: '#4299e1',
                borderRadius: 4,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}

      {/* Кнопка записи (feature) */}
      <EnrollButton courseId={course.id} />
    </div>
  );
}
