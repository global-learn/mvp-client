import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Course, Enrollment } from '../model/types';
import { COURSE_TYPE_LABELS } from '../model/types';
import styles from './CourseCard.module.css';

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
}

const enrollLabels: Record<string, string> = {
  in_progress: 'В процессе',
  completed:   'Завершён',
};

export function CourseCard({ course, enrollment }: CourseCardProps) {
  const enrollStatus = enrollment?.status && enrollment.status !== 'not_enrolled'
    ? enrollment.status
    : null;

  return (
    <div className={styles.card}>
      {/* Заголовок + статус */}
      <div className={styles.header}>
        <h3 className={styles.title}>{course.title}</h3>
        {enrollStatus && (
          <span className={`${styles.enrollBadge} ${styles[enrollStatus]}`}>
            {enrollLabels[enrollStatus]}
          </span>
        )}
      </div>

      {/* Тип курса */}
      <span className={`${styles.typeTag} ${styles[course.courseType]}`}>
        {COURSE_TYPE_LABELS[course.courseType]}
      </span>

      {/* Описание */}
      <p className={styles.description}>{course.description}</p>

      {/* Прогресс */}
      {enrollment && enrollment.progress > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressMeta}>
            <span className={styles.progressLabel}>Прогресс</span>
            <span className={styles.progressValue}>{enrollment.progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${enrollment.progress}%` }} />
          </div>
        </div>
      )}

      {/* Футер */}
      <div className={styles.footer}>
        <span className={styles.lessonsCount}>{course.lessonsCount} уроков</span>
        <Link to={`/courses/${course.id}`} className={styles.openLink}>
          Открыть <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
