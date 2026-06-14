import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, ClipboardList, FileText, BookOpen, Send,
  MessageSquare, ExternalLink, Clock, AlertCircle, Trophy, Calendar, XCircle,
} from 'lucide-react';
import { useOnboarding } from '@entities/onboarding/model/OnboardingContext';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import type { OnboardingAssignment, OnboardingStepType } from '@entities/onboarding/model/types';
import { STEP_TYPE_LABELS, calcOnboardingProgress } from '@entities/onboarding/model/types';
import styles from './Onboarding.module.css';

// ── Иконка типа шага ─────────────────────────────────────────────
function StepIcon({ type, size = 14 }: { type: OnboardingStepType; size?: number }) {
  return type === 'course' ? <BookOpen size={size} /> : <FileText size={size} />;
}

const TYPE_CSS: Record<OnboardingStepType, string> = {
  text:   styles.typeBadgeTask,
  course: styles.typeBadgeCourse,
};

// ── Форматирование даты дедлайна ─────────────────────────────────
function fmtDue(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
function isOverdue(iso: string): boolean {
  return new Date(iso) < new Date(new Date().toDateString());
}

// ── Форматирование времени ───────────────────────────────────────
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// ── Экран завершения онбординга ───────────────────────────────────
function CompletionScreen({ assignment }: { assignment: OnboardingAssignment }) {
  const days = assignment.completedAt
    ? Math.ceil((new Date(assignment.completedAt).getTime() - new Date(assignment.startedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={styles.completionCard}>
      <div className={styles.completionIcon}>
        <Trophy size={40} strokeWidth={1.5} />
      </div>
      <h2 className={styles.completionTitle}>Онбординг завершён!</h2>
      <p className={styles.completionSub}>
        Вы успешно прошли все шаги онбординга.
        {days !== null && ` Это заняло ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}.`}
      </p>

      <div className={styles.completionStats}>
        <div className={styles.completionStat}>
          <span className={styles.completionStatNum}>{assignment.steps.length}</span>
          <span className={styles.completionStatLabel}>шагов выполнено</span>
        </div>
        <div className={styles.completionStatDiv} />
        <div className={styles.completionStat}>
          <span className={styles.completionStatNum}>{assignment.feedbacks.length}</span>
          <span className={styles.completionStatLabel}>отзывов оставлено</span>
        </div>
        {days !== null && (
          <>
            <div className={styles.completionStatDiv} />
            <div className={styles.completionStat}>
              <span className={styles.completionStatNum}>{days}</span>
              <span className={styles.completionStatLabel}>{days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</span>
            </div>
          </>
        )}
      </div>

      {/* Компактный список шагов с отзывами */}
      <div className={styles.completionSteps}>
        {[...assignment.steps].sort((a, b) => a.order - b.order).map(step => {
          const fb = assignment.feedbacks.find(f => f.stepId === step.id);
          return (
            <div key={step.id} className={styles.completionStep}>
              <CheckCircle2 size={14} className={styles.completionStepCheck} />
              <div className={styles.completionStepBody}>
                <span className={styles.completionStepTitle}>{step.title}</span>
                {fb && <span className={styles.completionStepFeedback}>«{fb.text}»</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Чат ─────────────────────────────────────────────────────────
function ChatPanel({ assignment }: { assignment: OnboardingAssignment }) {
  const { sendMessage } = useOnboarding();
  const { user } = useUser();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assignment.messages.length]);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    setText('');
    await sendMessage(assignment.id, msg);
    setSending(false);
  };

  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHead}>
        <MessageSquare size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <div>
          <div className={styles.chatHeadTitle}>Чат с куратором</div>
          <div className={styles.chatHeadSub}>{assignment.assignedByName}</div>
        </div>
      </div>

      <div className={styles.chatMessages}>
        {assignment.messages.length === 0 ? (
          <div className={styles.chatEmptyMsg}>Сообщений пока нет</div>
        ) : (
          assignment.messages.map(msg => {
            const isMe = msg.senderId === user.id || msg.senderId === user.employee?.id;
            return (
              <div key={msg.id} className={`${styles.message} ${isMe ? styles.messageMe : styles.messageThem}`}>
                {!isMe && <span className={styles.messageSender}>{msg.senderName}</span>}
                <div className={`${styles.messageBubble} ${isMe ? styles.messageBubbleMe : styles.messageBubbleThem}`}>
                  {msg.text}
                </div>
                <span className={styles.messageTime}>{fmtTime(msg.sentAt)}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.chatInput}>
        <textarea
          className={styles.chatTextarea}
          placeholder="Написать сообщение..."
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
          }}
        />
        <button className={styles.chatSendBtn} onClick={() => void handleSend()} disabled={!text.trim() || sending}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Карточка назначения ──────────────────────────────────────────
function AssignmentCard({ assignment }: { assignment: OnboardingAssignment }) {
  const { completeStepWithFeedback, cancelAssignment } = useOnboarding();
  const { getEnrollment } = useCourses();

  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const progress = calcOnboardingProgress(assignment);
  const isDone = assignment.status === 'completed';
  const isCancelled = assignment.status === 'cancelled';

  const handleCancelConfirm = async () => {
    setCancelling(true);
    try {
      await cancelAssignment(assignment.id);
    } finally {
      setCancelling(false);
      setCancelConfirm(false);
    }
  };

  // Дедлайн онбординга
  const overallOverdue = assignment.dueDate && !isDone && isOverdue(assignment.dueDate);

  const handleCancel = (stepId: string) => {
    setExpandedStepId(null);
    setFeedbackTexts(prev => { const n = { ...prev }; delete n[stepId]; return n; });
  };

  const handleSubmit = async (stepId: string) => {
    const text = (feedbackTexts[stepId] ?? '').trim();
    if (!text || submitting) return;
    setSubmitting(true);
    await completeStepWithFeedback(assignment.id, stepId, text);
    setSubmitting(false);
    setExpandedStepId(null);
    setFeedbackTexts(prev => { const n = { ...prev }; delete n[stepId]; return n; });
  };

  return (
    <div className={styles.assignment}>
      {/* ── Шапка ── */}
      <div className={styles.assignmentHead}>
        <div className={styles.assignmentHeadTop}>
          <h2 className={styles.assignmentTitle}>{assignment.templateTitle}</h2>
          {isDone && (
            <span className={styles.doneBadge}>
              <CheckCircle2 size={11} /> Завершён
            </span>
          )}
          {isCancelled && (
            <span className={styles.cancelledBadge}>
              <XCircle size={11} /> Отменён
            </span>
          )}
          {!isDone && !isCancelled && !cancelConfirm && (
            <button className={styles.cancelBtn} onClick={() => setCancelConfirm(true)}>
              Отменить онбординг
            </button>
          )}
          {cancelConfirm && (
            <span className={styles.cancelConfirmRow}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Отменить навсегда?</span>
              <button className={styles.cancelBtnConfirm} onClick={() => void handleCancelConfirm()} disabled={cancelling}>
                {cancelling ? '...' : 'Да, отменить'}
              </button>
              <button className={styles.cancelBtnAbort} onClick={() => setCancelConfirm(false)} disabled={cancelling}>
                Нет
              </button>
            </span>
          )}
        </div>
        <div className={styles.assignmentMeta}>
          <span>{assignment.divisionName}</span>
          <span className={styles.dot} />
          <span>Куратор: {assignment.assignedByName}</span>
          <span className={styles.dot} />
          <span>Начат {assignment.startedAt}</span>
          {assignment.dueDate && (
            <>
              <span className={styles.dot} />
              <span className={`${styles.dueDateMeta} ${overallOverdue ? styles.dueDateOverdue : ''}`}>
                <Calendar size={11} />
                Срок: {fmtDue(assignment.dueDate)}
                {overallOverdue && ' — просрочен'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Прогресс */}
      <div className={styles.progressWrap}>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${isDone ? styles.progressFillDone : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressLabel}>{progress}%</span>
      </div>

      {/* ── Экран завершения / отмены ── */}
      {isCancelled ? (
        <div className={styles.cancelledScreen}>
          <XCircle size={36} strokeWidth={1.5} style={{ opacity: 0.4 }} />
          <p>Этот онбординг был отменён.</p>
        </div>
      ) : isDone ? (
        <CompletionScreen assignment={assignment} />
      ) : (
        <div className={styles.steps}>
          {[...assignment.steps].sort((a, b) => a.order - b.order).map(step => {
            const done = assignment.completedSteps.includes(step.id);
            const feedback = assignment.feedbacks.find(f => f.stepId === step.id);
            const isExpanded = expandedStepId === step.id;
            const feedbackText = feedbackTexts[step.id] ?? '';

            // Курс-гейт: шаг типа course с courseId требует завершённого курса
            const enrollment = step.type === 'course' && step.courseId
              ? getEnrollment(step.courseId)
              : undefined;
            const courseGated = step.type === 'course' && !!step.courseId
              && enrollment?.status !== 'completed';

            // Дедлайн шага
            const stepOverdue = step.dueDate && !done && isOverdue(step.dueDate);

            return (
              <div key={step.id} className={`${styles.step} ${done ? styles.stepCompleted : ''}`}>
                <div className={`${styles.stepCheck} ${done ? styles.stepCheckDone : ''}`}>
                  {done && <CheckCircle2 size={12} />}
                </div>

                <div className={styles.stepBody}>
                  {/* Заголовок строки */}
                  <div className={styles.stepTitleRow}>
                    <span className={`${styles.stepTitle} ${done ? styles.stepTitleDone : ''}`}>
                      {step.title}
                    </span>
                    <span className={`${styles.typeBadge} ${TYPE_CSS[step.type]}`}>
                      <StepIcon type={step.type} size={10} />
                      {STEP_TYPE_LABELS[step.type]}
                    </span>
                    {step.dueDate && !done && (
                      <span className={`${styles.dueBadge} ${stepOverdue ? styles.dueBadgeOverdue : ''}`}>
                        {stepOverdue
                          ? <><AlertCircle size={10} /> Просрочено {fmtDue(step.dueDate)}</>
                          : <><Clock size={10} /> до {fmtDue(step.dueDate)}</>
                        }
                      </span>
                    )}
                  </div>

                  {/* Описание */}
                  <p className={styles.stepDesc}>{step.description}</p>

                  {/* Ссылка на курс */}
                  {step.type === 'course' && step.courseId && (
                    <Link to={`/courses/${step.courseId}`} className={styles.courseLink}>
                      <ExternalLink size={12} />
                      {done
                        ? 'Повторить курс'
                        : enrollment?.status === 'in_progress'
                          ? 'Продолжить курс'
                          : 'Открыть курс на платформе'
                      }
                    </Link>
                  )}

                  {/* Курс-гейт: не завершён */}
                  {courseGated && !done && (
                    <div className={styles.courseGate}>
                      <BookOpen size={13} />
                      <span>
                        {!enrollment
                          ? 'Запишитесь и пройдите курс — затем сможете отметить шаг.'
                          : enrollment.status === 'not_enrolled'
                            ? 'Запишитесь и пройдите курс — затем сможете отметить шаг.'
                            : enrollment.status === 'pending_approval'
                              ? 'Заявка на курс ожидает одобрения.'
                              : enrollment.status === 'in_progress'
                                ? 'Завершите курс, чтобы отметить шаг выполненным.'
                                : 'Сначала пройдите курс.'
                        }
                      </span>
                    </div>
                  )}

                  {/* Завершённый: отзыв */}
                  {done && feedback && (
                    <div className={styles.stepFeedbackDisplay}>
                      <span className={styles.feedbackLabel}>Ваш отзыв:</span>
                      <span className={styles.feedbackText}>{feedback.text}</span>
                    </div>
                  )}

                  {/* Не завершён и не заблокирован курсом: форма */}
                  {!done && !courseGated && (
                    isExpanded ? (
                      <div className={styles.feedbackForm}>
                        <textarea
                          className={styles.feedbackTextarea}
                          placeholder="Опишите, что было сделано, какие возникли вопросы или сложности..."
                          rows={3}
                          value={feedbackText}
                          onChange={e =>
                            setFeedbackTexts(prev => ({ ...prev, [step.id]: e.target.value }))
                          }
                          autoFocus
                        />
                        <div className={styles.feedbackFormActions}>
                          <button className={styles.feedbackCancelBtn} onClick={() => handleCancel(step.id)}>
                            Отмена
                          </button>
                          <button
                            className={styles.feedbackSubmitBtn}
                            disabled={!feedbackText.trim() || submitting}
                            onClick={() => void handleSubmit(step.id)}
                          >
                            {submitting ? 'Сохраняем...' : 'Отметить выполненным'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className={styles.markDoneBtn}
                        onClick={() => setExpandedStepId(step.id)}
                      >
                        Отметить как выполненное
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Главная страница ─────────────────────────────────────────────
export function OnboardingPage() {
  const { myAssignments, isLoading, loadMessages, subscribeToChat } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  const active = myAssignments.find(a => a.id === selected) ?? myAssignments[0] ?? null;

  useEffect(() => {
    if (!active?.id) return;
    void loadMessages(active.id);
    return subscribeToChat(active.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  if (isLoading) return <div className={styles.empty}>Загрузка...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Мой онбординг</h1>
        </div>
        <p className={styles.subtitle}>
          Выполните все шаги — перед отметкой оставьте краткий отзыв. Куратор следит за прогрессом.
        </p>
      </div>

      {myAssignments.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><ClipboardList size={48} /></div>
          <p>Онбординг пока не назначен</p>
        </div>
      ) : (
        <div className={styles.layout}>
          <div>
            {myAssignments.length > 1 && (
              <div className={styles.assignmentTabs}>
                {myAssignments.map(a => (
                  <button
                    key={a.id}
                    className={`${styles.assignmentTab} ${(selected ?? myAssignments[0].id) === a.id ? styles.assignmentTabActive : ''}`}
                    onClick={() => setSelected(a.id)}
                  >
                    {a.templateTitle}
                  </button>
                ))}
              </div>
            )}
            {active && <AssignmentCard assignment={active} />}
          </div>

          {active && <ChatPanel assignment={active} />}
        </div>
      )}
    </div>
  );
}
