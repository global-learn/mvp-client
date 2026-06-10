import { useRef, useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import {
  UserPlus, X, Send, CheckCircle2, MessageSquare, ClipboardList,
  Plus, Trash2, ChevronUp, ChevronDown, Pencil, BookOpen, LayoutTemplate, Search, XCircle,
} from 'lucide-react';
import { useOnboarding } from '@entities/onboarding/model/OnboardingContext';
import { onboardingRealApi } from '@entities/onboarding/api/onboardingRealApi';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import type { OnboardingAssignment, OnboardingStep, OnboardingStepType, OnboardingTemplate } from '@entities/onboarding/model/types';
import { STEP_TYPE_LABELS, calcOnboardingProgress } from '@entities/onboarding/model/types';
import { useDepartmentsQuery, useDivisionsQuery, usePositionsQuery } from '@entities/company/api/hooks';
import { employeeApi } from '@entities/user/api/employeeApi';
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
  const { cancelAssignment } = useOnboarding();
  const progress = calcOnboardingProgress(assignment);
  const isDone = assignment.status === 'completed';
  const isCancelled = assignment.status === 'cancelled';
  const done = new Set(assignment.completedSteps);

  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try { await cancelAssignment(assignment.id); }
    finally { setCancelling(false); setCancelConfirm(false); }
  };

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
            <span>Начат {new Date(assignment.startedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className={styles.dot}>·</span>
            <span style={{ fontWeight: 600, color: isDone ? '#16a34a' : isCancelled ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
              {isCancelled ? 'Отменён' : `${progress}%`}
            </span>
          </div>
          {!isDone && !isCancelled && (
            <div className={styles.detailCancelRow}>
              {!cancelConfirm ? (
                <button className={styles.detailCancelBtn} onClick={() => setCancelConfirm(true)}>
                  <XCircle size={13} /> Отменить онбординг
                </button>
              ) : (
                <>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Отменить?</span>
                  <button className={styles.detailCancelBtnConfirm} onClick={() => void handleCancel()} disabled={cancelling}>
                    {cancelling ? '...' : 'Да'}
                  </button>
                  <button className={styles.detailCancelBtnAbort} onClick={() => setCancelConfirm(false)}>Нет</button>
                </>
              )}
            </div>
          )}
        </div>

        <div className={styles.detailSteps}>
          {[...assignment.steps].sort((a, b) => a.order - b.order).map(step => {
            const isStepDone = done.has(step.id);
            const feedback = assignment.feedbacks.find(f => f.stepId === step.id);
            return (
              <div key={step.id} className={styles.detailStep}>
                <div className={`${styles.detailStepCheck} ${isStepDone ? styles.detailStepCheckDone : ''}`}>
                  {isStepDone && <CheckCircle2 size={11} />}
                </div>
                <div className={styles.detailStepContent}>
                  <span className={`${styles.detailStepTitle} ${isStepDone ? styles.detailStepTitleDone : ''}`}>
                    {step.title}
                  </span>
                  {step.type === 'course' && step.courseId && (
                    <span className={styles.detailStepCourse}>
                      <BookOpen size={10} /> Курс
                    </span>
                  )}
                  {isStepDone && feedback && (
                    <div className={styles.detailStepFeedback}>
                      <span className={styles.feedbackLabel}>Отзыв сотрудника:</span>
                      <span className={styles.feedbackText}>{feedback.text}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DetailChat assignment={assignment} />
    </div>
  );
}

// ── Модальное окно добавления / редактирования шага ─────────────
interface StepFormModalProps {
  step?: OnboardingStep | null;
  templateMode: boolean;
  publishedCourses: { id: string; title: string }[];
  onSave: (data: Omit<OnboardingStep, 'id' | 'order'>) => void;
  onClose: () => void;
}

const EMPTY_STEP_DRAFT: Omit<OnboardingStep, 'id' | 'order'> = {
  title: '',
  description: '',
  type: 'task',
  required: false,
  dueDate: undefined,
  recommendedStartOffsetDays: 0,
  recommendedEndOffsetDays: 7,
};

function StepFormModal({ step, templateMode, publishedCourses, onSave, onClose }: StepFormModalProps) {
  const isEditing = !!step;
  const [draft, setDraft] = useState<Omit<OnboardingStep, 'id' | 'order'>>(
    step
      ? {
          title:                      step.title,
          description:                step.description,
          type:                       step.type,
          required:                   step.required,
          dueDate:                    step.dueDate,
          courseId:                   step.courseId,
          recommendedStartOffsetDays: step.recommendedStartOffsetDays ?? 0,
          recommendedEndOffsetDays:   step.recommendedEndOffsetDays ?? 7,
        }
      : { ...EMPTY_STEP_DRAFT },
  );

  return (
    <div className={styles.overlayInner} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEditing ? 'Редактировать шаг' : 'Добавить шаг'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.label}>
            Название шага *
            <input
              className={styles.select}
              placeholder="Например: Знакомство с командой"
              value={draft.title}
              autoFocus
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            />
          </label>

          <div className={styles.stepModalRow}>
            <label className={styles.label} style={{ flex: 1 }}>
              Тип шага
              <select
                className={styles.select}
                value={draft.type}
                onChange={e => setDraft(d => ({ ...d, type: e.target.value as OnboardingStepType, courseId: undefined }))}
              >
                {(Object.keys(STEP_TYPE_LABELS) as OnboardingStepType[]).map(t => (
                  <option key={t} value={t}>{STEP_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </label>
            <label className={styles.stepFormCheckbox} style={{ flexShrink: 0, alignSelf: 'flex-end', paddingBottom: '0.5625rem' }}>
              <input
                type="checkbox"
                checked={draft.required}
                onChange={e => setDraft(d => ({ ...d, required: e.target.checked }))}
              />
              Обязательный
            </label>
          </div>

          {draft.type === 'course' && (
            <label className={styles.label}>
              Курс
              <select
                className={styles.select}
                value={draft.courseId ?? ''}
                onChange={e => setDraft(d => ({ ...d, courseId: e.target.value || undefined }))}
              >
                <option value="">Выбрать курс...</option>
                {publishedCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </label>
          )}

          {templateMode ? (
            <div className={styles.stepModalRow}>
              <label className={styles.label} style={{ flex: 1 }}>
                Начало (дней от старта)
                <input
                  type="number"
                  min={0}
                  className={styles.select}
                  value={draft.recommendedStartOffsetDays ?? 0}
                  onChange={e => setDraft(d => ({ ...d, recommendedStartOffsetDays: Math.max(0, parseInt(e.target.value) || 0) }))}
                />
              </label>
              <label className={styles.label} style={{ flex: 1 }}>
                Конец (дней от старта)
                <input
                  type="number"
                  min={0}
                  className={styles.select}
                  value={draft.recommendedEndOffsetDays ?? 7}
                  onChange={e => setDraft(d => ({ ...d, recommendedEndOffsetDays: Math.max(0, parseInt(e.target.value) || 0) }))}
                />
              </label>
            </div>
          ) : (
            <label className={styles.label}>
              Срок выполнения
              <input
                type="date"
                className={styles.select}
                value={draft.dueDate ?? ''}
                onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value || undefined }))}
              />
            </label>
          )}

          <label className={styles.label}>
            Описание
            <textarea
              className={styles.select}
              placeholder="Подробное описание шага..."
              rows={3}
              value={draft.description}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
            />
          </label>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
          <button
            className={styles.submitBtn}
            disabled={!draft.title.trim()}
            onClick={() => onSave(draft)}
          >
            {isEditing ? 'Сохранить' : 'Добавить шаг'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Редактор шагов ───────────────────────────────────────────────
interface StepEditorProps {
  steps: OnboardingStep[];
  onChange: (steps: OnboardingStep[]) => void;
  /** В режиме шаблона показываем offset-дни вместо конкретной даты */
  templateMode?: boolean;
  /** Скрыть встроенный заголовок (когда он рендерится снаружи) */
  headerless?: boolean;
}

function StepEditor({ steps, onChange, templateMode = false, headerless = false }: StepEditorProps) {
  const { courses } = useCourses();
  const publishedCourses = courses.filter(c =>
    c.status === 'published' && (c.courseType === 'employee' || c.courseType === 'all'),
  );

  // null = closed, 'new' = adding, OnboardingStep = editing
  const [modalStep, setModalStep] = useState<OnboardingStep | 'new' | null>(null);

  const sorted = [...steps].sort((a, b) => a.order - b.order);

  const moveStep = (id: string, dir: -1 | 1) => {
    const list = [...sorted];
    const idx = list.findIndex(s => s.id === id);
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    onChange(list.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const deleteStep = (id: string) => {
    onChange(sorted.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleSave = (data: Omit<OnboardingStep, 'id' | 'order'>) => {
    if (modalStep === 'new') {
      const newStep: OnboardingStep = {
        ...data,
        id:          `step-new-${Date.now()}`,
        order:       steps.length + 1,
        title:       data.title.trim(),
        description: data.description.trim(),
        courseId:    data.type === 'course' ? data.courseId : undefined,
      };
      onChange([...steps, newStep]);
    } else if (modalStep) {
      onChange(steps.map(s => s.id === modalStep.id ? { ...modalStep, ...data } : s));
    }
    setModalStep(null);
  };

  const inner = (
    <>
      <div className={styles.stepEditorList}>
        {sorted.map((step, idx) => (
          <div key={step.id} className={styles.stepEditorItem}>
            <div className={styles.stepEditorRow}>
              <span className={styles.stepEditorOrder}>{idx + 1}.</span>
              <span className={styles.stepEditorTitle}>{step.title}</span>
              <span className={styles.stepEditorType}>{STEP_TYPE_LABELS[step.type]}</span>
              {step.required && <span className={styles.stepEditorRequired}>обяз.</span>}
              <div className={styles.stepEditorActions}>
                <button className={styles.stepMoveBtn} disabled={idx === 0} onClick={() => moveStep(step.id, -1)}>
                  <ChevronUp size={13} />
                </button>
                <button className={styles.stepMoveBtn} disabled={idx === sorted.length - 1} onClick={() => moveStep(step.id, 1)}>
                  <ChevronDown size={13} />
                </button>
                <button className={styles.stepEditBtn} onClick={() => setModalStep(step)}>
                  <Pencil size={13} />
                </button>
                <button className={styles.stepDeleteBtn} onClick={() => deleteStep(step.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {steps.length === 0 && (
          <div className={styles.stepEditorEmpty}>Нет шагов — добавьте хотя бы один</div>
        )}
      </div>

      <button className={styles.addStepBtn} onClick={() => setModalStep('new')}>
        <Plus size={14} /> Добавить шаг
      </button>

      {modalStep !== null && (
        <StepFormModal
          step={modalStep === 'new' ? null : modalStep}
          templateMode={templateMode}
          publishedCourses={publishedCourses}
          onSave={handleSave}
          onClose={() => setModalStep(null)}
        />
      )}
    </>
  );

  if (headerless) return inner;

  return (
    <div className={styles.stepEditorFull}>
      <div className={styles.stepEditorHeader}>
        <span>Шаги онбординга</span>
        <span className={styles.stepEditorCount}>{steps.length} шагов</span>
      </div>
      {inner}
    </div>
  );
}

// ── Модальное окно назначения ────────────────────────────────────
interface AssignModalProps {
  onClose: () => void;
}

function AssignModal({ onClose }: AssignModalProps) {
  const { templates, assign } = useOnboarding();
  const { user } = useUser();

  const { data: deptPage } = useDepartmentsQuery({ limit: 200 });
  const { data: divPage }  = useDivisionsQuery({ limit: 200 });
  const departments  = deptPage?.data ?? [];
  const allDivisions = divPage?.data ?? [];

  const [divisionId, setDivisionId]     = useState('');
  const [empId, setEmpId]               = useState('');
  const [templateId, setTemplateId]     = useState('');
  const [steps, setSteps]               = useState<OnboardingStep[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [dueDate, setDueDate]           = useState('');
  const [submitting, setSubmitting]     = useState(false);

  type EmpRow = { id: string; name: string; email: string; divisionId: string; departmentId: string; departmentName: string };
  const [employees, setEmployees] = useState<EmpRow[]>([]);
  const [empLoading, setEmpLoading] = useState(false);

  // Шаблоны для выбранного отдела: с targetDivisionId === divisionId или без привязки
  const availableTemplates = divisionId
    ? templates.filter(t => !t.targetDivisionId || t.targetDivisionId === divisionId)
    : [];

  // Когда меняется отдел — перезагружаем сотрудников и сбрасываем выборки
  useEffect(() => {
    if (!divisionId) { setEmployees([]); setEmpId(''); setTemplateId(''); return; }
    let cancelled = false;
    setEmpLoading(true);
    setEmpId('');

    employeeApi.list({ page: 1, limit: 200, divisionId })
      .then(res => {
        if (cancelled) return;
        const selfId = user.employee?.id;
        const rows = res.data
          .filter(e => e.id !== selfId)
          .map(e => ({
            id:             e.id,
            name:           e.fullname,
            email:          e.email,
            divisionId:     e.divisionId,
            departmentId:   e.department.id,
            departmentName: e.department.name,
          }));
        setEmployees(rows);
        if (rows.length > 0) setEmpId(rows[0].id);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setEmpLoading(false); });
    return () => { cancelled = true; };
  }, [divisionId, user.employee?.id]);

  // Авто-выбор первого подходящего шаблона при смене отдела
  useEffect(() => {
    const tmplsForDiv = divisionId
      ? templates.filter(t => !t.targetDivisionId || t.targetDivisionId === divisionId)
      : [];
    setTemplateId(tmplsForDiv[0]?.id ?? '');
  }, [divisionId, templates]);

  // Загрузка шагов шаблона
  useEffect(() => {
    if (!templateId) { setSteps([]); return; }
    let cancelled = false;
    setStepsLoading(true);
    onboardingRealApi.getTemplateById(templateId)
      .then(full => { if (!cancelled) setSteps(full.steps.map(s => ({ ...s }))); })
      .catch(() => { if (!cancelled) setSteps([]); })
      .finally(() => { if (!cancelled) setStepsLoading(false); });
    return () => { cancelled = true; };
  }, [templateId]);

  const selectedEmp  = employees.find(e => e.id === empId);
  const selectedTmpl = availableTemplates.find(t => t.id === templateId);

  const handleSubmit = async () => {
    if (!selectedEmp || !templateId || steps.length === 0) return;
    setSubmitting(true);
    try {
      await assign(
        templateId,
        selectedEmp.id,
        selectedEmp.name,
        selectedEmp.email,
        selectedEmp.divisionId,
        '',
        selectedEmp.departmentId,
        selectedEmp.departmentName,
        steps,
        dueDate || undefined,
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!divisionId && !!empId && !!templateId && !stepsLoading && steps.length > 0 && !submitting;

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Назначить онбординг</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>

          {/* ── Шаг 1: Отдел ── */}
          <label className={styles.label}>
            Отдел *
            <select
              className={styles.select}
              value={divisionId}
              onChange={e => setDivisionId(e.target.value)}
            >
              <option value="">Выберите отдел...</option>
              {departments.map(dept => {
                const deptDivs = allDivisions.filter(d => d.departmentId === dept.id);
                if (deptDivs.length === 0) return null;
                return (
                  <optgroup key={dept.id} label={dept.name}>
                    {deptDivs.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>

          {/* ── Шаг 2: Сотрудник ── */}
          <label className={styles.label}>
            Сотрудник *
            <select
              className={styles.select}
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              disabled={!divisionId || empLoading || employees.length === 0}
            >
              {!divisionId
                ? <option value="">Сначала выберите отдел</option>
                : empLoading
                  ? <option value="">Загрузка сотрудников...</option>
                  : employees.length === 0
                    ? <option value="">Нет доступных сотрудников</option>
                    : employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))
              }
            </select>
          </label>
          {selectedEmp && (
            <p className={styles.fieldHint}>{selectedEmp.email} · {selectedEmp.departmentName}</p>
          )}

          {/* ── Шаг 3: Шаблон ── */}
          <label className={styles.label}>
            Шаблон онбординга *
            <select
              className={styles.select}
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              disabled={!divisionId}
            >
              {!divisionId
                ? <option value="">Сначала выберите отдел</option>
                : availableTemplates.length === 0
                  ? <option value="">Нет шаблонов для этого отдела</option>
                  : availableTemplates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} · {t.stepCount ?? t.steps.length} шагов
                      </option>
                    ))
              }
            </select>
          </label>
          {selectedTmpl?.description && (
            <p className={styles.fieldHint}>{selectedTmpl.description}</p>
          )}

          {/* ── Шаг 4: Срок ── */}
          <label className={styles.label}>
            Срок завершения
            <input
              type="date"
              className={styles.select}
              value={dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDueDate(e.target.value)}
            />
          </label>

          {/* ── Шаги шаблона ── */}
          {!!templateId && (
            stepsLoading
              ? <div className={styles.stepsLoadingHint}>Загрузка шагов...</div>
              : <StepEditor steps={steps} onChange={setSteps} />
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
          <button
            className={styles.submitBtn}
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {submitting ? 'Назначаем...' : 'Назначить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Модальное окно создания/редактирования шаблона ──────────────
interface TemplateModalProps {
  initial?: OnboardingTemplate | null;
  onClose: () => void;
}

function TemplateModal({ initial, onClose }: TemplateModalProps) {
  const { createTemplate, updateTemplate } = useOnboarding();
  const { user } = useUser();
  const isEditing = !!initial;

  const { data: divPage } = useDivisionsQuery({ limit: 200 });
  const { data: posPage } = usePositionsQuery({ limit: 200 });
  const divisions = divPage?.data ?? [];
  const positions = posPage?.data ?? [];

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [divisionId, setDivisionId] = useState(initial?.targetDivisionId ?? '');
  const [positionId, setPositionId] = useState(initial?.positionId ?? '');
  const [steps, setSteps] = useState<OnboardingStep[]>(initial?.steps ?? []);
  const [stepsOpen, setStepsOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && !!divisionId && steps.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const dto: Omit<OnboardingTemplate, 'id' | 'createdAt'> = {
        title:            title.trim(),
        description:      description.trim(),
        positionId,
        targetDivisionId: divisionId,
        targetRole:       null,
        steps,
        createdBy:        user.id,
        status:           'active',
      };
      if (isEditing && initial) {
        await updateTemplate(initial.id, dto);
      } else {
        await createTemplate(dto);
      }
      onClose();
    } catch (err) {
      // 409 = template already existed → context reloaded it; just close
      if (isAxiosError(err) && err.response?.status === 409) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.modalLg}`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isEditing ? 'Редактировать шаблон' : 'Создать шаблон онбординга'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.label}>
            Название шаблона *
            <input
              className={styles.select}
              placeholder="Например: Онбординг отдела продаж"
              value={title}
              autoFocus
              onChange={e => setTitle(e.target.value)}
            />
          </label>

          <label className={styles.label}>
            Описание
            <textarea
              className={styles.select}
              placeholder="Краткое описание шаблона..."
              rows={2}
              value={description}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              onChange={e => setDescription(e.target.value)}
            />
          </label>

          <div className={styles.stepModalRow}>
            <label className={styles.label} style={{ flex: 1 }}>
              Отдел *
              <select className={styles.select} value={divisionId} onChange={e => setDivisionId(e.target.value)}>
                <option value="">Выберите отдел...</option>
                {divisions.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>

            <label className={styles.label} style={{ flex: 1 }}>
              Должность
              <select className={styles.select} value={positionId} onChange={e => setPositionId(e.target.value)}>
                <option value="">Общая (все должности)</option>
                {positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          </div>

          {/* ── Секция шагов (раскрывающаяся) ── */}
          <div className={styles.stepEditorFull}>
            <button
              type="button"
              className={styles.stepEditorHeader}
              style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'left', border: 'none', background: 'none', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem' }}
              onClick={() => setStepsOpen(o => !o)}
            >
              <span>Шаги онбординга</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {steps.length > 0 && (
                  <span className={styles.stepEditorCount}>{steps.length} шагов</span>
                )}
                {stepsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>

            {stepsOpen && <StepEditor steps={steps} onChange={setSteps} templateMode headerless />}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
          <button
            className={styles.submitBtn}
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {submitting
              ? (isEditing ? 'Сохраняем...' : 'Создаём...')
              : (isEditing ? 'Сохранить' : 'Создать шаблон')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Вкладка «Шаблоны» ───────────────────────────────────────────
const TMPL_LIMIT = 10;

function TemplatesTab() {
  const { data: divPage } = useDivisionsQuery({ limit: 200 });
  const { data: posPage } = usePositionsQuery({ limit: 200 });
  const divisions = divPage?.data ?? [];
  const positions = posPage?.data ?? [];

  const [filterDivId, setFilterDivId] = useState('');
  const [filterPosId, setFilterPosId] = useState('');
  const [page, setPage]               = useState(1);
  const [refreshKey, setRefreshKey]   = useState(0);

  const [tmplData, setTmplData]       = useState<{ data: OnboardingTemplate[]; count: number }>({ data: [], count: 0 });
  const [tmplLoading, setTmplLoading] = useState(false);

  const [createOpen, setCreateOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState<OnboardingTemplate | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(tmplData.count / TMPL_LIMIT));

  useEffect(() => {
    setTmplLoading(true);
    onboardingRealApi.getTemplates({
      divisionId: filterDivId || undefined,
      positionId: filterPosId || undefined,
      page,
      limit: TMPL_LIMIT,
    })
      .then(result => setTmplData(result))
      .catch(() => {})
      .finally(() => setTmplLoading(false));
  }, [filterDivId, filterPosId, page, refreshKey]);

  const handleFilterDivChange = (id: string) => { setFilterDivId(id); setPage(1); };
  const handleFilterPosChange = (id: string) => { setFilterPosId(id); setPage(1); };

  const handleEditClick = async (tmpl: OnboardingTemplate) => {
    setLoadingEditId(tmpl.id);
    try {
      const full = await onboardingRealApi.getTemplateById(tmpl.id);
      setEditTarget(full);
    } catch {
      setEditTarget(tmpl);
    } finally {
      setLoadingEditId(null);
    }
  };

  const afterModalClose = () => {
    setCreateOpen(false);
    setEditTarget(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <div>
      {/* ── Фильтры ── */}
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={filterDivId}
          onChange={e => handleFilterDivChange(e.target.value)}
        >
          <option value="">Все отделы</option>
          {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select
          className={styles.filterSelect}
          value={filterPosId}
          onChange={e => handleFilterPosChange(e.target.value)}
        >
          <option value="">Все должности</option>
          {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          {tmplData.count} шаблонов
        </span>

        <button className={styles.createTmplBtn} onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> Создать шаблон
        </button>
      </div>

      {/* ── Список ── */}
      {tmplLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
          Загрузка...
        </div>
      ) : tmplData.data.length === 0 ? (
        <div className={styles.listEmpty} style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
          <LayoutTemplate size={36} style={{ opacity: 0.25, display: 'block', margin: '0 auto 0.75rem' }} />
          {filterDivId || filterPosId ? 'Шаблонов не найдено' : 'Шаблонов пока нет — создайте первый'}
        </div>
      ) : (
        <div className={styles.templatesGrid}>
          {tmplData.data.map(tmpl => {
            const count = tmpl.stepCount ?? tmpl.steps.length;
            return (
              <div key={tmpl.id} className={styles.tmplCard}>
                <div className={styles.tmplCardHeader}>
                  <span className={styles.tmplTitle}>{tmpl.title}</span>
                  <button
                    className={styles.stepEditBtn}
                    title="Редактировать шаблон"
                    disabled={loadingEditId === tmpl.id}
                    onClick={() => void handleEditClick(tmpl)}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
                {tmpl.description && (
                  <span className={styles.tmplDesc}>{tmpl.description}</span>
                )}
                <div className={styles.tmplMeta}>
                  <span className={styles.tmplStepsCount}>{count} шагов</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Пагинация ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', fontSize: '0.875rem' }}>
          <button className={styles.cancelBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
          <span style={{ color: 'var(--muted-foreground)' }}>{page} / {totalPages}</span>
          <button className={styles.cancelBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}

      {createOpen && <TemplateModal onClose={afterModalClose} />}
      {editTarget  && <TemplateModal initial={editTarget} onClose={afterModalClose} />}
    </div>
  );
}

// ── Вкладка «Назначения» ─────────────────────────────────────────
function AssignmentsTab() {
  const { allAssignments, loadMessages } = useOnboarding();
  const { data: divPage }  = useDivisionsQuery({ limit: 200 });
  const divisions          = divPage?.data ?? [];

  const [selected, setSelected]         = useState<string | null>(null);
  const [assignOpen, setAssignOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterDivId, setFilterDivId]   = useState('');

  useEffect(() => {
    if (selected) void loadMessages(selected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handleDivChange = (divId: string) => {
    setFilterDivId(divId);
    setSelected(null);
  };

  // Фильтрация назначений
  const filtered = allAssignments
    .filter(a => !filterDivId || a.divisionId === filterDivId)
    .filter(a => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.employeeName.toLowerCase().includes(q) ||
        a.employeeEmail.toLowerCase().includes(q) ||
        a.templateTitle.toLowerCase().includes(q)
      );
    });

  // Статистика по выбранному отделу
  const scopeAssignments = filterDivId
    ? allAssignments.filter(a => a.divisionId === filterDivId)
    : [];
  const showStats  = !!filterDivId;
  const statsTotal = scopeAssignments.length;
  const statsDone  = scopeAssignments.filter(a => a.status === 'completed').length;
  const statsActive= scopeAssignments.filter(a => a.status === 'in_progress').length;
  const statsAvg   = statsTotal > 0
    ? Math.round(scopeAssignments.reduce((s, a) => s + calcOnboardingProgress(a), 0) / statsTotal)
    : 0;

  const active = allAssignments.find(a => a.id === selected) ?? null;
  const scopeLabel = divisions.find(d => d.id === filterDivId)?.name ?? '';

  return (
    <div>
      {/* ── Панель фильтров ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterSearchWrap}>
          <Search size={14} className={styles.filterSearchIcon} />
          <input
            className={styles.filterSearchInput}
            placeholder="Поиск по сотруднику, шаблону..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={filterDivId}
          onChange={e => handleDivChange(e.target.value)}
        >
          <option value="">Все отделы</option>
          {divisions.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <button className={styles.assignBtn} onClick={() => setAssignOpen(true)}>
          <UserPlus size={15} /> Назначить
        </button>
      </div>

      {/* ── Статистика выбранного департамента / отдела ── */}
      {showStats && (
        <div className={styles.deptStats}>
          <div className={styles.deptStatsLabel}>
            Статистика: <strong>{scopeLabel}</strong>
          </div>
          <div className={styles.deptStatsCards}>
            <div className={styles.deptStatCard}>
              <span className={styles.deptStatNum}>{statsTotal}</span>
              <span className={styles.deptStatName}>Всего назначений</span>
            </div>
            <div className={`${styles.deptStatCard} ${styles.deptStatCardGreen}`}>
              <span className={styles.deptStatNum}>{statsDone}</span>
              <span className={styles.deptStatName}>Завершено</span>
            </div>
            <div className={`${styles.deptStatCard} ${styles.deptStatCardYellow}`}>
              <span className={styles.deptStatNum}>{statsActive}</span>
              <span className={styles.deptStatName}>В процессе</span>
            </div>
            <div className={`${styles.deptStatCard} ${styles.deptStatCardBlue}`}>
              <span className={styles.deptStatNum}>{statsAvg}%</span>
              <span className={styles.deptStatName}>Средний прогресс</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Основная сетка: список + детали ── */}
      <div className={styles.layout}>
        <div className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.listEmpty}>
              <ClipboardList size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.75rem' }} />
              {allAssignments.length === 0 ? 'Нет назначенных онбордингов' : 'Ничего не найдено'}
            </div>
          ) : (
            filtered.map(a => {
              const progress = calcOnboardingProgress(a);
              const isDone   = a.status === 'completed';
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
                    <span className={`${styles.statusBadge} ${a.status === 'completed' ? styles.statusDone : a.status === 'cancelled' ? styles.statusCancelled : styles.statusInProgress}`}>
                      {a.status === 'completed' ? 'Завершён' : a.status === 'cancelled' ? 'Отменён' : 'В процессе'}
                    </span>
                  </div>

                  <div className={styles.empTemplate}>{a.templateTitle}</div>

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
                    <div className={styles.empChatHint}>
                      <MessageSquare size={12} />
                      {a.messages.length} сообщ. · {fmtDate(a.messages[a.messages.length - 1].sentAt)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

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

// ── Главная страница ─────────────────────────────────────────────
type PageTab = 'assignments' | 'templates';

export function OnboardingManagePage() {
  const { isLoading } = useOnboarding();
  const [pageTab, setPageTab] = useState<PageTab>('assignments');

  if (isLoading) return <div style={{ padding: '3rem', color: 'var(--muted-foreground)' }}>Загрузка...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Управление онбордингом</h1>
          </div>
          <p className={styles.subtitle}>
            Прогресс сотрудников, их отзывы по шагам и чат — всё на одном экране.
          </p>
        </div>
      </div>

      {/* Вкладки страницы */}
      <div className={styles.pageTabs}>
        <button
          className={`${styles.pageTab} ${pageTab === 'assignments' ? styles.pageTabActive : ''}`}
          onClick={() => setPageTab('assignments')}
        >
          <ClipboardList size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />
          Назначения
        </button>
        <button
          className={`${styles.pageTab} ${pageTab === 'templates' ? styles.pageTabActive : ''}`}
          onClick={() => setPageTab('templates')}
        >
          <LayoutTemplate size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />
          Шаблоны
        </button>
      </div>

      {pageTab === 'templates' ? <TemplatesTab /> : <AssignmentsTab />}
    </div>
  );
}
