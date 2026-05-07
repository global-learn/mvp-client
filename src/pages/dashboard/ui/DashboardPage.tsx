import { Link } from 'react-router-dom';
import {
  Play, Clock, BookOpen, CheckCircle2,
  Award, ArrowRight, Calendar,
} from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { displayName } from '@entities/user/model/types';
import styles from './Dashboard.module.css';

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
  { label: 'Курсов пройдено', value: 3,  icon: CheckCircle2 },
  { label: 'В процессе',      value: 2,  icon: BookOpen     },
  { label: 'Часов обучения',  value: 48, icon: Clock        },
  { label: 'Сертификатов',    value: 2,  icon: Award        },
] as const;

const myCourses = [
  { id: '1', title: 'React и TypeScript для начинающих', progress: 45, lessons: 24 },
  { id: '2', title: 'Node.js: серверная разработка',      progress: 20, lessons: 18 },
];

const recentActivity = [
  { id: '1', type: 'lesson', title: 'useState и useEffect',  course: 'React и TypeScript', time: '2 ч. назад'  },
  { id: '2', type: 'test',   title: 'Тест: Основы React',    course: 'React и TypeScript', time: 'Вчера'       },
  { id: '3', type: 'lesson', title: 'Введение в Express',    course: 'Node.js',            time: '2 дня назад' },
  { id: '4', type: 'lesson', title: 'Работа с базой данных', course: 'Node.js',            time: '3 дня назад' },
];

export function DashboardPage() {
  const { user } = useUser();

  return (
    <div className={styles.page}>

      {/* Заголовок */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Добро пожаловать, {displayName(user)}</h1>
          <p className={styles.subtitle}>Продолжайте обучение с того места, где остановились</p>
        </div>
      </div>

      {/* Текущий курс */}
      <div className={styles.courseCard}>
        <div className={styles.courseCardBody}>
          <p className={styles.courseLabel}>Продолжить обучение</p>
          <h2 className={styles.courseTitle}>{currentCourse.title}</h2>
          <p className={styles.courseBreadcrumb}>
            {currentCourse.currentModule} &middot; {currentCourse.currentLesson}
          </p>
          <div className={styles.courseActions}>
            <Link to={`/courses/${currentCourse.id}`} className={styles.continueBtn}>
              <Play size={14} />
              Продолжить
            </Link>
            <span className={styles.lastAccessed}>
              <Clock size={13} />
              {currentCourse.lastAccessed}
            </span>
          </div>
        </div>
        <div className={styles.courseCardProgress}>
          <div className={styles.progressNum}>{currentCourse.progress}%</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${currentCourse.progress}%` }} />
          </div>
          <p className={styles.progressLabel}>
            {currentCourse.completedLessons} из {currentCourse.totalLessons} уроков
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className={styles.stats}>
        {stats.map(s => {
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
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Мои курсы</h3>
            <Link to="/courses" className={styles.panelLink}>
              Все курсы <ArrowRight size={13} />
            </Link>
          </div>
          {myCourses.map(c => (
            <Link key={c.id} to={`/courses/${c.id}`} className={styles.courseRow}>
              <div className={styles.courseRowInfo}>
                <span className={styles.courseRowTitle}>{c.title}</span>
                <span className={styles.courseRowMeta}>{c.lessons} уроков</span>
              </div>
              <div className={styles.courseRowRight}>
                <div className={styles.miniBar}>
                  <div className={styles.miniFill} style={{ width: `${c.progress}%` }} />
                </div>
                <span className={styles.miniPct}>{c.progress}%</span>
              </div>
            </Link>
          ))}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Активность</h3>
          </div>
          {recentActivity.map(item => (
            <div key={item.id} className={styles.actRow}>
              <div className={`${styles.actDot} ${item.type === 'test' ? styles.actDotTest : ''}`} />
              <div className={styles.actInfo}>
                <span className={styles.actTitle}>{item.title}</span>
                <span className={styles.actCourse}>{item.course}</span>
              </div>
              <span className={styles.actTime}>
                <Calendar size={11} />
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
