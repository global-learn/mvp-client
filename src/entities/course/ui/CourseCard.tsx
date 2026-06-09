import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import type { Course, Enrollment } from '../model/types';
import { useCoverUrl } from '../api/hooks';
import styles from './CourseCard.module.css';

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
}

const STATUS_LABELS: Record<string, string> = {
  in_progress:      'В процессе',
  completed:        'Завершён',
  pending_approval: 'Ожидает одобрения',
  rejected:         'Заявка отклонена',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function courseSizeMeta(course: Course): string {
  if (course.lessonsCount > 0) return `${course.lessonsCount} уроков`;
  if (course.moduleCount != null) return `${course.moduleCount} модулей`;
  return '';
}

export function CourseCard({ course, enrollment }: CourseCardProps) {
  const enrollStatus = enrollment?.status && enrollment.status !== 'not_enrolled'
    ? enrollment.status
    : null;

  const { data: coverUrl } = useCoverUrl(course.coverId);
  const sizeMeta = courseSizeMeta(course);

  return (
    <Link to={`/courses/${course.id}`} className={styles.card}>
      <div className={styles.cover}>
        {coverUrl ? (
          <img src={coverUrl} alt={course.title} className={styles.coverImg} />
        ) : (
          <div className={styles.coverPlaceholder}>
            <BookOpen size={32} />
          </div>
        )}
      </div>

      <div className={styles.header}>
        <h3 className={styles.title}>{course.title}</h3>
        {enrollStatus && (
          <span className={`${styles.status} ${styles[enrollStatus] ?? ''}`}>
            {STATUS_LABELS[enrollStatus] ?? enrollStatus}
          </span>
        )}
      </div>

      <p className={styles.meta}>
        {sizeMeta && <>{sizeMeta} &middot; </>}
        Добавлен {formatDate(course.createdAt)}
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
    </Link>
  );
}
