import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, BookOpen } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import { CourseCard } from '@entities/course/ui/CourseCard';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, isServiceDivision } from '@entities/user/model/types';
import type { CourseType } from '@entities/course/model/types';
import { COURSE_TYPE_LABELS } from '@entities/course/model/types';
import styles from './CourseList.module.css';

type TabFilter = 'all_types' | CourseType;

export function CourseList() {
  const { courses, enrollments, getEnrollment, approveCourse, rejectCourse, isLoading } = useCourses();
  const { user } = useUser();
  const admin = isAdmin(user);
  const isClient = user.type === 'CLIENT';
  const canSeeClientCourses = admin || isServiceDivision(user);

  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting]  = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('all_types');
  const [filterDeptId, setFilterDeptId] = useState('');
  const [filterDivId, setFilterDivId] = useState('');

  // Контекст уже вернул только видимые пользователю курсы.
  // Для отображения фильтруем только published (pending — в отдельной секции).
  const publishedCourses = useMemo(() => {
    const base = courses.filter(c => c.status === 'published');
    return base.filter(c => {
      if (activeTab !== 'all_types' && c.courseType !== activeTab) return false;
      if (activeTab === 'employee') {
        if (filterDeptId && c.targetDepartmentId !== filterDeptId) return false;
        if (filterDivId && c.targetDivisionId !== filterDivId) return false;
      }
      return true;
    });
  }, [courses, activeTab, filterDeptId, filterDivId]);

  const pendingCourses = courses.filter(c => c.status === 'pending');

  // Уникальные департаменты/отделы для dropdown-фильтров
  const allPublished = courses.filter(c => c.status === 'published');
  const depts = useMemo(() => {
    const map = new Map<string, string>();
    allPublished.forEach(c => {
      if (c.courseType === 'employee' && c.targetDepartmentId && c.targetDepartmentName)
        map.set(c.targetDepartmentId, c.targetDepartmentName);
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [allPublished]);

  const divs = useMemo(() => {
    const map = new Map<string, string>();
    allPublished.forEach(c => {
      if (c.courseType === 'employee' && c.targetDivisionId && c.targetDivisionName)
        map.set(c.targetDivisionId, c.targetDivisionName);
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [allPublished]);

  const handleApprove = async (courseId: string) => {
    setApproving(courseId);
    try { await approveCourse(courseId); } finally { setApproving(null); }
  };
  const handleReject = async (courseId: string) => {
    setRejecting(courseId);
    try { await rejectCourse(courseId); } finally { setRejecting(null); }
  };
  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab);
    setFilterDeptId('');
    setFilterDivId('');
  };

  if (isLoading) return <div className={styles.empty}>Загрузка курсов...</div>;

  // ── Вид для клиента ───────────────────────────────────────────
  if (isClient) {
    const myEnrolledCourses = publishedCourses.filter(c =>
      enrollments.some(e => e.courseId === c.id),
    );
    return (
      <div>
        {myEnrolledCourses.length === 0 ? (
          <div className={styles.empty}>
            <BookOpen size={40} style={{ opacity: 0.25, marginBottom: '1rem' }} />
            <p>Вам пока не назначено ни одного курса.</p>
            <p style={{ fontSize: '0.875rem' }}>Обратитесь к вашему менеджеру сервиса.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {myEnrolledCourses.map(course => (
              <CourseCard key={course.id} course={course} enrollment={getEnrollment(course.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Вкладки: зависят от роли ─────────────────────────────────
  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all_types', label: 'Все' },
    { key: 'all',       label: COURSE_TYPE_LABELS.all },
    { key: 'employee',  label: COURSE_TYPE_LABELS.employee },
    ...(canSeeClientCourses
      ? [{ key: 'client' as TabFilter, label: COURSE_TYPE_LABELS.client }]
      : []),
  ];

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
                    {COURSE_TYPE_LABELS[course.courseType]} · {course.lessonsCount} уроков
                  </span>
                </div>
                <div className={styles.pendingActions}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => void handleApprove(course.id)}
                    disabled={approving === course.id || rejecting === course.id}
                  >
                    <CheckCircle2 size={15} />
                    {approving === course.id ? 'Публикуем...' : 'Одобрить'}
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => void handleReject(course.id)}
                    disabled={approving === course.id || rejecting === course.id}
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

      {/* ── Фильтры ── */}
      <div className={styles.filterBar}>
        <div className={styles.typeTabs}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`${styles.typeTab} ${activeTab === t.key ? styles.typeTabActive : ''}`}
              onClick={() => handleTabChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'employee' && (depts.length > 0 || divs.length > 0) && (
          <div className={styles.filterSelects}>
            {depts.length > 0 && (
              <select
                className={styles.filterSelect}
                value={filterDeptId}
                onChange={e => setFilterDeptId(e.target.value)}
              >
                <option value="">Все департаменты</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            {divs.length > 0 && (
              <select
                className={styles.filterSelect}
                value={filterDivId}
                onChange={e => setFilterDivId(e.target.value)}
              >
                <option value="">Все отделы</option>
                {divs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
          </div>
        )}
      </div>

      {/* ── Опубликованные курсы ── */}
      {publishedCourses.length === 0 ? (
        <div className={styles.empty}>
          {allPublished.length === 0
            ? 'Курсов пока нет. Создайте первый!'
            : 'Нет курсов по выбранным фильтрам.'}
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
