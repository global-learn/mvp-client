import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useMyApplicationsQuery } from '@entities/course/api/hooks';
import { useCourses } from '@entities/course/model/CoursesContext';
import styles from './MyApplications.module.css';

// Виджет «Мои заявки на курсы» — показывает заявки сотрудника и их статусы.
// Закрывает пробел: отклонённые заявки (REJECTED) иначе не видны в UI.

type AppStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_META: Record<AppStatus, { label: string; cls: string; icon: typeof Clock }> = {
  PENDING:  { label: 'На рассмотрении', cls: styles.badgePending,  icon: Clock },
  APPROVED: { label: 'Одобрена',        cls: styles.badgeApproved, icon: CheckCircle2 },
  REJECTED: { label: 'Отклонена',       cls: styles.badgeRejected, icon: XCircle },
};

export function MyApplications() {
  const { data: applications = [], isLoading } = useMyApplicationsQuery();
  const { courses } = useCourses();

  const rows = useMemo(
    () =>
      applications.map(app => ({
        ...app,
        status: (app.status?.toUpperCase() as AppStatus) ?? 'PENDING',
        courseTitle: courses.find(c => c.id === app.courseId)?.title ?? 'Курс',
      })),
    [applications, courses],
  );

  if (isLoading || rows.length === 0) return null;

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Мои заявки</h2>
      <ul className={styles.list}>
        {rows.map(app => {
          const meta = STATUS_META[app.status] ?? STATUS_META.PENDING;
          const Icon = meta.icon;
          const date = new Date(app.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'short', year: 'numeric',
          });
          return (
            <li key={app.id} className={styles.row}>
              <Link to={`/courses/${app.courseId}`} className={styles.courseLink}>
                {app.courseTitle}
              </Link>
              <span className={styles.date}>{date}</span>
              <span className={`${styles.badge} ${meta.cls}`}>
                <Icon size={13} /> {meta.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
