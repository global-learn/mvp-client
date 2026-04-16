import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import { EnrollButton } from '@features/enroll-course/ui/EnrollButton';
import { AssignCourseButton } from '@features/assign-course/ui/AssignCourseButton';
import styles from './CourseDetail.module.css';

// Page "Детальная страница курса" — /courses/:id
// useParams — хук React Router, достаёт параметры из URL.
// Для /courses/42 → { id: '42' }

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { courses, getEnrollment, isLoading, completeLesson } = useCourses();

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  const course = courses.find(c => c.id === id);

  if (!course) {
    return (
      <div className={styles.notFound}>
        <p className={styles.notFoundText}>Курс не найден</p>
        <Link to="/courses" className={styles.backLink}>← Все курсы</Link>
      </div>
    );
  }

  const enrollment = getEnrollment(course.id);
  const isEnrolled = enrollment !== undefined;
  const completedCount = enrollment?.completedLessonCount ?? 0;
  const isCompleted = enrollment?.status === 'completed';

  // Генерируем список уроков из lessonsCount (пока нет реального контента)
  const lessons = Array.from({ length: course.lessonsCount }, (_, i) => ({
    id: `lesson-${course.id}-${i}`,
    index: i,
    title: `Урок ${i + 1}`,
  }));

  const handleCompleteLesson = () => {
    void completeLesson(course.id, course.lessonsCount);
  };

  return (
    <div className={styles.page}>
      <Link to="/courses" className={styles.backLink}>← Все курсы</Link>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{course.title}</h1>
        <AssignCourseButton courseId={course.id} courseTitle={course.title} />
      </div>
      <p className={styles.meta}>{course.lessonsCount} уроков · Добавлен {course.createdAt}</p>

      <div className={styles.descriptionCard}>
        <h2 className={styles.descriptionTitle}>О курсе</h2>
        <p className={styles.descriptionText}>{course.description}</p>
      </div>

      {isEnrolled && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>
              Прогресс: {completedCount} / {course.lessonsCount} уроков
            </span>
            <span className={styles.progressValue}>{enrollment.progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <EnrollButton courseId={course.id} />
        {isEnrolled && !isCompleted && (
          <button className={styles.lessonBtn} onClick={handleCompleteLesson}>
            Отметить урок пройденным
          </button>
        )}
      </div>

      {/* Список уроков — доступен после записи на курс */}
      {isEnrolled && (
        <div className={styles.lessonsSection}>
          <h2 className={styles.lessonsTitle}>Содержание курса</h2>
          <ul className={styles.lessonList}>
            {lessons.map(lesson => {
              const done = lesson.index < completedCount;
              const isCurrent = lesson.index === completedCount && !isCompleted;
              return (
                <li
                  key={lesson.id}
                  className={`${styles.lessonItem} ${done ? styles.lessonDone : ''} ${isCurrent ? styles.lessonCurrent : ''}`}
                >
                  <span className={styles.lessonIcon}>
                    {done ? (
                      <CheckCircle2 size={18} className={styles.iconDone} />
                    ) : (
                      <Circle size={18} className={isCurrent ? styles.iconCurrent : styles.iconPending} />
                    )}
                  </span>
                  <span className={styles.lessonTitle}>{lesson.title}</span>
                  {isCurrent && (
                    <button
                      className={styles.completeBtn}
                      onClick={handleCompleteLesson}
                    >
                      Завершить
                    </button>
                  )}
                  {done && <span className={styles.lessonDoneLabel}>Пройдено</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isCompleted && (
        <div className={styles.completedBanner}>
          <CheckCircle2 size={22} />
          Курс пройден! Отличная работа.
        </div>
      )}
    </div>
  );
}
