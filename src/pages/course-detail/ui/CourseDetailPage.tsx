import { useParams, Link } from 'react-router-dom';
import { useCourses } from '@entities/course/model/CoursesContext';
import { EnrollButton } from '@features/enroll-course/ui/EnrollButton';
import styles from './CourseDetail.module.css';

// Page "Детальная страница курса" — /courses/:id
// useParams — хук React Router, достаёт параметры из URL.
// Для /courses/42 → { id: '42' }

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { courses, getEnrollment, isLoading } = useCourses();

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  const course = courses.find(c => c.id === id);

  if (!course) {
    return (
      <div className={styles.notFound}>
        <p className={styles.notFoundText}>Курс не найден</p>
        <Link to="/courses" className={styles.backLink}>← Все курсы</Link>
      </div>
    );
  }

  const enrollment = getEnrollment(course.id);

  return (
    <div className={styles.page}>
      <Link to="/courses" className={styles.backLink}>← Все курсы</Link>

      <h1 className={styles.title}>{course.title}</h1>
      <p className={styles.meta}>{course.lessonsCount} уроков · Добавлен {course.createdAt}</p>

      <div className={styles.descriptionCard}>
        <h2 className={styles.descriptionTitle}>О курсе</h2>
        <p className={styles.descriptionText}>{course.description}</p>
      </div>

      {enrollment && enrollment.progress > 0 && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Ваш прогресс</span>
            <span className={styles.progressValue}>{enrollment.progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
        </div>
      )}

      <EnrollButton courseId={course.id} />
    </div>
  );
}
