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
      <div className={styles.header}>
        <h3 className={styles.title}>{course.title}</h3>
        {enrollStatus && (
          <span className={`${styles.status} ${styles[enrollStatus]}`}>
            {enrollLabels[enrollStatus]}
          </span>
        )}
      </div>

      <p className={styles.meta}>
        {COURSE_TYPE_LABELS[course.courseType]} &middot; {course.lessonsCount} уроков
      </p>

      <p className={styles.description}>{course.description}</p>

      {enrollment && enrollment.progress > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressRow}>
            <span className={styles.progressText}>Прогресс</span>
            <span className={styles.progressPct}>{enrollment.progress}%</span>
          </div>
          <div className={styles.bar}>
            <div className={styles.fill} style={{ width: `${enrollment.progress}%` }} />
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <Link to={`/courses/${course.id}`} className={styles.link}>
          Открыть курс <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
