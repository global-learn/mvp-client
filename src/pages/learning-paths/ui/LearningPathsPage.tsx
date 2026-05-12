import { Link } from 'react-router-dom';
import { BookMarked, Settings, CheckCircle2, Lock, Circle } from 'lucide-react';
import { useLearningPaths } from '@entities/learning-path/model/LearningPathContext';
import { useCourses } from '@entities/course/model/CoursesContext';
import type { LearningPath, LearningPathStepWithStatus } from '@entities/learning-path/model/types';
import { computeStepStatuses, calcPathProgress, PATH_TARGET_LABELS } from '@entities/learning-path/model/types';
import styles from './LearningPaths.module.css';

function StepDotIcon({ status }: { status: LearningPathStepWithStatus['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={13} />;
    case 'locked':
      return <Lock size={11} />;
    default:
      return <Circle size={11} />;
  }
}

function PathCard({ path }: { path: LearningPath }) {
  const { enrollments } = useCourses();
  const steps = computeStepStatuses(path, enrollments);
  const progress = calcPathProgress(steps);
  const isDone = progress === 100;
  const activeIdx = steps.findIndex(s => s.status !== 'completed' && s.status !== 'locked');

  return (
    <Link to={`/learning-paths/${path.id}`} className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>{path.title}</span>
          <span className={styles.stepCount}>{steps.length} курс{steps.length === 1 ? '' : steps.length < 5 ? 'а' : 'ов'}</span>
        </div>

        <p className={styles.cardDesc}>{path.description}</p>

        <span className={styles.targetBadge}>
          {PATH_TARGET_LABELS[path.targetType]}
          {path.targetDepartmentName && ` · ${path.targetDepartmentName}`}
          {path.targetDivisionName && ` · ${path.targetDivisionName}`}
        </span>

        {/* Step dots */}
        <div className={styles.stepsPreview}>
          {steps.map((step, i) => {
            const dotClass = [
              styles.stepDot,
              step.status === 'completed' ? styles.stepDotDone : '',
              (step.status === 'in_progress' || step.status === 'pending_approval') && i === activeIdx
                ? styles.stepDotActive : '',
              step.status === 'locked' ? styles.stepDotLocked : '',
            ].filter(Boolean).join(' ');

            return (
              <>
                {i > 0 && (
                  <div
                    key={`conn-${step.id}`}
                    className={`${styles.stepConnector} ${steps[i - 1].status === 'completed' ? styles.stepConnectorDone : ''}`}
                  />
                )}
                <div key={step.id} className={dotClass}>
                  <StepDotIcon status={step.status} />
                </div>
              </>
            );
          })}
        </div>
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${isDone ? styles.progressFillDone : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressLabel}>{progress}%</span>
        <span className={styles.createdBy}>{path.createdByName}</span>
      </div>
    </Link>
  );
}

export function LearningPathsPage() {
  const { visiblePaths, canCreate, isLoading } = useLearningPaths();

  if (isLoading) return <div className={styles.empty}>Загрузка...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Learning Paths</h1>
          <p className={styles.subtitle}>Последовательные треки обучения — каждый следующий курс открывается после завершения предыдущего.</p>
        </div>
        {canCreate && (
          <Link to="/learning-paths/manage" className={styles.manageBtn}>
            <Settings size={15} />
            Управление треками
          </Link>
        )}
      </div>

      {visiblePaths.length === 0 ? (
        <div className={styles.empty}>
          <BookMarked size={40} style={{ opacity: 0.25, display: 'block', margin: '0 auto 0.75rem' }} />
          <p>Нет доступных треков обучения</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visiblePaths.map(path => (
            <PathCard key={path.id} path={path} />
          ))}
        </div>
      )}
    </div>
  );
}
