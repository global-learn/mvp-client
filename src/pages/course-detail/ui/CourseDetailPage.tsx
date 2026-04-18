import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin } from '@entities/user/model/types';
import { COURSE_TYPE_LABELS } from '@entities/course/model/types';
import { EnrollButton } from '@features/enroll-course/ui/EnrollButton';
import { AssignCourseModal } from '@features/assign-course/ui/AssignCourseModal';
import styles from './CourseDetail.module.css';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { courses, getEnrollment, isLoading } = useCourses();
  const { user } = useUser();
  const [assignOpen, setAssignOpen] = useState(false);

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

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{course.title}</h1>
        {isAdmin(user) && (
          <button className={styles.assignBtn} onClick={() => setAssignOpen(true)}>
            Назначить сотрудникам
          </button>
        )}
      </div>

      <div className={styles.metaRow}>
        <span className={styles.meta}>{course.lessonsCount} уроков · Добавлен {course.createdAt}</span>
        <span className={styles.courseTypeBadge}>{COURSE_TYPE_LABELS[course.courseType]}</span>
      </div>

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
            <div className={styles.progressFill} style={{ width: `${enrollment.progress}%` }} />
          </div>
        </div>
      )}

      <EnrollButton courseId={course.id} />

      {assignOpen && (
        <AssignCourseModal
          courseId={course.id}
          courseTitle={course.title}
          onClose={() => setAssignOpen(false)}
        />
      )}
    </div>
  );
}
