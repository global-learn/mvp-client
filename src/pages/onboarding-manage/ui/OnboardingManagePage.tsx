import { useRef, useState, useEffect } from 'react';
import {
  UserPlus, X, Send, CheckCircle2, MessageSquare, ClipboardList,
  Plus, Trash2, ChevronUp, ChevronDown, Pencil, BookOpen, LayoutTemplate,
} from 'lucide-react';
import { useOnboarding } from '@entities/onboarding/model/OnboardingContext';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import type { OnboardingAssignment, OnboardingStep, OnboardingStepType, OnboardingTemplate } from '@entities/onboarding/model/types';
import { STEP_TYPE_LABELS, calcOnboardingProgress } from '@entities/onboarding/model/types';
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

// ── Редактор шагов ───────────────────────────────────────────────
interface StepEditorProps {
  steps: OnboardingStep[];
  onChange: (steps: OnboardingStep[]) => void;
}

const EMPTY_NEW_STEP: Omit<OnboardingStep, 'id' | 'order'> = {
  title: '',
  description: '',
  type: 'task',
  required: false,
  dueDate: undefined,
};

function StepEditor({ steps, onChange }: StepEditorProps) {
  const { courses } = useCourses();
  const publishedCourses = courses.filter(c =>
    c.status === 'published' && (c.courseType === 'employee' || c.courseType === 'all'),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<OnboardingStep | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStep, setNewStep] = useState<Omit<OnboardingStep, 'id' | 'order'>>(EMPTY_NEW_STEP);

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
    const next = sorted.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }));
    onChange(next);
    if (editingId === id) { setEditingId(null); setEditDraft(null); }
  };

  const startEdit = (step: OnboardingStep) => {
    setEditingId(step.id);
    setEditDraft({ ...step });
    setShowAddForm(false);
  };

  const saveEdit = () => {
    if (!editDraft) return;
    onChange(steps.map(s => s.id === editDraft.id ? editDraft : s));
    setEditingId(null);
    setEditDraft(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };

  const addStep = () => {
    if (!newStep.title.trim()) return;
    const id = `step-new-${Date.now()}`;
    const step: OnboardingStep = {
      ...newStep,
      id,
      order: steps.length + 1,
      title: newStep.title.trim(),
      description: newStep.description.trim(),
      courseId: newStep.type === 'course' ? newStep.courseId : undefined,
    };
    onChange([...steps, step]);
    setNewStep(EMPTY_NEW_STEP);
    setShowAddForm(false);
  };

  return (
    <div className={styles.stepEditorFull}>
      <div className={styles.stepEditorHeader}>
        <span>Шаги онбординга</span>
        <span className={styles.stepEditorCount}>{steps.length} шагов</span>
      </div>

      <div className={styles.stepEditorList}>
        {sorted.map((step, idx) => (
          <div key={step.id} className={styles.stepEditorItem}>
            {editingId === step.id && editDraft ? (
              /* ── Inline edit form ── */
              <div className={styles.stepInlineForm}>
                <div className={styles.stepFormRow}>
                  <input
                    className={styles.stepFormInput}
                    placeholder="Название шага *"
                    value={editDraft.title}
                    onChange={e => setEditDraft({ ...editDraft, title: e.target.value })}
                  />
                </div>
                <div className={styles.stepFormRow2}>
                  <select
                    className={styles.stepFormSelect}
                    value={editDraft.type}
                    onChange={e => setEditDraft({ ...editDraft, type: e.target.value as OnboardingStepType, courseId: undefined })}
                  >
                    {(Object.keys(STEP_TYPE_LABELS) as OnboardingStepType[]).map(t => (
                      <option key={t} value={t}>{STEP_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                  <label className={styles.stepFormCheckbox}>
                    <input
                      type="checkbox"
                      checked={editDraft.required}
                      onChange={e => setEditDraft({ ...editDraft, required: e.target.checked })}
                    />
                    Обязательный
                  </label>
                </div>
                {editDraft.type === 'course' && (
                  <select
                    className={styles.stepFormSelect}
                    value={editDraft.courseId ?? ''}
                    onChange={e => setEditDraft({ ...editDraft, courseId: e.target.value || undefined })}
                  >
                    <option value="">Выбрать курс...</option>
                    {publishedCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                )}
                <div className={styles.stepFormRow2}>
                  <label className={styles.stepFormLabel}>Срок:</label>
                  <input
                    type="date"
                    className={styles.stepFormInput}
                    style={{ flex: 'none', width: 'auto' }}
                    value={editDraft.dueDate ?? ''}
                    onChange={e => setEditDraft({ ...editDraft, dueDate: e.target.value || undefined })}
                  />
                </div>
                <textarea
                  className={styles.stepFormTextarea}
                  placeholder="Описание шага..."
                  rows={2}
                  value={editDraft.description}
                  onChange={e => setEditDraft({ ...editDraft, description: e.target.value })}
                />
                <div className={styles.stepFormActions}>
                  <button className={styles.stepFormCancelBtn} onClick={cancelEdit}>Отмена</button>
                  <button
                    className={styles.stepFormSaveBtn}
                    disabled={!editDraft.title.trim()}
                    onClick={saveEdit}
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            ) : (
              /* ── Read-only row ── */
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
                  <button className={styles.stepEditBtn} onClick={() => startEdit(step)}>
                    <Pencil size={13} />
                  </button>
                  <button className={styles.stepDeleteBtn} onClick={() => deleteStep(step.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {steps.length === 0 && !showAddForm && (
          <div className={styles.stepEditorEmpty}>Нет шагов — добавьте хотя бы один</div>
        )}
      </div>

      {/* Add step form */}
      {showAddForm ? (
        <div className={styles.addStepForm}>
          <div className={styles.stepFormRow}>
            <input
              className={styles.stepFormInput}
              placeholder="Название шага *"
              value={newStep.title}
              onChange={e => setNewStep({ ...newStep, title: e.target.value })}
              autoFocus
            />
          </div>
          <div className={styles.stepFormRow2}>
            <select
              className={styles.stepFormSelect}
              value={newStep.type}
              onChange={e => setNewStep({ ...newStep, type: e.target.value as OnboardingStepType, courseId: undefined })}
            >
              {(Object.keys(STEP_TYPE_LABELS) as OnboardingStepType[]).map(t => (
                <option key={t} value={t}>{STEP_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <label className={styles.stepFormCheckbox}>
              <input
                type="checkbox"
                checked={newStep.required}
                onChange={e => setNewStep({ ...newStep, required: e.target.checked })}
              />
              Обязательный
            </label>
          </div>
          {newStep.type === 'course' && (
            <select
              className={styles.stepFormSelect}
              value={newStep.courseId ?? ''}
              onChange={e => setNewStep({ ...newStep, courseId: e.target.value || undefined })}
            >
              <option value="">Выбрать курс...</option>
              {publishedCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}
          <div className={styles.stepFormRow2}>
            <label className={styles.stepFormLabel}>Срок:</label>
            <input
              type="date"
              className={styles.stepFormInput}
              style={{ flex: 'none', width: 'auto' }}
              value={newStep.dueDate ?? ''}
              onChange={e => setNewStep({ ...newStep, dueDate: e.target.value || undefined })}
            />
          </div>
          <textarea
            className={styles.stepFormTextarea}
            placeholder="Описание шага..."
            rows={2}
            value={newStep.description}
            onChange={e => setNewStep({ ...newStep, description: e.target.value })}
          />
          <div className={styles.stepFormActions}>
            <button className={styles.stepFormCancelBtn} onClick={() => { setShowAddForm(false); setNewStep(EMPTY_NEW_STEP); }}>
              Отмена
            </button>
            <button
              className={styles.stepFormSaveBtn}
              disabled={!newStep.title.trim()}
              onClick={addStep}
            >
              Добавить шаг
            </button>
          </div>
        </div>
      ) : (
        <button
          className={styles.addStepBtn}
          onClick={() => { setShowAddForm(true); setEditingId(null); setEditDraft(null); }}
        >
          <Plus size={14} /> Добавить шаг
        </button>
      )}
    </div>
  );
}

// ── Модальное окно назначения ────────────────────────────────────
interface AssignModalProps {
  onClose: () => void;
}

const MOCK_EMPLOYEES = [
  { id: 'emp-2',  name: 'Мария Иванова',     email: 'user@test.com',  divId: 'div-sales',   divName: 'Отдел продаж',                deptId: 'dept-sales',      deptName: 'Департамент продаж' },
  { id: 'emp-3',  name: 'Сергей Волков',      email: 'serg@corp.ru',   divId: 'div-sales',   divName: 'Отдел продаж',                deptId: 'dept-sales',      deptName: 'Департамент продаж' },
  { id: 'emp-8',  name: 'Артём Лебедев',      email: 'artem@corp.ru',  divId: 'div-sales',   divName: 'Отдел продаж',                deptId: 'dept-sales',      deptName: 'Департамент продаж' },
  { id: 'emp-9',  name: 'Ольга Рыбакова',     email: 'olga.r@corp.ru', divId: 'div-supply',  divName: 'Отдел обеспечения продаж',    deptId: 'dept-sales',      deptName: 'Департамент продаж' },
  { id: 'emp-10', name: 'Павел Зайцев',       email: 'pavel@corp.ru',  divId: 'div-meat',    divName: 'Отдел мясной промышленности', deptId: 'dept-monitoring', deptName: 'Департамент мониторинга' },
  { id: 'emp-11', name: 'Екатерина Морозова', email: 'kate@corp.ru',   divId: 'div-retail',  divName: 'Отдел сетевого ретейла',      deptId: 'dept-monitoring', deptName: 'Департамент мониторинга' },
];

function AssignModal({ onClose }: AssignModalProps) {
  const { templates, assign } = useOnboarding();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [empId, setEmpId] = useState(MOCK_EMPLOYEES[0].id);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync steps when template changes
  useEffect(() => {
    const tmpl = templates.find(t => t.id === templateId);
    setSteps(tmpl ? tmpl.steps.map(s => ({ ...s })) : []);
  }, [templateId, templates]);

  const selectedEmp = MOCK_EMPLOYEES.find(e => e.id === empId)!;

  const handleSubmit = async () => {
    if (!templateId || !empId || steps.length === 0) return;
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
      steps,
      dueDate || undefined,
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
          <select className={styles.select} value={empId} onChange={e => setEmpId(e.target.value)}>
            {MOCK_EMPLOYEES.map(e => (
              <option key={e.id} value={e.id}>{e.name} — {e.divName}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Шаблон онбординга
          <select className={styles.select} value={templateId} onChange={e => setTemplateId(e.target.value)}>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Срок завершения онбординга
          <input
            type="date"
            className={styles.select}
            value={dueDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setDueDate(e.target.value)}
          />
        </label>

        <StepEditor steps={steps} onChange={setSteps} />

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
          <button
            className={styles.submitBtn}
            onClick={() => void handleSubmit()}
            disabled={!templateId || !empId || steps.length === 0 || submitting}
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

const DIVISIONS = [
  { id: 'div-sales',   name: 'Отдел продаж',                 deptId: 'dept-sales',      deptName: 'Департамент продаж' },
  { id: 'div-supply',  name: 'Отдел обеспечения продаж',    deptId: 'dept-sales',      deptName: 'Департамент продаж' },
  { id: 'div-meat',    name: 'Отдел мясной промышленности', deptId: 'dept-monitoring', deptName: 'Департамент мониторинга' },
  { id: 'div-retail',  name: 'Отдел сетевого ретейла',      deptId: 'dept-monitoring', deptName: 'Департамент мониторинга' },
];

function TemplateModal({ initial, onClose }: TemplateModalProps) {
  const { createTemplate, updateTemplate } = useOnboarding();
  const { user } = useUser();
  const isEditing = !!initial;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [divisionId, setDivisionId] = useState(initial?.targetDivisionId ?? '');
  const [status, setStatus] = useState<'draft' | 'active'>(initial?.status ?? 'draft');
  const [steps, setSteps] = useState<OnboardingStep[]>(initial?.steps ?? []);
  const [submitting, setSubmitting] = useState(false);

  const selectedDiv = DIVISIONS.find(d => d.id === divisionId);

  const handleSubmit = async () => {
    if (!title.trim() || steps.length === 0) return;
    setSubmitting(true);
    const dto: Omit<OnboardingTemplate, 'id' | 'createdAt'> = {
      title: title.trim(),
      description: description.trim(),
      targetDivisionId: selectedDiv?.id ?? null,
      targetDivisionName: selectedDiv?.name ?? null,
      targetDepartmentId: selectedDiv?.deptId ?? null,
      targetDepartmentName: selectedDiv?.deptName ?? null,
      targetRole: null,
      steps,
      createdBy: user.id,
      status,
    };
    if (isEditing && initial) {
      await updateTemplate(initial.id, dto);
    } else {
      await createTemplate(dto);
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isEditing ? 'Редактировать шаблон' : 'Создать шаблон онбординга'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <label className={styles.label}>
          Название шаблона *
          <input
            className={styles.select}
            placeholder="Например: Онбординг отдела продаж"
            value={title}
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

        <label className={styles.label}>
          Подразделение (необязательно)
          <select className={styles.select} value={divisionId} onChange={e => setDivisionId(e.target.value)}>
            <option value="">Для всех подразделений</option>
            {DIVISIONS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Статус
          <select className={styles.select} value={status} onChange={e => setStatus(e.target.value as 'draft' | 'active')}>
            <option value="draft">Черновик</option>
            <option value="active">Активный</option>
          </select>
        </label>

        <StepEditor steps={steps} onChange={setSteps} />

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
          <button
            className={styles.submitBtn}
            onClick={() => void handleSubmit()}
            disabled={!title.trim() || steps.length === 0 || submitting}
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
function TemplatesTab() {
  const { templates } = useOnboarding();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OnboardingTemplate | null>(null);

  return (
    <div>
      <div className={styles.templatesHeader}>
        <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          {templates.length} шаблонов
        </span>
        <button className={styles.createTmplBtn} onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> Создать шаблон
        </button>
      </div>

      {templates.length === 0 ? (
        <div className={styles.listEmpty} style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
          <LayoutTemplate size={36} style={{ opacity: 0.25, display: 'block', margin: '0 auto 0.75rem' }} />
          Шаблонов пока нет — создайте первый
        </div>
      ) : (
        <div className={styles.templatesGrid}>
          {templates.map(tmpl => {
            const activeCount = tmpl.steps.filter(s => s.required).length;
            return (
              <div key={tmpl.id} className={styles.tmplCard}>
                <div className={styles.tmplCardHeader}>
                  <span className={styles.tmplTitle}>{tmpl.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`${styles.tmplStatusBadge} ${tmpl.status === 'active' ? styles.tmplStatusActive : styles.tmplStatusDraft}`}>
                      {tmpl.status === 'active' ? 'Активный' : 'Черновик'}
                    </span>
                    <button
                      className={styles.stepEditBtn}
                      title="Редактировать шаблон"
                      onClick={() => setEditTarget(tmpl)}
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>
                {tmpl.description && (
                  <span className={styles.tmplDesc}>{tmpl.description}</span>
                )}
                <div className={styles.tmplMeta}>
                  {tmpl.targetDivisionName && (
                    <span className={styles.tmplTargetBadge}>{tmpl.targetDivisionName}</span>
                  )}
                  {tmpl.targetDepartmentName && !tmpl.targetDivisionName && (
                    <span className={styles.tmplTargetBadge}>{tmpl.targetDepartmentName}</span>
                  )}
                  <span className={styles.tmplStepsCount}>
                    {tmpl.steps.length} шагов · {activeCount} обязательных
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {createOpen && <TemplateModal onClose={() => setCreateOpen(false)} />}
      {editTarget && <TemplateModal initial={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  );
}

// ── Главная страница ─────────────────────────────────────────────
type PageTab = 'assignments' | 'templates';

export function OnboardingManagePage() {
  const { managedAssignments, isLoading } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pageTab, setPageTab] = useState<PageTab>('assignments');

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
            Прогресс сотрудников, их отзывы по шагам и чат — всё на одном экране.
          </p>
        </div>
        {pageTab === 'assignments' && (
          <button className={styles.assignBtn} onClick={() => setAssignOpen(true)}>
            <UserPlus size={16} /> Назначить онбординг
          </button>
        )}
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

      {pageTab === 'templates' ? (
        <TemplatesTab />
      ) : (
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
      )}

      {assignOpen && <AssignModal onClose={() => setAssignOpen(false)} />}
    </div>
  );
}
