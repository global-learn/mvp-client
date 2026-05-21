import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2, Lock, Clock, Play, XCircle, BookOpen, RotateCcw, Users, Building2, Award,
} from 'lucide-react';
import { useLearningPaths } from '@entities/learning-path/model/LearningPathContext';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import type { LearningPath, LearningPathStepWithStatus } from '@entities/learning-path/model/types';
import type { Enrollment } from '@entities/course/model/types';
import { computeStepStatuses, calcPathProgress, PATH_TARGET_LABELS } from '@entities/learning-path/model/types';
import { TrackCompletionModal } from '@features/track-completion/ui/TrackCompletionModal';
import { TrackCertificateModal } from '@features/track-completion/ui/TrackCertificateModal';
import styles from './LearningPathDetail.module.css';

// ── Метка статуса ────────────────────────────────────────────────
function StatusBadge({ status }: { status: LearningPathStepWithStatus['status'] }) {
  const map: Record<LearningPathStepWithStatus['status'], { cls: string; icon: React.ReactNode; label: string }> = {
    completed:       { cls: styles.statusDone,     icon: <CheckCircle2 size={11} />, label: 'Пройдено' },
    in_progress:     { cls: styles.statusActive,   icon: <Play size={11} />,         label: 'В процессе' },
    pending_approval:{ cls: styles.statusPending,  icon: <Clock size={11} />,        label: 'На рассмотрении' },
    rejected:        { cls: styles.statusRejected, icon: <XCircle size={11} />,      label: 'Отклонено' },
    locked:          { cls: styles.statusLocked,   icon: <Lock size={11} />,         label: 'Заблокировано' },
    not_enrolled:    { cls: styles.statusUnlocked, icon: <BookOpen size={11} />,     label: 'Доступно' },
  };
  const { cls, icon, label } = map[status];
  return <span className={`${styles.statusBadge} ${cls}`}>{icon} {label}</span>;
}

// ── Индикатор шага (цифра / иконка) ─────────────────────────────
function StepIndicator({ step, order }: { step: LearningPathStepWithStatus; order: number }) {
  const clsMap: Record<LearningPathStepWithStatus['status'], string> = {
    completed:        styles.stepIndicatorDone,
    in_progress:      styles.stepIndicatorActive,
    pending_approval: styles.stepIndicatorPending,
    rejected:         styles.stepIndicatorRejected,
    locked:           styles.stepIndicatorLocked,
    not_enrolled:     '',
  };
  return (
    <div className={`${styles.stepIndicator} ${clsMap[step.status]}`}>
      {step.status === 'completed'   ? <CheckCircle2 size={20} /> :
       step.status === 'locked'      ? <Lock size={16} /> :
       order}
    </div>
  );
}

// ── Строка действия шага ─────────────────────────────────────────
function StepAction({
  step,
  pending,
  onRequest,
}: {
  step: LearningPathStepWithStatus;
  pending: boolean;
  onRequest: () => Promise<void>;
}) {
  switch (step.status) {
    case 'not_enrolled':
      return (
        <button className={styles.requestBtn} onClick={() => void onRequest()} disabled={pending}>
          <Clock size={14} />
          {pending ? 'Отправляем...' : 'Подать заявку на прохождение'}
        </button>
      );

    case 'pending_approval':
      return (
        <div className={styles.pendingInfo}>
          <Clock size={14} />
          Заявка ожидает одобрения руководителем
        </div>
      );

    case 'rejected':
      return (
        <button className={styles.reRequestBtn} onClick={() => void onRequest()} disabled={pending}>
          <RotateCcw size={14} />
          {pending ? 'Отправляем...' : 'Подать заявку повторно'}
        </button>
      );

    case 'in_progress':
      return (
        <Link to={`/courses/${step.courseId}`} className={styles.continueBtn}>
          <Play size={14} />
          Продолжить курс
        </Link>
      );

    case 'completed':
      return (
        <Link to={`/courses/${step.courseId}`} className={styles.continueBtn} style={{ background: '#16a34a' }}>
          <CheckCircle2 size={14} />
          Повторить материал
        </Link>
      );

    case 'locked':
      return (
        <div className={styles.lockedInfo}>
          <Lock size={13} />
          Завершите предыдущий курс, чтобы разблокировать
        </div>
      );

    default:
      return null;
  }
}

