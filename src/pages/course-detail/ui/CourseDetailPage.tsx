import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, Lock } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import type { Course } from '@entities/course/model/types';
import { EnrollButton } from '@features/enroll-course/ui/EnrollButton';
import { AssignCourseButton } from '@features/assign-course/ui/AssignCourseButton';
import styles from './CourseDetail.module.css';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses, getEnrollment, isLoading, getCourseWithModules } = useCourses();

  const [fullCourse, setFullCourse] = useState<Course | null>(null);
  const [modulesLoading, setModulesLoading] = useState(false);

  const course = courses.find(c => c.id === id);
  const enrollment = course ? getEnrollment(course.id) : undefined;
  const isEnrolled = enrollment !== undefined;
  const completedStepIds = enrollment?.completedStepIds ?? [];

  useEffect(() => {
    if (!id) return;
    setModulesLoading(true);
    getCourseWithModules(id)
      .then(c => setFullCourse(c ?? null))
      .finally(() => setModulesLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;

  if (!course) {
    return (
      <div className={styles.notFound}>
        <p className={styles.notFoundText}>Курс не найден</p>
        <Link to="/courses" className={styles.backLink}>← Все курсы</Link>
      </div>
    );
  }

  const modules = fullCourse?.modules ?? [];
  const totalSteps = modules.reduce((s, m) => s + m.steps.length, 0) || course.lessonsCount;
  const completedCount = completedStepIds.length;

  // Находим первый непройденный шаг для кнопки "Продолжить"
  const firstIncompleteStepId = modules
    .flatMap(m => m.steps)
    .find(s => !completedStepIds.includes(s.id))?.id;

  const handleStart = () => {
    const stepParam = firstIncompleteStepId ? `?step=${firstIncompleteStepId}` : '';
    void navigate(`/courses/${course.id}/play${stepParam}`);
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
              Прогресс: {completedCount} / {totalSteps} шагов
            </span>
            <span className={styles.progressValue}>{enrollment.progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${enrollment.progress}%` }} />
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {!isEnrolled ? (
          <EnrollButton courseId={course.id} />
        ) : enrollment.status === 'completed' ? (
          <button className={styles.playBtn} onClick={handleStart}>
            <Play size={16} /> Смотреть снова
          </button>
        ) : (
          <button className={styles.playBtn} onClick={handleStart}>
            <Play size={16} /> {completedCount > 0 ? 'Продолжить' : 'Начать'}
          </button>
        )}
      </div>

      {/* Список модулей */}
      {modulesLoading ? (
        <p className={styles.modulesLoading}>Загрузка содержания...</p>
      ) : modules.length > 0 ? (
        <div className={styles.modulesSection}>
          <h2 className={styles.modulesTitle}>Содержание курса</h2>
          {modules.map((mod, mi) => {
            const modDone = mod.steps.filter(s => completedStepIds.includes(s.id)).length;
            return (
              <div key={mod.id} className={styles.moduleBlock}>
                <div className={styles.moduleHeader}>
                  <span className={styles.moduleIndex}>Модуль {mi + 1}</span>
                  <span className={styles.moduleName}>{mod.title}</span>
                  <span className={styles.moduleCount}>{modDone}/{mod.steps.length}</span>
                </div>
                <ul className={styles.stepList}>
                  {mod.steps.map((step, si) => {
                    const done = completedStepIds.includes(step.id);
                    const item = step.items[0];
                    const isTest = item?.type === 'test';
                    const locked = !isEnrolled;
                    return (
                      <li key={step.id}
                        className={`${styles.stepItem} ${done ? styles.stepDone : ''} ${locked ? styles.stepLocked : ''}`}
                        onClick={() => {
                          if (!locked) navigate(`/courses/${course.id}/play?step=${step.id}`);
                        }}
                      >
                        <span className={styles.stepNum}>{mi + 1}.{si + 1}</span>
                        <span className={styles.stepType}>{isTest ? '📝' : '📖'}</span>
                        <span className={styles.stepTitle}>{step.title}</span>
                        <span className={styles.stepStatus}>
                          {locked ? <Lock size={14} /> : done ? <CheckCircle2 size={14} className={styles.iconDone} /> : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}

      {enrollment?.status === 'completed' && (
        <div className={styles.completedBanner}>
          <CheckCircle2 size={22} /> Курс пройден! Отличная работа.
        </div>
      )}
    </div>
  );
}
