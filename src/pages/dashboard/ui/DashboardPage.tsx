import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Clock, BookOpen, CheckCircle2,
  Award, ArrowRight, Calendar, GraduationCap,
} from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useOnboarding } from '@entities/onboarding/model/OnboardingContext';
import { displayName } from '@entities/user/model/types';
import type { Enrollment, Course } from '@entities/course/model/types';
import styles from './Dashboard.module.css';

// ── Утилита: относительное время ────────────────────────────────
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  const hrs = Math.floor(min / 60);
  const days = Math.floor(hrs / 24);
  if (min < 1)  return 'Только что';
  if (min < 60) return `${min} мин. назад`;
  if (hrs < 24) return `${hrs} ч. назад`;
  if (days === 1) return 'Вчера';
  return `${days} дн. назад`;
}

// ── Тип элемента активности ──────────────────────────────────────
type ActivityType = 'onboarding' | 'completed' | 'enrolled';

interface ActivityItem {
  id:    string;
  type:  ActivityType;
  title: string;
  sub:   string;
  time:  string; // ISO
}

export function DashboardPage() {
  const { user }                          = useUser();
  const { courses, enrollments, certificates } = useCourses();
  const { myAssignments }                 = useOnboarding();

  // ── Статистика ───────────────────────────────────────────────
  const completedEnrollments   = enrollments.filter(e => e.status === 'completed');
  const inProgressEnrollments  = enrollments.filter(e => e.status === 'in_progress');
  const totalCompletedItems    = enrollments.reduce((s, e) => s + e.completedItems.length, 0);
  // ~45 мин на каждый пройденный элемент (урок / тест)
  const hoursLearned           = Math.round(totalCompletedItems * 0.75);

  // ── Текущий курс: in_progress с наибольшим числом пройденных ──
  const currentEnrollment = useMemo<Enrollment | null>(() =>
    inProgressEnrollments.reduce<Enrollment | null>(
      (best, e) => !best || e.completedItems.length > best.completedItems.length ? e : best,
      null,
    ),
    [inProgressEnrollments],
  );
  const currentCourse = useMemo<Course | null>(() =>
    currentEnrollment ? (courses.find(c => c.id === currentEnrollment.courseId) ?? null) : null,
    [currentEnrollment, courses],
  );

  // Следующий непройденный шаг в текущем курсе
  const nextStep = useMemo(() => {
    if (!currentCourse || !currentEnrollment) return null;
    const done = new Set(currentEnrollment.completedItems);
    for (const mod of currentCourse.modules ?? []) {
      for (const step of mod.steps) {
        if (step.items.some(i => !done.has(i.id))) return { mod, step };
      }
    }
    return null;
  }, [currentCourse, currentEnrollment]);

  // Общее число элементов в текущем курсе
  const currentTotalItems = useMemo(() =>
    (currentCourse?.modules ?? []).flatMap(m => m.steps.flatMap(s => s.items)).length
    || (currentCourse?.lessonsCount ?? 0),
    [currentCourse],
  );

  // ── Мои курсы: все записи, убывающий прогресс ────────────────
  const myCourseRows = useMemo(() =>
    enrollments
      .map(e => ({ enrollment: e, course: courses.find(c => c.id === e.courseId) }))
      .filter((x): x is { enrollment: Enrollment; course: Course } => x.course != null)
      .sort((a, b) => b.enrollment.progress - a.enrollment.progress)
      .slice(0, 5),
    [enrollments, courses],
  );

  // ── Лента активности ─────────────────────────────────────────
  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Пройденные шаги онбординга (имеют точные временные метки)
    for (const asgn of myAssignments) {
      for (const fb of asgn.feedbacks) {
        const step = asgn.steps.find(s => s.id === fb.stepId);
        items.push({
          id:    `fb-${asgn.id}-${fb.stepId}`,
          type:  'onboarding',
          title: step?.title ?? 'Шаг онбординга',
          sub:   asgn.templateTitle,
          time:  fb.submittedAt,
        });
      }
    }

    // Завершённые курсы
    for (const e of completedEnrollments) {
      const course = courses.find(c => c.id === e.courseId);
      if (!course || !e.enrolledAt) continue;
      items.push({
        id:    `done-${e.courseId}`,
        type:  'completed',
        title: course.title,
        sub:   'Курс завершён ✓',
        time:  e.enrolledAt,
      });
    }

    // Записи на курсы (in_progress / pending)
    for (const e of inProgressEnrollments) {
      const course = courses.find(c => c.id === e.courseId);
      if (!course || !e.enrolledAt) continue;
      items.push({
        id:    `enr-${e.courseId}`,
        type:  'enrolled',
        title: course.title,
        sub:   'Запись на курс',
        time:  e.enrolledAt,
      });
    }

    return items
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  }, [myAssignments, completedEnrollments, inProgressEnrollments, courses]);

  const dotClass = (type: ActivityType) =>
    type === 'completed'  ? styles.actDotDone
    : type === 'onboarding' ? styles.actDotOnboarding
    : styles.actDotEnrolled;

  const statusLabel = (e: Enrollment) =>
    e.status === 'completed'        ? '✓ Завершён'
    : e.status === 'in_progress'    ? 'В процессе'
    : e.status === 'pending_approval' ? 'Ожидает одобрения'
    : 'Ожидает';

  return (
    <div className={styles.page}>

      {/* Заголовок */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Добро пожаловать, {displayName(user)}</h1>
          <p className={styles.subtitle}>
            {inProgressEnrollments.length > 0
              ? 'Продолжайте обучение с того места, где остановились'
              : 'Начните обучение — выберите курс из каталога'}
          </p>
        </div>
      </div>

      {/* Текущий курс / плейсхолдер */}
      {currentCourse && currentEnrollment ? (
        <div className={styles.courseCard}>
          <div className={styles.courseCardBody}>
            <p className={styles.courseLabel}>Продолжить обучение</p>
            <h2 className={styles.courseTitle}>{currentCourse.title}</h2>
            {nextStep ? (
              <p className={styles.courseBreadcrumb}>
                {nextStep.mod.title} &middot; {nextStep.step.title}
              </p>
            ) : (
              <p className={styles.courseBreadcrumb}>Все шаги пройдены 🎉</p>
            )}
            <div className={styles.courseActions}>
              <Link to={`/courses/${currentCourse.id}`} className={styles.continueBtn}>
                <Play size={14} /> Продолжить
              </Link>
              {currentEnrollment.enrolledAt && (
                <span className={styles.lastAccessed}>
                  <Clock size={13} />
                  Начат {new Date(currentEnrollment.enrolledAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          </div>
          <div className={styles.courseCardProgress}>
            <div className={styles.progressNum}>{currentEnrollment.progress}%</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${currentEnrollment.progress}%` }} />
            </div>
            <p className={styles.progressLabel}>
              {currentEnrollment.completedItems.length} из {currentTotalItems} уроков
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.noCourseCard}>
          <GraduationCap size={28} className={styles.noCourseIcon} />
          <div>
            <p className={styles.noCourseTitle}>Нет активных курсов</p>
            <p className={styles.noCourseText}>Запишитесь на курс, чтобы начать обучение</p>
          </div>
          <Link to="/courses" className={styles.continueBtn}>
            Перейти к курсам <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Статистика */}
      <div className={styles.stats}>
        {[
          { label: 'Курсов пройдено',  value: completedEnrollments.length,  icon: CheckCircle2 },
          { label: 'В процессе',       value: inProgressEnrollments.length, icon: BookOpen     },
          { label: 'Часов обучения',   value: hoursLearned,                  icon: Clock        },
          { label: 'Сертификатов',     value: certificates.length,           icon: Award        },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={styles.statItem}>
              <Icon size={16} className={styles.statIcon} />
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Нижняя сетка */}
      <div className={styles.grid}>

        {/* Мои курсы */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Мои курсы</h3>
            <Link to="/courses" className={styles.panelLink}>
              Все курсы <ArrowRight size={13} />
            </Link>
          </div>
          {myCourseRows.length === 0 ? (
            <p className={styles.panelEmpty}>Нет записей на курсы</p>
          ) : (
            myCourseRows.map(({ enrollment, course }) => (
              <Link key={course.id} to={`/courses/${course.id}`} className={styles.courseRow}>
                <div className={styles.courseRowInfo}>
                  <span className={styles.courseRowTitle}>{course.title}</span>
                  <span className={styles.courseRowMeta}>{statusLabel(enrollment)}</span>
                </div>
                <div className={styles.courseRowRight}>
                  <div className={styles.miniBar}>
                    <div
                      className={`${styles.miniFill} ${enrollment.status === 'completed' ? styles.miniFillDone : ''}`}
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                  <span className={styles.miniPct}>{enrollment.progress}%</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Активность */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Активность</h3>
          </div>
          {activity.length === 0 ? (
            <p className={styles.panelEmpty}>Нет записей об активности</p>
          ) : (
            activity.map(item => (
              <div key={item.id} className={styles.actRow}>
                <div className={`${styles.actDot} ${dotClass(item.type)}`} />
                <div className={styles.actInfo}>
                  <span className={styles.actTitle}>{item.title}</span>
                  <span className={styles.actCourse}>{item.sub}</span>
                </div>
                <span className={styles.actTime}>
                  <Calendar size={11} />
                  {timeAgo(item.time)}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