// ── Шаг с правильным "N из M" ─────────────────────────────────────
function PathStepFull({
  step,
  order,
  total,
}: {
  step: LearningPathStepWithStatus;
  order: number;
  total: number;
}) {
  const { requestEnrollment } = useCourses();
  const [pending, setPending] = useState(false);

  const isActive = step.status === 'in_progress' || step.status === 'not_enrolled' || step.status === 'rejected';
  const isDone   = step.status === 'completed';
  const isLocked = step.status === 'locked';

  const handleRequest = async () => {
    setPending(true);
    await requestEnrollment(step.courseId);
    setPending(false);
  };

  const cardCls = [
    styles.stepCard,
    isActive ? styles.stepCardActive : '',
    isDone   ? styles.stepCardDone   : '',
    isLocked ? styles.stepCardLocked : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.step}>
      <StepIndicator step={step} order={order} />

      <div className={cardCls}>
        <div className={styles.stepCardBody}>
          <div className={styles.stepCardTop}>
            <h3 className={`${styles.stepCardTitle} ${isDone ? styles.stepCardTitleDone : ''}`}>
              {step.courseTitle}
            </h3>
            <StatusBadge status={step.status} />
          </div>
          <p className={styles.stepCardDesc}>{step.courseDescription}</p>
        </div>

        <div className={styles.stepCardFooter}>
          <span className={styles.stepCardFooterNote}>
            <BookOpen size={13} />
            Шаг {order} из {total}
          </span>
          <StepAction step={step} pending={pending} onRequest={handleRequest} />
        </div>
      </div>
    </div>
  );
}

// ── Контент страницы (все хуки здесь — path гарантированно есть) ─
function LearningPathDetailContent({
  path,
  enrollments,
}: {
  path: LearningPath;
  enrollments: Enrollment[];
}) {
  const { trackCertificates, issueTrackCertificate } = useLearningPaths();
  const { user } = useUser();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const steps = computeStepStatuses(path, enrollments);
  const progress = calcPathProgress(steps);
  const isDone = progress === 100;

  useEffect(() => {
    if (!isDone) return;
    issueTrackCertificate(path);
    const key = `track-modal-shown-${path.id}-${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowCompletionModal(true);
      localStorage.setItem(key, '1');
    }
  // issueTrackCertificate is stable per render cycle; path.id and user.id are primitives
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, path.id, user.id]);

  const trackCert = trackCertificates.find(c => c.pathId === path.id && c.userId === user.id);
  const targetLabel = PATH_TARGET_LABELS[path.targetType];
  const targetSub = path.targetDepartmentName ?? path.targetDivisionName ?? null;

  return (
    <div className={styles.page}>
      <Link to="/learning-paths" className={styles.backLink}>← Все треки</Link>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{path.title}</h1>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.targetBadge}>
            {path.targetType === 'department' ? <Building2 size={11} /> : <Users size={11} />}
            {targetLabel}{targetSub ? ` · ${targetSub}` : ''}
          </span>
          <span className={styles.metaDot} />
          <span className={styles.metaText}>{steps.length} курсов</span>
          <span className={styles.metaDot} />
          <span className={styles.metaText}>Автор: {path.createdByName}</span>
        </div>

        <p className={styles.desc}>{path.description}</p>
      </div>

      {/* Overall progress */}
      {isDone ? (
        <div className={styles.completedBanner}>
          <CheckCircle2 size={20} />
          Трек полностью завершён! Отличная работа 🎉
          {trackCert && (
            <button className={styles.openDiplomaBtn} onClick={() => setShowCertModal(true)}>
              <Award size={14} />
              Открыть диплом
            </button>
          )}
        </div>
      ) : (
        <div className={styles.overallProgress}>
          <span className={styles.overallProgressLabel}>Прогресс</span>
          <div className={styles.overallProgressBar}>
            <div
              className={`${styles.overallProgressFill} ${isDone ? styles.overallProgressFillDone : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.overallProgressPct}>{progress}%</span>
        </div>
      )}

      {/* Timeline */}
      <div className={styles.timeline}>
        {steps.map((step, i) => (
          <PathStepFull key={step.id} step={step} order={i + 1} total={steps.length} />
        ))}
      </div>

      {/* Completion celebration modal (shown once per user per track) */}
      {showCompletionModal && trackCert && (
        <TrackCompletionModal
          pathTitle={path.title}
          stepCount={path.steps.length}
          certificate={trackCert}
          onClose={() => setShowCompletionModal(false)}
        />
      )}

      {/* Diploma modal (opened manually via banner button) */}
      {showCertModal && trackCert && (
        <TrackCertificateModal
          certificate={trackCert}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
}

// ── Главная страница (routing + guard) ──────────────────────────
export function LearningPathDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { paths, isLoading } = useLearningPaths();
  const { enrollments } = useCourses();

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;

  const path = paths.find(p => p.id === id);
  if (!path) {
    return (
      <div className={styles.notFound}>
        <p>Трек не найден</p>
        <Link to="/learning-paths" className={styles.backLink}>← Все треки</Link>
      </div>
    );
  }

  return <LearningPathDetailContent path={path} enrollments={enrollments} />;
}
