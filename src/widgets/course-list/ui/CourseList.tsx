import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, BookOpen, TrendingUp, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCourses } from '@entities/course/model/CoursesContext';
import { CourseCard } from '@entities/course/ui/CourseCard';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, isManager } from '@entities/user/model/types';
import { useDepartmentsQuery, useDivisionsQuery } from '@entities/company/api/hooks';
import styles from './CourseList.module.css';

export function CourseList() {
  const { courses, enrollments, getEnrollment, approveCourse, rejectCourse, isLoading } = useCourses();
  const { user } = useUser();
  const admin        = isAdmin(user);
  const isRegularMgr = isManager(user);

  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDivId,  setSelectedDivId]  = useState('');

  const { data: deptPage } = useDepartmentsQuery({ limit: 200 });
  const { data: divPage  } = useDivisionsQuery({ limit: 200 });
  const departments = deptPage?.data ?? [];
  const divisions   = divPage?.data  ?? [];

  const allPublished   = useMemo(() => courses.filter(c => c.status === 'published'), [courses]);
  const pendingCourses = courses.filter(c => c.status === 'pending');

  const publishedCourses = useMemo(() => {
    if (selectedDivId)  return allPublished.filter(c => c.targetDivisionId   === selectedDivId);
    if (selectedDeptId) return allPublished.filter(c => c.targetDepartmentId === selectedDeptId);
    return allPublished;
  }, [allPublished, selectedDeptId, selectedDivId]);

  // ── Мои курсы (любой enrollment в published-курсе) ──────────
  const myEnrolledCourses = useMemo(() =>
    allPublished.filter(c => enrollments.some(e => e.courseId === c.id)),
  [allPublished, enrollments]);

  // ── Для менеджера: "Назначенные" vs "Доступные" ───────────────
  const assignedCourses  = myEnrolledCourses;
  const availableCourses = useMemo(() => {
    const notEnrolled = allPublished.filter(c => !enrollments.some(e => e.courseId === c.id));
    if (!searchQuery.trim()) return notEnrolled;
    const q = searchQuery.toLowerCase();
    return notEnrolled.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q),
    );
  }, [allPublished, enrollments, searchQuery]);

  const handleApprove = async (courseId: string) => {
    setApproving(courseId);
    try { await approveCourse(courseId); } finally { setApproving(null); }
  };
  const handleReject = async (courseId: string) => {
    setRejecting(courseId);
    try { await rejectCourse(courseId); } finally { setRejecting(null); }
  };

  if (isLoading) return <div className={styles.empty}>Загрузка курсов...</div>;

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
                  <span className={styles.pendingMeta}>{course.description}</span>
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

      {/* ── Фильтры ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterSelects}>
          <select
            className={styles.filterSelect}
            value={selectedDeptId}
            onChange={e => { setSelectedDeptId(e.target.value); setSelectedDivId(''); }}
          >
            <option value="">Все департаменты</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={selectedDivId}
            onChange={e => setSelectedDivId(e.target.value)}
          >
            <option value="">Все отделы</option>
            {(selectedDeptId
              ? divisions.filter(d => d.departmentId === selectedDeptId)
              : divisions
            ).map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.searchWrap} style={{ marginLeft: 'auto' }}>
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
