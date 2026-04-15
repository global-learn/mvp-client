import { Link } from 'react-router-dom';
import {
  Play, Clock, BookOpen, CheckCircle2,
  TrendingUp, Award, Calendar, ArrowRight,
} from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import styles from './Dashboard.module.css';

// Данные захардкожены пока нет API.
// Когда появится бэкенд — заменяешь на useCourses() и реальные запросы.

const currentCourse = {
  id: '1',
  title: 'React и TypeScript для начинающих',
  currentModule: 'Модуль 3: Хуки React',
  currentLesson: 'Урок 2: useState и useEffect',
  progress: 45,
  totalLessons: 24,
  completedLessons: 11,
  lastAccessed: '2 часа назад',
};

const stats = [
  { label: 'Курсов пройдено', value: 3, icon: CheckCircle2, color: 'green' },
  { label: 'В процессе', value: 2, icon: BookOpen, color: 'blue' },
  { label: 'Часов обучения', value: 48, icon: Clock, color: 'orange' },
  { label: 'Сертификатов', value: 2, icon: Award, color: 'purple' },
] as const;

const myCourses = [
  { id: '1', title: 'React и TypeScript для начинающих', progress: 45, lessons: 24 },
  { id: '2', title: 'Node.js: серверная разработка', progress: 20, lessons: 18 },
];

const recentActivity = [
  { id: '1', type: 'lesson', title: 'useState и useEffect', course: 'React и TypeScript', time: '2 часа назад' },
  { id: '2', type: 'test', title: 'Тест: Основы React', course: 'React и TypeScript', time: 'Вчера' },
  { id: '3', type: 'lesson', title: 'Введение в Express', course: 'Node.js', time: '2 дня назад' },
  { id: '4', type: 'lesson', title: 'Работа с базой данных', course: 'Node.js', time: '3 дня назад' },
];

const weeklyGoal = { target: 10, current: 6 };

export function DashboardPage() {
  const { user } = useUser();

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Добро пожаловать, {user.name}!</h1>
          <p className={styles.subtitle}>Продолжайте обучение с того места, где остановились</p>
        </div>
        <div className={styles.weeklyGoal}>
          <div className={styles.goalHeader}>
            <TrendingUp size={16} />
            <span>Цель недели</span>
          </div>
          <div className={styles.goalProgress}>
            <div className={styles.goalBar}>
              <div
                className={styles.goalFill}
                style={{ width: `${(weeklyGoal.current / weeklyGoal.target) * 100}%` }}
              />
            </div>
            <span className={styles.goalText}>{weeklyGoal.current}/{weeklyGoal.target} ч</span>
          </div>
        </div>
      </header>

      <section className={styles.currentCourse}>
        <div className={styles.courseCard}>
          <span className={styles.courseLabel}>Продолжить обучение</span>
          <h2 className={styles.courseTitle}>{currentCourse.title}</h2>
          <p className={styles.courseModule}>{currentCourse.currentModule}</p>
          <p className={styles.courseLesson}>{currentCourse.currentLesson}</p>

          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span>Прогресс курса</span>
              <span className={styles.progressPercent}>{currentCourse.progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${currentCourse.progress}%` }} />
            </div>
            <p className={styles.progressText}>
              {currentCourse.completedLessons} из {currentCourse.totalLessons} уроков пройдено
            </p>
          </div>

          <div className={styles.courseActions}>
            <Link to={`/courses/${currentCourse.id}`} className={styles.continueBtn}>
              <Play size={18} />
              Продолжить
            </Link>
            <span className={styles.lastAccessed}>
              <Clock size={14} />
              {currentCourse.lastAccessed}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Ваша статистика</h3>
        <div className={styles.statsGrid}>
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`${styles.statCard} ${styles[stat.color]}`}>
                <Icon size={22} className={styles.statIcon} />
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className={styles.bottomGrid}>
        <section className={styles.coursesSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Мои курсы</h3>
            <Link to="/courses" className={styles.viewAll}>
              Все курсы <ArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.coursesList}>
            {myCourses.map(course => (
              <Link key={course.id} to={`/courses/${course.id}`} className={styles.courseItem}>
                <div className={styles.courseItemInfo}>
                  <span className={styles.courseItemTitle}>{course.title}</span>
                  <span className={styles.courseItemMeta}>{course.lessons} уроков</span>
                </div>
                <div className={styles.courseItemProgress}>
                  <div className={styles.miniProgressBar}>
                    <div className={styles.miniProgressFill} style={{ width: `${course.progress}%` }} />
                  </div>
                  <span className={styles.courseItemPercent}>{course.progress}%</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Недавняя активность</h3>
          </div>
          <div className={styles.activityList}>
            {recentActivity.map(item => (
              <div key={item.id} className={styles.activityItem}>
                <div className={`${styles.activityIcon} ${item.type === 'test' ? styles.testIcon : ''}`}>
                  {item.type === 'lesson' ? <BookOpen size={14} /> : <CheckCircle2 size={14} />}
                </div>
                <div className={styles.activityInfo}>
                  <span className={styles.activityTitle}>{item.title}</span>
                  <span className={styles.activityCourse}>{item.course}</span>
                </div>
                <span className={styles.activityTime}>
                  <Calendar size={12} />
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
