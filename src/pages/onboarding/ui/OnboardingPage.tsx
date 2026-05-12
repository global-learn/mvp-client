import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, ClipboardList, FileText, Video, BookOpen, Users, Send, MessageSquare, ExternalLink,
} from 'lucide-react';
import { useOnboarding } from '@entities/onboarding/model/OnboardingContext';
import { useUser } from '@entities/user/model/UserContext';
import type { OnboardingAssignment, OnboardingStepType } from '@entities/onboarding/model/types';
import { STEP_TYPE_LABELS, calcOnboardingProgress } from '@entities/onboarding/model/types';
import styles from './Onboarding.module.css';

// ── Иконка типа шага ─────────────────────────────────────────────
function StepIcon({ type, size = 14 }: { type: OnboardingStepType; size?: number }) {
  switch (type) {
    case 'document': return <FileText size={size} />;
    case 'meeting':  return <Users size={size} />;
    case 'video':    return <Video size={size} />;
    case 'course':   return <BookOpen size={size} />;
    default:         return <ClipboardList size={size} />;
  }
}

const TYPE_CSS: Record<OnboardingStepType, string> = {
  task:     styles.typeBadgeTask,
  document: styles.typeBadgeDocument,
  meeting:  styles.typeBadgeMeeting,
  video:    styles.typeBadgeVideo,
  course:   styles.typeBadgeCourse,
};

// ── Форматирование времени ───────────────────────────────────────
function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// ── Чат ─────────────────────────────────────────────────────────
function ChatPanel({ assignment }: { assignment: OnboardingAssignment }) {
  const { sendMessage } = useOnboarding();
  const { user } = useUser();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

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
            const isMe = msg.senderId === user.id || msg.senderId === 'user-current';
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
      </div>

      <div className={styles.chatInput}>
        <textarea
          className={styles.chatTextarea}
          placeholder="Написать сообщение..."
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <button
          className={styles.chatSendBtn}
          onClick={() => void handleSend()}
          disabled={!text.trim() || sending}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Карточка назначения ──────────────────────────────────────────
function AssignmentCard({ assignment }: { assignment: OnboardingAssignment }) {
  const { completeStepWithFeedback } = useOnboarding();
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const progress = calcOnboardingProgress(assignment);
  const isDone = assignment.status === 'completed';

  const handleExpand = (stepId: string) => {
    setExpandedStepId(prev => (prev === stepId ? null : stepId));
  };

  const handleCancel = (stepId: string) => {
    setExpandedStepId(null);
    setFeedbackTexts(prev => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  };

  const handleSubmit = async (stepId: string) => {
    const text = (feedbackTexts[stepId] ?? '').trim();
    if (!text || submitting) return;
    setSubmitting(true);
    await completeStepWithFeedback(assignment.id, stepId, text);
    setSubmitting(false);
    setExpandedStepId(null);
    setFeedbackTexts(prev => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  };

  return (
    <div className={styles.assignment}>
      <div className={styles.assignmentHead}>
        <h2 className={styles.assignmentTitle}>{assignment.templateTitle}</h2>
        <div className={styles.assignmentMeta}>
          <span>{assignment.divisionName}</span>
          <span className={styles.dot} />
          <span>Куратор: {assignment.assignedByName}</span>
          <span className={styles.dot} />
          <span>Начат {assignment.startedAt}</span>
        </div>
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${isDone ? styles.progressFillDone : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressLabel}>{progress}%</span>
      </div>

      <div className={styles.steps}>
        {[...assignment.steps].sort((a, b) => a.order - b.order).map(step => {
          const done = assignment.completedSteps.includes(step.id);
          const feedback = assignment.feedbacks.find(f => f.stepId === step.id);
          const isExpanded = expandedStepId === step.id;
          const feedbackText = feedbackTexts[step.id] ?? '';

          return (
            <div key={step.id} className={`${styles.step} ${done ? styles.stepCompleted : ''}`}>
              <div className={`${styles.stepCheck} ${done ? styles.stepCheckDone : ''}`}>
                {done && <CheckCircle2 size={12} />}
              </div>

              <div className={styles.stepBody}>
                {/* Title row */}
                <div className={styles.stepTitleRow}>
                  <span className={`${styles.stepTitle} ${done ? styles.stepTitleDone : ''}`}>
                    {step.title}
                  </span>
                  <span className={`${styles.typeBadge} ${TYPE_CSS[step.type]}`}>
                    <StepIcon type={step.type} size={10} />
                    {STEP_TYPE_LABELS[step.type]}
                  </span>
                  {step.required && !done && (
                    <span className={styles.requiredMark}>обязательно</span>
                  )}
                </div>

                {/* Description */}
                <p className={styles.stepDesc}>{step.description}</p>

                {/* Course link */}
                {step.type === 'course' && step.courseId && (
                  <Link
                    to={`/courses/${step.courseId}`}
                    className={styles.courseLink}
                  >
                    <ExternalLink size={12} />
                    {done ? 'Повторить курс' : 'Открыть курс на платформе'}
                  </Link>
                )}

                {/* Completed: show saved feedback */}
                {done && feedback && (
                  <div className={styles.stepFeedbackDisplay}>
                    <span className={styles.feedbackLabel}>Ваш отзыв:</span>
                    <span className={styles.feedbackText}>{feedback.text}</span>
                  </div>
                )}

                {/* Not done: mark-done button or inline feedback form */}
                {!done && !isDone && (
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
                        <button
                          className={styles.feedbackCancelBtn}
                          onClick={() => handleCancel(step.id)}
                        >
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
                      onClick={() => handleExpand(step.id)}
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

      {isDone && (
        <div className={styles.completedBanner}>
          <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
          <span className={styles.completedText}>Онбординг завершён! 🎉</span>
        </div>
      )}
    </div>
  );
}

// ── Главная страница ─────────────────────────────────────────────
export function OnboardingPage() {
  const { myAssignments, isLoading } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading) return <div className={styles.empty}>Загрузка...</div>;

  const active = myAssignments.find(a => a.id === selected) ?? myAssignments[0] ?? null;

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
