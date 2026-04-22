import { useState } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import { CourseCard } from '@entities/course/ui/CourseCard';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin } from '@entities/user/model/types';
import styles from './CourseList.module.css';

// CourseList фильтрует курсы по courseType:
//   'all'      → видят все
//   'employee' → только EMPLOYEE
//   'client'   → только CLIENT
//
// Pending-курсы видит admin (со списком на модерацию) + автор (со статусом "ожидает").

export function CourseList() {
  const { courses, getEnrollment, approveCourse, rejectCourse, isLoading } = useCourses();
  const { user } = useUser();
  const admin = isAdmin(user);

  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting]  = useState<string | null>(null);

  const publishedCourses = courses.filter(c => {
    if (c.status !== 'published') return false;
    if (c.courseType === 'all') return true;
    return c.courseType === user.type.toLowerCase();
  });

  const pendingCourses = courses.filter(c => c.status === 'pending');

  const handleApprove = async (courseId: string) => {
    setApproving(courseId);
    try { await approveCourse(courseId); } finally { setApproving(null); }
  };

  const handleReject = async (courseId: string) => {
    setRejecting(courseId);
    try { await rejectCourse(courseId); } finally { setRejecting(null); }
  };

  if (isLoading) {
    return (
      <div className={styles.empty}>Загрузка курсов...</div>
    );
  }

  return (
    <div>
      {/* ── Секция модерации (только admin) ── */}
      {admin && pendingCourses.length > 0 && (
        <section className={styles.pendingSection}>
          <div className={styles.pendingHeader}>
            <Clock size={16} className={styles.pendingIcon} />
            <h2 className={styles.pendingTitle}>На модерации ({pendingCourses.length})</h2>
          </div>
          <div className={styles.pendingList}>
            {pendingCourses.map(course => (
              <div key={course.id} className={styles.pendingCard}>
                <div className={styles.pendingInfo}>
                  <span className={styles.pendingCourseName}>{course.title}</span>
                  <span className={styles.pendingMeta}>
                    {course.courseType === 'employee' ? 'Для сотрудников'
                      : course.courseType === 'client' ? 'Для клиентов'
                      : 'Для всех'} · {course.lessonsCount} уроков
                  </span>
                </div>
                <div className={styles.pendingActions}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => void handleApprove(course.id)}
                    disabled={approving === course.id || rejecting === course.id}
                    title="Одобрить и опубликовать"
                  >
                    <CheckCircle2 size={15} />
                    {approving === course.id ? 'Публикуем...' : 'Одобрить'}
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => void handleReject(course.id)}
                    disabled={approving === course.id || rejecting === course.id}
                    title="Вернуть в черновики"
                  >
                    <XCircle size={15} />
                    {rejecting === course.id ? 'Отклоняем...' : 'Отклонить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Собственные pending-курсы автора (не admin) ── */}
      {!admin && pendingCourses.filter(c => c.authorId === user.id).length > 0 && (
        <section className={styles.pendingSection}>
          <div className={styles.pendingHeader}>
            <Clock size={16} className={styles.pendingIcon} />
            <h2 className={styles.pendingTitle}>Ожидают публикации</h2>
          </div>
          <div className={styles.pendingList}>
            {pendingCourses.filter(c => c.authorId === user.id).map(course => (
              <div key={course.id} className={`${styles.pendingCard} ${styles.pendingCardAuthor}`}>
                <div className={styles.pendingInfo}>
                  <span className={styles.pendingCourseName}>{course.title}</span>
                  <span className={styles.pendingMeta}>Отправлен на проверку администратору</span>
                </div>
                <span className={styles.pendingBadge}>На модерации</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Опубликованные курсы ── */}
      {publishedCourses.length === 0 ? (
        <div className={styles.empty}>
          {courses.filter(c => c.status === 'published').length === 0
            ? 'Курсов пока нет. Создайте первый!'
            : 'Нет доступных курсов.'}
        </div>
      ) : (
        <div className={styles.grid}>
          {publishedCourses.map(course => (
            <CourseCard key={course.id} course={course} enrollment={getEnrollment(course.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
