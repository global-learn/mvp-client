import { useRef, useState } from 'react';
import {
  UserPlus, X, Send, CheckCircle2, MessageSquare, ClipboardList,
} from 'lucide-react';
import { useOnboarding } from '@entities/onboarding/model/OnboardingContext';
import { useUser } from '@entities/user/model/UserContext';
import type { OnboardingAssignment } from '@entities/onboarding/model/types';
import { calcOnboardingProgress } from '@entities/onboarding/model/types';
import styles from './OnboardingManage.module.css';

// ── Форматирование времени ───────────────────────────────────────
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ── Чат-панель ───────────────────────────────────────────────────
function DetailChat({ assignment }: { assignment: OnboardingAssignment }) {
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
    <div className={styles.detailChat}>
      <div className={styles.chatHead}>
        <MessageSquare size={15} style={{ color: 'var(--primary)' }} />
        <span className={styles.chatHeadTitle}>Чат</span>
      </div>
      <div className={styles.chatMessages}>
        {assignment.messages.length === 0 ? (
          <div className={styles.chatEmptyMsg}>Нет сообщений</div>
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
          placeholder="Сообщение..."
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
          }}
        />
        <button
          className={styles.chatSendBtn}
          onClick={() => void handleSend()}
          disabled={!text.trim() || sending}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Детальная панель сотрудника ──────────────────────────────────
function DetailPanel({ assignment }: { assignment: OnboardingAssignment }) {
  const progress = calcOnboardingProgress(assignment);
  const isDone = assignment.status === 'completed';
  const done = new Set(assignment.completedSteps);

  return (
    <div className={styles.detail}>
      <div className={styles.detailCard}>
        <div className={styles.detailCardHead}>
          <div className={styles.detailEmpRow}>
            <div className={styles.detailAvatar}>
              {(assignment.employeeName || assignment.employeeEmail)[0].toUpperCase()}
            </div>
            <div>
              <div className={styles.detailEmpName}>{assignment.employeeName}</div>
              <div className={styles.detailEmpEmail}>{assignment.employeeEmail}</div>
            </div>
          </div>
          <div className={styles.detailMeta}>
            <span>{assignment.divisionName}</span>
            <span className={styles.dot}>·</span>
            <span>{assignment.templateTitle}</span>
            <span className={styles.dot}>·</span>
            <span>Начат {assignment.startedAt}</span>
            <span className={styles.dot}>·</span>
            <span style={{ fontWeight: 600, color: isDone ? '#16a34a' : 'var(--foreground)' }}>
              {progress}%
            </span>
          </div>
        </div>

        <div className={styles.detailSteps}>
          {[...assignment.steps].sort((a, b) => a.order - b.order).map(step => {
            const isStepDone = done.has(step.id);
            return (
              <div key={step.id} className={styles.detailStep}>
                <div className={`${styles.detailStepCheck} ${isStepDone ? styles.detailStepCheckDone : ''}`}>
                  {isStepDone && <CheckCircle2 size={11} />}
                </div>
                <span className={`${styles.detailStepTitle} ${isStepDone ? styles.detailStepTitleDone : ''}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <DetailChat assignment={assignment} />
    </div>
  );
}

// ── Модальное окно назначения ────────────────────────────────────
interface AssignModalProps {
  onClose: () => void;
}

// Простой список сотрудников (mock)
const MOCK_EMPLOYEES = [
  { id: 'emp-2',   name: 'Мария Иванова',      email: 'user@test.com',    divId: 'div-sales',   divName: 'Отдел продаж',              deptId: 'dept-sales',      deptName: 'Департамент продаж' },
  { id: 'emp-3',   name: 'Сергей Волков',       email: 'serg@corp.ru',     divId: 'div-sales',   divName: 'Отдел продаж',              deptId: 'dept-sales',      deptName: 'Департамент продаж' },
  { id: 'emp-8',   name: 'Артём Лебедев',       email: 'artem@corp.ru',    divId: 'div-sales',   divName: 'Отдел продаж',              deptId: 'dept-sales',      deptName: 'Департамент продаж' },
  { id: 'emp-9',   name: 'Ольга Рыбакова',      email: 'olga.r@corp.ru',   divId: 'div-supply',  divName: 'Отдел обеспечения продаж',  deptId: 'dept-sales',      deptName: 'Департамент продаж' },
  { id: 'emp-10',  name: 'Павел Зайцев',        email: 'pavel@corp.ru',    divId: 'div-meat',    divName: 'Отдел мясной промышленности', deptId: 'dept-monitoring', deptName: 'Департамент мониторинга' },
  { id: 'emp-11',  name: 'Екатерина Морозова',  email: 'kate@corp.ru',     divId: 'div-retail',  divName: 'Отдел сетевого ретейла',    deptId: 'dept-monitoring', deptName: 'Департамент мониторинга' },
];

function AssignModal({ onClose }: AssignModalProps) {
  const { templates, assign } = useOnboarding();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [empId, setEmpId] = useState(MOCK_EMPLOYEES[0].id);
  const [submitting, setSubmitting] = useState(false);

  const selectedTemplate = templates.find(t => t.id === templateId);
  const selectedEmp = MOCK_EMPLOYEES.find(e => e.id === empId)!;

  const handleSubmit = async () => {
    if (!templateId || !empId) return;
    setSubmitting(true);
    await assign(
      templateId,
      selectedEmp.id,
      selectedEmp.name,
      selectedEmp.email,
      selectedEmp.divId,
      selectedEmp.divName,
      selectedEmp.deptId,
      selectedEmp.deptName,
    );
    setSubmitting(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Назначить онбординг</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <label className={styles.label}>
          Сотрудник
          <select
            className={styles.select}
            value={empId}
            onChange={e => setEmpId(e.target.value)}
          >
            {MOCK_EMPLOYEES.map(e => (
              <option key={e.id} value={e.id}>{e.name} — {e.divName}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Шаблон онбординга
          <select
            className={styles.select}
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </label>

        {selectedTemplate && (
          <div>
            <p className={styles.stepsEditorTitle}>Шаги ({selectedTemplate.steps.length})</p>
            <div className={styles.stepsEditor}>
              {[...selectedTemplate.steps].sort((a, b) => a.order - b.order).map(step => (
                <div key={step.id} className={styles.stepEditorRow}>
                  <span className={styles.stepEditorOrder}>{step.order}.</span>
                  <span className={styles.stepEditorTitle}>{step.title}</span>
                  {step.required && <span className={styles.stepEditorRequired}>обязательно</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
          <button
            className={styles.submitBtn}
            onClick={() => void handleSubmit()}
            disabled={!templateId || !empId || submitting}
          >
            {submitting ? 'Назначаем...' : 'Назначить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Главная страница ─────────────────────────────────────────────
export function OnboardingManagePage() {
  const { managedAssignments, isLoading } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const active = managedAssignments.find(a => a.id === selected) ?? null;

  if (isLoading) return <div style={{ padding: '3rem', color: 'var(--muted-foreground)' }}>Загрузка...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Управление онбордингом</h1>
          </div>
          <p className={styles.subtitle}>
            Прогресс сотрудников и чат — всё на одном экране.
          </p>
        </div>
        <button className={styles.assignBtn} onClick={() => setAssignOpen(true)}>
          <UserPlus size={16} /> Назначить онбординг
        </button>
      </div>

      <div className={styles.layout}>
        {/* Список сотрудников */}
        <div className={styles.list}>
          {managedAssignments.length === 0 ? (
            <div className={styles.listEmpty}>
              <ClipboardList size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.75rem' }} />
              Нет назначенных онбордингов
            </div>
          ) : (
            managedAssignments.map(a => {
              const progress = calcOnboardingProgress(a);
              const isDone = a.status === 'completed';
              const unread = a.messages.filter(m => m.senderId === a.employeeId || m.senderId !== 'user-current').length;

              return (
                <div
                  key={a.id}
                  className={`${styles.empCard} ${selected === a.id ? styles.empCardActive : ''}`}
                  onClick={() => setSelected(a.id)}
                >
                  <div className={styles.empRow}>
                    <div className={styles.empAvatar}>
                      {(a.employeeName || a.employeeEmail)[0].toUpperCase()}
                    </div>
                    <div className={styles.empInfo}>
                      <div className={styles.empName}>{a.employeeName}</div>
                      <div className={styles.empDiv}>{a.divisionName}</div>
                    </div>
                    <span className={`${styles.statusBadge} ${isDone ? styles.statusDone : styles.statusInProgress}`}>
                      {isDone ? 'Завершён' : 'В процессе'}
                    </span>
                  </div>

                  <div>
                    <div className={styles.miniBar}>
                      <div
                        className={`${styles.miniFill} ${isDone ? styles.miniFillDone : ''}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className={styles.miniMeta}>
                      <span>{a.completedSteps.length}/{a.steps.length} шагов</span>
                      <span>{progress}%</span>
                    </div>
                  </div>

                  {a.messages.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      <MessageSquare size={12} />
                      {a.messages.length} сообщений · последнее {fmtDate(a.messages[a.messages.length - 1].sentAt)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Детальная панель */}
        {active ? (
          <DetailPanel assignment={active} />
        ) : (
          <div className={styles.detailPlaceholder}>
            Выберите сотрудника слева, чтобы увидеть прогресс и открыть чат
          </div>
        )}
      </div>

      {assignOpen && <AssignModal onClose={() => setAssignOpen(false)} />}
    </div>
  );
}
