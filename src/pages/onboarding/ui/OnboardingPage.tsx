import { useRef, useState } from 'react';
import {
  CheckCircle2, ClipboardList, FileText, Video, BookOpen, Users, Send, MessageSquare,
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    setText('');
    await sendMessage(assignment.id, msg);
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
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
  const { toggleStep } = useOnboarding();
  const progress = calcOnboardingProgress(assignment);
  const isDone = assignment.status === 'completed';

  const handleToggle = async (stepId: string, currentlyDone: boolean) => {
    if (isDone) return;
    await toggleStep(assignment.id, stepId, !currentlyDone);
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
          return (
            <div
              key={step.id}
              className={styles.step}
              onClick={() => void handleToggle(step.id, done)}
            >
              <div className={`${styles.stepCheck} ${done ? styles.stepCheckDone : ''}`}>
                {done && <CheckCircle2 size={12} />}
              </div>
              <div className={styles.stepBody}>
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
                <p className={styles.stepDesc}>{step.description}</p>
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
          Выполните все шаги — куратор следит за прогрессом и готов ответить на вопросы.
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
            {myAssignments.map(a => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>

          {active && <ChatPanel assignment={active} />}
        </div>
      )}
    </div>
  );
}
