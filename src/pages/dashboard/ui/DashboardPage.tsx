import { Link } from 'react-router-dom';
import {
  Play, Clock, BookOpen, CheckCircle2,
  TrendingUp, Award, ArrowRight,
} from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { displayName } from '@entities/user/model/types';
import { useCourses } from '@entities/course/model/CoursesContext';
import styles from './Dashboard.module.css';

export function DashboardPage() {
  const { user } = useUser();
  const { courses, enrollments, isLoading } = useCourses();

  // Записи текущего пользователя
  const myEnrollments = enrollments.filter(e => e.userId === user.id);

  // Курсы в процессе и завершённые
  const inProgress  = myEnrollments.filter(e => e.status === 'in_progress');
  const completed   = myEnrollments.filter(e => e.status === 'completed');

  // Текущий курс — in_progress с наибольшим прогрессом
  const currentEnrollment = [...inProgress].sort((a, b) => b.progress - a.progress)[0];
  const currentCourse = currentEnrollment
    ? courses.find(c => c.id === currentEnrollment.courseId)
    : null;

  // Курсы для секции "Мои курсы" (до 3)
  const myCourses = inProgress
    .slice(0, 3)
    .map(e => ({ course: courses.find(c => c.id === e.courseId), enrollment: e }))
    .filter((x): x is { course: NonNullable<typeof x.course>; enrollment: typeof x.enrollment } =>
      x.course !== undefined,
    );

  const weeklyHours = Math.round(completed.length * 1.5 + inProgress.length * 0.5);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Добро пожаловать, {displayName(user)}!</h1>
          <p className={styles.subtitle}>
            {isLoading
              ? 'Загрузка...'
              : currentCourse
              ? 'Продолжайте обучение с того места, где остановились'
              : 'Выберите курс и начните обучение'}
          </p>
        </div>
        <div className={styles.weeklyGoal}>
          <div className={styles.goalHeader}>
            <TrendingUp size={16} />
            <span>Часов на неделе</span>
          </div>
          <div className={styles.goalProgress}>
            <div className={styles.goalBar}>
              <div
                className={styles.goalFill}
                style={{ width: `${Math.min((weeklyHours / 10) * 100, 100)}%` }}
              />
            </div>
            <span className={styles.goalText}>{weeklyHours}/10 ч</span>
          </div>
        </div>
      </header>

      {/* Продолжить обучение */}
      {!isLoading && currentCourse && currentEnrollment && (
        <section className={styles.currentCourse}>
          <div className={styles.courseCard}>
            <span className={styles.courseLabel}>Продолжить обучение</span>
            <h2 className={styles.courseTitle}>{currentCourse.title}</h2>
            <p className={styles.courseLesson}>
              {currentEnrollment.completedLessonCount} из {currentCourse.lessonsCount} уроков пройдено
            </p>

            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span>Прогресс курса</span>
                <span className={styles.progressPercent}>{currentEnrollment.progress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${currentEnrollment.progress}%` }} />
              </div>
            </div>

            <div className={styles.courseActions}>
              <Link to={`/courses/${currentCourse.id}`} className={styles.continueBtn}>
                <Play size={18} />
                Продолжить
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Нет активных курсов */}
      {!isLoading && !currentCourse && (
        <section className={styles.currentCourse}>
          <div className={`${styles.courseCard} ${styles.emptyCourseCard}`}>
            <span className={styles.courseLabel}>Начните обучение</span>
            <h2 className={styles.courseTitle}>Вы ещё не записаны ни на один курс</h2>
            <p className={styles.courseLesson}>Перейдите в каталог и выберите подходящий курс</p>
            <div className={styles.courseActions}>
              <Link to="/courses" className={styles.continueBtn}>
                <BookOpen size={18} />
                Каталог курсов
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Статистика */}
      <section className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Ваша статистика</h3>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.green}`}>
            <CheckCircle2 size={22} className={styles.statIcon} />
            <span className={styles.statValue}>{completed.length}</span>
            <span className={styles.statLabel}>Курсов пройдено</span>
          </div>
          <div className={`${styles.statCard} ${styles.blue}`}>
            <BookOpen size={22} className={styles.statIcon} />
            <span className={styles.statValue}>{inProgress.length}</span>
            <span className={styles.statLabel}>В процессе</span>
          </div>
          <div className={`${styles.statCard} ${styles.orange}`}>
            <Clock size={22} className={styles.statIcon} />
            <span className={styles.statValue}>{weeklyHours}</span>
            <span className={styles.statLabel}>Часов обучения</span>
          </div>
          <div className={`${styles.statCard} ${styles.purple}`}>
            <Award size={22} className={styles.statIcon} />
            <span className={styles.statValue}>{completed.length}</span>
            <span className={styles.statLabel}>Сертификатов</span>
          </div>
        </div>
      </section>

      <div className={styles.bottomGrid}>
        {/* Мои курсы */}
        <section className={styles.coursesSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Мои курсы</h3>
            <Link to="/courses" className={styles.viewAll}>
              Все курсы <ArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.coursesList}>
            {myCourses.length === 0 ? (
              <p className={styles.noCoursesNote}>
                Нет активных курсов.{' '}
                <Link to="/courses" className={styles.inlineLink}>Перейти в каталог</Link>
              </p>
            ) : (
              myCourses.map(({ course, enrollment }) => (
                <Link key={course.id} to={`/courses/${course.id}`} className={styles.courseItem}>
                  <div className={styles.courseItemInfo}>
                    <span className={styles.courseItemTitle}>{course.title}</span>
                    <span className={styles.courseItemMeta}>{course.lessonsCount} уроков</span>
                  </div>
                  <div className={styles.courseItemProgress}>
                    <div className={styles.miniProgressBar}>
                      <div className={styles.miniProgressFill} style={{ width: `${enrollment.progress}%` }} />
                    </div>
                    <span className={styles.courseItemPercent}>{enrollment.progress}%</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Завершённые курсы */}
        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Завершённые курсы</h3>
          </div>
          <div className={styles.activityList}>
            {completed.length === 0 ? (
              <p className={styles.noCoursesNote}>Пока нет пройденных курсов</p>
            ) : (
              completed.map(e => {
                const course = courses.find(c => c.id === e.courseId);
                if (!course) return null;
                return (
                  <Link key={e.courseId} to={`/courses/${e.courseId}`} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      <CheckCircle2 size={14} />
                    </div>
                    <div className={styles.activityInfo}>
                      <span className={styles.activityTitle}>{course.title}</span>
                      <span className={styles.activityCourse}>{course.lessonsCount} уроков</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
