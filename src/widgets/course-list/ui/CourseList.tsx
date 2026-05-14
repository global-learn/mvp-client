import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, BookOpen, TrendingUp, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCourses } from '@entities/course/model/CoursesContext';
import { CourseCard } from '@entities/course/ui/CourseCard';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, isServiceDivision, canControl, isManager } from '@entities/user/model/types';
import type { CourseType } from '@entities/course/model/types';
import { COURSE_TYPE_LABELS } from '@entities/course/model/types';
import styles from './CourseList.module.css';

type TabFilter = 'all_types' | CourseType;

export function CourseList() {
  const { courses, enrollments, getEnrollment, approveCourse, rejectCourse, isLoading } = useCourses();
  const { user } = useUser();
  const admin        = isAdmin(user);
  const isClient     = user.type === 'CLIENT';
  const isRegularMgr = isManager(user);          // только роль manager
  const isController = canControl(user);          // admin/dept_head/div_head/senior_manager
  const canSeeClientCourses = admin || isServiceDivision(user);

  const [approving, setApproving]   = useState<string | null>(null);
  const [rejecting, setRejecting]   = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<TabFilter>('all_types');
  const [filterDeptId, setFilterDeptId] = useState('');
  const [filterDivId,  setFilterDivId]  = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');

  const allPublished  = useMemo(() => courses.filter(c => c.status === 'published'), [courses]);
  const pendingCourses = courses.filter(c => c.status === 'pending');

  // ── Фильтрованные опубликованные (для canControl-вида) ────────
  const publishedCourses = useMemo(() => {
    return allPublished.filter(c => {
      if (activeTab !== 'all_types' && c.courseType !== activeTab) return false;
      if (activeTab === 'employee') {
        if (filterDeptId && c.targetDepartmentId !== filterDeptId) return false;
        if (filterDivId  && c.targetDivisionId  !== filterDivId)  return false;
      }
      return true;
    });
  }, [allPublished, activeTab, filterDeptId, filterDivId]);

  // ── Мои курсы (любой enrollement в published-курсе) ──────────
  const myEnrolledCourses = useMemo(() =>
    allPublished.filter(c => enrollments.some(e => e.courseId === c.id)),
  [allPublished, enrollments]);

  // ── Для менеджера: "Назначенные" vs "Доступные" ───────────────
  const assignedCourses  = myEnrolledCourses; // все, где есть enrollment
  const availableCourses = useMemo(() => {
    const notEnrolled = allPublished.filter(c => !enrollments.some(e => e.courseId === c.id));
    if (!searchQuery.trim()) return notEnrolled;
    const q = searchQuery.toLowerCase();
    return notEnrolled.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q),
    );
  }, [allPublished, enrollments, searchQuery]);

  // ── Dropdown-фильтры (для canControl) ───────────────────────
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

  // ════════════════════════════════════════════════════════════════
  // ВИД ДЛЯ КЛИЕНТА
  // ════════════════════════════════════════════════════════════════
  if (isClient) {
    const clientCourses = allPublished.filter(c => enrollments.some(e => e.courseId === c.id));
    return (
      <div>
        {clientCourses.length === 0 ? (
          <div className={styles.empty}>
            <BookOpen size={40} style={{ opacity: 0.25, marginBottom: '1rem' }} />
            <p>Вам пока не назначено ни одного курса.</p>
            <p style={{ fontSize: '0.875rem' }}>Обратитесь к вашему менеджеру сервиса.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {clientCourses.map(course => (
              <CourseCard key={course.id} course={course} enrollment={getEnrollment(course.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // ВИД ДЛЯ ОБЫЧНОГО МЕНЕДЖЕРА (роль manager)
  // ════════════════════════════════════════════════════════════════
  if (isRegularMgr) {
    return (
      <div>
        {/* Назначенные курсы */}
        {assignedCourses.length > 0 ? (
          <section className={styles.myCoursesSection}>
            <div className={styles.myCoursesHeader}>
              <TrendingUp size={16} className={styles.myCoursesIcon} />
              <h2 className={styles.myCoursesTitle}>Назначенные курсы</h2>
              <span className={styles.sectionCount}>{assignedCourses.length}</span>
            </div>
            <div className={styles.myCoursesList}>
              {assignedCourses.map(course => {
                const enrollment = getEnrollment(course.id);
                const progress   = enrollment?.progress ?? 0;
                const isDone     = enrollment?.status === 'completed';
                const isPending  = enrollment?.status === 'pending_approval';
                return (
                  <Link key={course.id} to={`/courses/${course.id}`} className={styles.myCourseCard}>
                    <div className={styles.myCourseInfo}>
                      <span className={styles.myCourseName}>{course.title}</span>
                      <span className={styles.myCourseMeta}>
                        {course.lessonsCount} уроков
                        {isDone && <span className={styles.myCourseCompletedBadge}>✓ Завершён</span>}
                        {isPending && <span className={styles.myCoursePendingBadge}>⏳ Ожидает одобрения</span>}
                      </span>
                    </div>
                    {!isPending && (
                      <div className={styles.myCourseProgress}>
                        <div className={styles.myCourseProgressBar}>
                          <div
                            className={isDone ? styles.myCourseProgressFillDone : styles.myCourseProgressFill}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className={styles.myCourseProgressPct}>{progress}%</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <div className={styles.noAssigned}>
            <BookOpen size={32} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
            <p>Вам пока не назначено ни одного курса.</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0' }}>
              Обратитесь к руководителю или запишитесь самостоятельно ниже.
            </p>
          </div>
        )}

        {/* Доступные для записи */}
        <div className={styles.availableSection}>
          <div className={styles.availableHeader}>
            <h2 className={styles.availableTitle}>Доступно для записи</h2>
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Поиск курсов..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {availableCourses.length === 0 ? (
            <div className={styles.empty} style={{ padding: '2rem 0' }}>
              {searchQuery ? 'Ничего не найдено. Попробуйте другой запрос.' : 'Все доступные курсы уже у вас.'}
            </div>
          ) : (
            <div className={styles.grid}>
              {availableCourses.map(course => (
                <CourseCard key={course.id} course={course} enrollment={getEnrollment(course.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // ВИД ДЛЯ КОНТРОЛИРУЮЩИХ РОЛЕЙ (admin, dept_head, div_head, senior_manager)
  // ════════════════════════════════════════════════════════════════
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

      {/* ── Мои курсы ── */}
      {myEnrolledCourses.length > 0 && (
        <section className={styles.myCoursesSection}>
          <div className={styles.myCoursesHeader}>
            <TrendingUp size={16} className={styles.myCoursesIcon} />
            <h2 className={styles.myCoursesTitle}>Мои курсы</h2>
            <span className={styles.sectionCount}>{myEnrolledCourses.length}</span>
          </div>
          <div className={styles.myCoursesList}>
            {myEnrolledCourses.map(course => {
              const enrollment = getEnrollment(course.id);
              const progress = enrollment?.progress ?? 0;
              const isDone   = enrollment?.status === 'completed';
              return (
                <Link key={course.id} to={`/courses/${course.id}`} className={styles.myCourseCard}>
                  <div className={styles.myCourseInfo}>
                    <span className={styles.myCourseName}>{course.title}</span>
                    <span className={styles.myCourseMeta}>
                      {course.lessonsCount} уроков
                      {isDone && <span className={styles.myCourseCompletedBadge}>✓ Завершён</span>}
                    </span>
                  </div>
                  <div className={styles.myCourseProgress}>
                    <div className={styles.myCourseProgressBar}>
                      <div
                        className={isDone ? styles.myCourseProgressFillDone : styles.myCourseProgressFill}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className={styles.myCourseProgressPct}>{progress}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Фильтры + поиск ── */}
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
              <select className={styles.filterSelect} value={filterDeptId}
                onChange={e => setFilterDeptId(e.target.value)}>
                <option value="">Все департаменты</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            {divs.length > 0 && (
              <select className={styles.filterSelect} value={filterDivId}
                onChange={e => setFilterDivId(e.target.value)}>
                <option value="">Все отделы</option>
                {divs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Поиск (для canControl) */}
        <div className={styles.searchWrap} style={{ marginLeft: 'auto' }}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Опубликованные курсы ── */}
      {(() => {
        const filtered = searchQuery.trim()
          ? publishedCourses.filter(c =>
              c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.description.toLowerCase().includes(searchQuery.toLowerCase()),
            )
          : publishedCourses;
        return filtered.length === 0 ? (
          <div className={styles.empty}>
            {allPublished.length === 0
              ? 'Курсов пока нет. Создайте первый!'
              : 'Нет курсов по выбранным фильтрам.'}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(course => (
              <CourseCard key={course.id} course={course} enrollment={getEnrollment(course.id)} />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
