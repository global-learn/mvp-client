import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, ChevronDown, ChevronUp, BookOpen, ClipboardList, Clock, XCircle, Users, Building2, Target, UserCircle2, Trash2, Archive, ArchiveRestore, BarChart3, Pencil, ImagePlus, Wand2, X as XIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, canControl, canAssignCourse } from '@entities/user/model/types';
import { employeeApi } from '@entities/user/api/employeeApi';
import type { Course, LessonContent, TestContent, EnrollmentRequest, Enrollment } from '@entities/course/model/types';
import { getAllItems, COURSE_TYPE_LABELS } from '@entities/course/model/types';
import { useCourseQuery, useCoverUrl, useTestDefinitionQuery, useCourseAnalyticsQuery } from '@entities/course/api/hooks';
import { useDepartmentsQuery, useDivisionsQuery } from '@entities/company/api/hooks';
import { testAttemptApi, courseWriteApi } from '@entities/course/api/courseRealApi';
import { queryKeys } from '@shared/lib/query/queryKeys';
import { toast } from '@shared/lib/toast';
import { AssignCourseModal } from '@features/assign-course/ui/AssignCourseModal';
import { CompletionModal } from './CompletionModal'
import styles from './CourseDetail.module.css';

// ─────────────────────────────────────────────────────────
// Рендер текста урока: простой Markdown → HTML-like
// ─────────────────────────────────────────────────────────
function LessonText({ content }: { content: string }) {
  const html = useMemo(() => {
    let s = content
      // code blocks
      .replace(/```[\w]*\n([\s\S]*?)```/g, (_m, code: string) =>
        `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
      // inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // list items
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // double newline → paragraph break (skip inside pre)
      .replace(/\n\n/g, '<br/><br/>');
    return s;
  }, [content]);
  return (
    <div
      className={styles.lessonContent}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Плеер урока
// ─────────────────────────────────────────────────────────
function LessonViewer({
  item, isDone, onComplete,
}: {
  item: LessonContent;
  isDone: boolean;
  onComplete: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  const handleDone = async () => {
    setPending(true);
    await onComplete();
    setPending(false);
  };

  return (
    <>
      <span className={styles.contentTypeBadge}>Урок</span>
      <LessonText content={item.content} />
      <div style={{ marginTop: '1.75rem' }}>
        {isDone ? (
          <div className={styles.doneBanner}>
            <CheckCircle2 size={16} /> Урок пройден
          </div>
        ) : (
          <button className={styles.markDoneBtn} onClick={() => void handleDone()} disabled={pending}>
            {pending ? 'Сохраняем...' : '✓ Отметить как пройденный'}
          </button>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Плеер теста
// ─────────────────────────────────────────────────────────
type TestState = 'answering' | 'passed' | 'failed';

function TestPlayer({
  item, isDone, onComplete,
}: {
  item: TestContent;
  isDone: boolean;
  onComplete: () => Promise<void>;
}) {
  const needsLoad = item.questions.length === 0 && !!item.testId;
  const { data: testDef, isLoading: questionsLoading } = useTestDefinitionQuery(
    needsLoad ? item.testId : undefined,
  );
  const questions = needsLoad ? (testDef?.questions ?? []) : item.questions;
  const passingPercent = (needsLoad && testDef) ? testDef.passingPercent : item.passingPercent;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, setState] = useState<TestState>(isDone ? 'passed' : 'answering');
  const [score, setScore] = useState(0);
  const [pending, setPending] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const allAnswered = questions.every(q => answers[q.id]);

  // Start attempt when test becomes ready (not if already done)
  useEffect(() => {
    if (!item.testId || isDone || state !== 'answering') return;
    testAttemptApi.start(item.testId)
      .then(id => setAttemptId(id))
      .catch(() => { /* attempt will be started on retry if this fails */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.testId]);

  const handleSubmit = async () => {
    if (!attemptId) {
      toast.error('Не удалось начать тест — попробуйте перезагрузить страницу');
      return;
    }
    setPending(true);
    try {
      await Promise.all(
        questions.map(q => {
          const chosenId = answers[q.id];
          const chosenOpt = q.options.find(o => o.id === chosenId);
          if (!chosenId || !chosenOpt) return Promise.resolve();
          return testAttemptApi.answer(attemptId, q.id, chosenId, chosenOpt.text);
        }),
      );

      const result = await testAttemptApi.finish(attemptId);
      setScore(result.score);

      if (result.isPassed) {
        setState('passed');
        if (!isDone) await onComplete();
      } else {
        setState('failed');
      }
    } catch (err) {
      toast.apiError(err, 'Не удалось отправить ответы');
    } finally {
      setPending(false);
    }
  };

  const handleRetry = async () => {
    setAnswers({});
    setState('answering');
    if (item.testId) {
      const id = await testAttemptApi.start(item.testId).catch(() => null);
      setAttemptId(id);
    }
  };

  if (isDone && state !== 'passed') {
    setState('passed');
  }

  if (questionsLoading) {
    return <div style={{ padding: '2rem', color: 'var(--muted-foreground)' }}>Загрузка теста...</div>;
  }

  return (
    <>
      <span className={styles.contentTypeBadge}>Тест · минимум {passingPercent}% правильных</span>

      {questions.length === 0 && (
        <p style={{ color: 'var(--muted-foreground)', padding: '1rem 0' }}>Вопросы не найдены.</p>
      )}

      {questions.map((q, qi) => {
        const isSubmitted = state !== 'answering';
        return (
          <div key={q.id} className={styles.testQuestion}>
            <p className={styles.testQuestionText}>{qi + 1}. {q.question}</p>
            <div className={styles.testOptions}>
              {q.options.map(opt => {
                const selected = answers[q.id] === opt.id;
                let cls = styles.testOption;
                if (isSubmitted) {
                  if (opt.isCorrect) cls += ' ' + styles.optionCorrect;
                  else if (selected && !opt.isCorrect) cls += ' ' + styles.optionWrong;
                } else if (selected) {
                  cls += ' ' + styles.optionSelected;
                }
                return (
                  <button
                    key={opt.id}
                    className={cls}
                    disabled={isSubmitted}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                  >
                    <input
                      type="radio"
                      readOnly
                      checked={selected}
                      style={{ pointerEvents: 'none' }}
                    />
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {state === 'answering' && (
        <button
          className={styles.testSubmitBtn}
          disabled={!allAnswered || pending}
          onClick={() => void handleSubmit()}
        >
          {pending ? 'Проверяем...' : 'Отправить ответы'}
        </button>
      )}

      {state === 'passed' && (
        <div className={`${styles.testResult} ${styles.testResultPass}`}>
          ✓ Тест пройден{score > 0 ? ` — ${score}%` : ''}!
        </div>
      )}

      {state === 'failed' && (
        <div className={`${styles.testResult} ${styles.testResultFail}`}>
          ✗ Не пройден — {score}% (нужно {passingPercent}%). Попробуйте ещё раз.
          <button className={styles.retryBtn} onClick={() => void handleRetry()}>Попробовать снова</button>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Панель статистики курса (для canControl-пользователей)
// ─────────────────────────────────────────────────────────
function CourseStatsPanel({ courseId, getCourseEnrollments }: {
  courseId: string;
  getCourseEnrollments: (id: string) => Promise<Enrollment[]>;
}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<Record<string, { name: string; departmentName: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void getCourseEnrollments(courseId).then(async data => {
      setEnrollments(data);
      const uniqueIds = [...new Set([
        ...data.map(e => e.userId),
        ...data.flatMap(e => e.assignedBy ? [e.assignedBy] : []),
      ])];
      const info: Record<string, { name: string; departmentName: string }> = {};
      await Promise.allSettled(
        uniqueIds.map(async id => {
          try {
            const emp = await employeeApi.getById(id);
            info[id] = { name: emp.fullname, departmentName: emp.department.name };
          } catch {
            info[id] = { name: id, departmentName: '—' };
          }
        }),
      );
      setEmployeeInfo(info);
      setLoading(false);
    });
  }, [courseId, getCourseEnrollments]);

  const statusLabel: Record<string, { text: string; cls: string }> = {
    in_progress:      { text: 'В процессе',    cls: styles.statsBadgeProgress },
    completed:        { text: 'Завершён',       cls: styles.statsBadgeDone },
    pending_approval: { text: 'Ожидает',        cls: styles.statsBadgePending },
    not_enrolled:     { text: 'Не записан',     cls: styles.statsBadgeNone },
    rejected:         { text: 'Отклонён',       cls: styles.statsBadgeRejected },
  };

  const counts = {
    total:    enrollments.length,
    done:     enrollments.filter(e => e.status === 'completed').length,
    progress: enrollments.filter(e => e.status === 'in_progress').length,
    pending:  enrollments.filter(e => e.status === 'pending_approval').length,
  };

  return (
    <div className={styles.statsPanel}>
      <h3 className={styles.statsPanelTitle}>
        <Users size={16} /> Статистика прохождения
      </h3>

      {/* Итоги */}
      <div className={styles.statsCards}>
        <div className={styles.statsCard}>
          <div className={styles.statsCardNum}>{counts.total}</div>
          <div className={styles.statsCardLabel}>Записаны</div>
        </div>
        <div className={styles.statsCard}>
          <div className={`${styles.statsCardNum} ${styles.statsCardNumDone}`}>{counts.done}</div>
          <div className={styles.statsCardLabel}>Завершили</div>
        </div>
        <div className={styles.statsCard}>
          <div className={`${styles.statsCardNum} ${styles.statsCardNumProgress}`}>{counts.progress}</div>
          <div className={styles.statsCardLabel}>В процессе</div>
        </div>
        <div className={styles.statsCard}>
          <div className={`${styles.statsCardNum} ${styles.statsCardNumPending}`}>{counts.pending}</div>
          <div className={styles.statsCardLabel}>Ожидают</div>
        </div>
      </div>

      {/* Список */}
      {loading ? (
        <p className={styles.statsEmpty}>Загрузка...</p>
      ) : enrollments.length === 0 ? (
        <p className={styles.statsEmpty}>Никто ещё не записан на этот курс.</p>
      ) : (
        <div className={styles.statsTable}>
          {enrollments.map(e => {
            const info = employeeInfo[e.userId];
            const name = info?.name ?? e.userId;
            const department = info?.departmentName ?? '—';
            const badge = statusLabel[e.status] ?? { text: e.status, cls: '' };
            const enrollDate = e.enrolledAt
              ? new Date(e.enrolledAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—';
            const assignerInfo = e.assignedBy ? (employeeInfo[e.assignedBy]?.name ?? e.assignedBy) : null;
            return (
              <div key={`${e.courseId}-${e.userId}`} className={styles.statsRow}>
                <div className={styles.statsAvatar}>{name[0]}</div>
                <div className={styles.statsInfo}>
                  <div className={styles.statsName}>{name}</div>
                  <div className={styles.statsMeta}>
                    {department}
                    {assignerInfo && <span className={styles.statsAssignedBy}> · Назначил: {assignerInfo}</span>}
                    <span className={styles.statsDate}> · {enrollDate}</span>
                  </div>
                </div>
                <div className={styles.statsRight}>
                  <span className={`${styles.statsBadge} ${badge.cls}`}>{badge.text}</span>
                  <div className={styles.statsProgressWrap}>
                    <div className={styles.statsProgressBar}>
                      <div className={styles.statsProgressFill} style={{ width: `${e.progress}%` }} />
                    </div>
                    <span className={styles.statsProgressPct}>{e.progress}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Основная страница
// ─────────────────────────────────────────────────────────
type GenTestTarget =
  | { type: 'course' }
  | { type: 'module'; moduleId: string; moduleName: string };

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    courses, getEnrollment, enroll, requestEnrollment,
    getCourseRequests, approveEnrollmentRequest, rejectEnrollmentRequest,
    markItemComplete, certificates, isLoading, getCourseEnrollments,
    deleteCourse, archiveCourse, unarchiveCourse, updateCourse,
  } = useCourses();
  const { user } = useUser();

  // Full course (with modules) from dedicated query; list course is summary-only
  const { data: fullCourse, isLoading: courseLoading } = useCourseQuery(id ?? '');

  // Merge: use full course if loaded, fall back to list summary
  const listCourse = courses.find(c => c.id === id);
  const course = fullCourse ?? listCourse;

  const { data: coverUrl } = useCoverUrl(course?.coverId);

  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Generate test modal state
  const [genTarget, setGenTarget] = useState<GenTestTarget | null>(null);
  const [genCount, setGenCount] = useState('');
  const [genPassing, setGenPassing] = useState('80');
  const [genModuleId, setGenModuleId] = useState('');
  const [generating, setGenerating] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editScope, setEditScope] = useState<'ALL' | 'DEPARTMENT' | 'DIVISION'>('ALL');
  const [editDeptId, setEditDeptId] = useState('');
  const [editDivId, setEditDivId] = useState('');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

  const { data: deptPage } = useDepartmentsQuery({ limit: 200 });
  const { data: divPage }  = useDivisionsQuery({ limit: 200 });
  const departments = deptPage?.data ?? [];
  const divisions   = divPage?.data  ?? [];
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completionOpen, setCompletionOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<EnrollmentRequest[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const isController = canControl(user);
  const isAuthor = course?.authorId === user.id || course?.authorId === user.employee?.id;
  const canDelete = isAdmin(user) || isAuthor;
  const isArchived = course?.status === 'archived';

  const { data: analyticsData } = useCourseAnalyticsQuery(id ?? '', isController && !isLoading && !courseLoading && !!course);

  // Expand all modules by default once full course (with modules) loads
  useEffect(() => {
    if (!course?.modules?.length) return;
    setExpandedModules(new Set(course.modules.map(m => m.id)));
  }, [course?.id, course?.modules?.length]);

  // Load pending enrollment requests for managers
  useEffect(() => {
    if (!isController || !id) return;
    void getCourseRequests(id).then(setPendingRequests);
  }, [isController, id, getCourseRequests]);

  const enrollment  = course ? getEnrollment(course.id) : undefined;
  const completedSet = useMemo(() => {
    const set = new Set(enrollment?.completedItems ?? []);
    course?.modules?.forEach(mod => mod.steps.forEach(step => {
      if (step.isCompleted) set.add(step.id);
    }));
    return set;
  }, [enrollment?.completedItems, course?.modules]);

  if (isLoading || courseLoading) return <div className={styles.loading}>Загрузка...</div>;

  if (!course) {
    return (
      <div className={styles.notFound}>
        <p className={styles.notFoundText}>Курс не найден</p>
        <Link to="/courses" className={styles.backLink}>← Все курсы</Link>
      </div>
    );
  }

  const enrollStatus = enrollment?.status ?? 'not_enrolled';
  const isEnrolled   = enrollStatus === 'in_progress' || enrollStatus === 'completed';
  const isPending    = enrollStatus === 'pending_approval';
  const isRejected   = enrollStatus === 'rejected';
  const isCompleted  = enrollStatus === 'completed';
  const allItems     = getAllItems(course);

  // Когда плеер открыт — скрываем шапку курса
  const isPlaying = playerOpen && isEnrolled;

  // ── Навигация по дереву ──────────────────────────────────
  const firstUndone = allItems.find(item => !completedSet.has(item.id));
  const activeItemId = selectedItemId ?? firstUndone?.id ?? allItems[0]?.id ?? null;
  const activeItem   = allItems.find(i => i.id === activeItemId) ?? null;

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  };

  // ── Подача заявки (обычный пользователь) ─────────────────
  const handleRequestEnrollment = async () => {
    setActionPending(true);
    await requestEnrollment(course.id);
    setActionPending(false);
  };

  // ── Прямая запись (admin назначает себя напрямую) ─────────
  const handleEnrollDirect = async () => {
    setActionPending(true);
    await enroll(course.id);
    setActionPending(false);
    setPlayerOpen(true);
  };

  // ── Завершение элемента ───────────────────────────────────
  const handleItemComplete = async (itemId: string) => {
    const wasCompleted = enrollment?.status === 'completed';
    const updated = await markItemComplete(course.id, itemId);
    if (updated.status === 'completed' && !wasCompleted) {
      setCompletionOpen(true);
      return;
    }
    const idx = allItems.findIndex(i => i.id === itemId);
    const next = allItems.slice(idx + 1).find(i => !completedSet.has(i.id) && i.id !== itemId);
    if (next) setSelectedItemId(next.id);
  };

  // ── Удаление курса ───────────────────────────────────────
  const handleDelete = async () => {
    if (!course) return;
    setDeleting(true);
    try {
      await deleteCourse(course.id);
      navigate('/courses');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  // ── Архивация ─────────────────────────────────────────────
  const handleArchiveToggle = async () => {
    if (!course) return;
    setArchiving(true);
    try {
      if (isArchived) {
        await unarchiveCourse(course.id);
      } else {
        await archiveCourse(course.id);
      }
    } finally {
      setArchiving(false);
    }
  };

  // ── Открыть редактирование ───────────────────────────────
  const handleOpenEdit = () => {
    if (!course) return;
    setEditTitle(course.title);
    setEditDescription(course.description);
    const scope =
      course.targetDivisionId   ? 'DIVISION'
      : course.targetDepartmentId ? 'DEPARTMENT'
      : 'ALL';
    setEditScope(scope);
    setEditDeptId(course.targetDepartmentId ?? '');
    setEditDivId(course.targetDivisionId ?? '');
    setEditCoverFile(null);
    setEditCoverPreview(null);
    setEditMode(true);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setEditCoverFile(file);
    setEditCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSaveEdit = async () => {
    if (!course || !editTitle.trim()) return;
    setSaving(true);
    try {
      await updateCourse(
        course.id,
        {
          name:         editTitle.trim(),
          description:  editDescription.trim(),
          scope:        editScope,
          departmentId: editScope !== 'ALL' ? (editDeptId || null) : null,
          divisionId:   editScope === 'DIVISION' ? (editDivId || null) : null,
        },
        editCoverFile ?? undefined,
      );
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Генерация теста ──────────────────────────────────────
  const openGenCourse = () => {
    setGenTarget({ type: 'course' });
    setGenCount('');
    setGenPassing('80');
    setGenModuleId(course?.modules?.[0]?.id ?? '');
  };

  const openGenModule = (moduleId: string, moduleName: string) => {
    setGenTarget({ type: 'module', moduleId, moduleName });
    setGenCount('');
    setGenPassing('80');
  };

  const handleGenerate = async () => {
    if (!course || !genTarget) return;
    const count        = genCount.trim() ? parseInt(genCount, 10) : undefined;
    const passingPct   = genPassing.trim() ? parseInt(genPassing, 10) : 80;
    if (count !== undefined && (isNaN(count) || count < 1)) {
      toast.error('Укажите корректное количество вопросов');
      return;
    }

    setGenerating(true);
    try {
      if (genTarget.type === 'course') {
        if (!genModuleId) { toast.error('Выберите модуль'); return; }
        const testId = await courseWriteApi.generateCourseTest(course.id, { count, passingPercent: passingPct });
        await courseWriteApi.addStep(course.id, genModuleId, {
          name:   `Итоговый тест по ${course.title}`,
          type:   'TEST',
          testId,
        });
        toast.success('Итоговый тест создан и добавлен в модуль');
      } else {
        const testId = await courseWriteApi.generateModuleTest(course.id, genTarget.moduleId, { count, passingPercent: passingPct });
        await courseWriteApi.addStep(course.id, genTarget.moduleId, {
          name:   `Итоговый тест по модулю «${genTarget.moduleName}»`,
          type:   'TEST',
          testId,
        });
        toast.success('Тест по модулю создан и добавлен');
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(course.id) });
      setGenTarget(null);
    } catch (err) {
      toast.apiError(err, 'Не удалось создать тест');
    } finally {
      setGenerating(false);
    }
  };

  // ── Одобрение/отклонение заявок ──────────────────────────
  const handleApproveRequest = async (req: EnrollmentRequest) => {
    setApprovingId(req.userId);
    await approveEnrollmentRequest(course.id, req.userId);
    setPendingRequests(prev => prev.filter(r => r.userId !== req.userId));
    setApprovingId(null);
  };

  const handleRejectRequest = async (req: EnrollmentRequest) => {
    setRejectingId(req.userId);
    await rejectEnrollmentRequest(course.id, req.userId);
    setPendingRequests(prev => prev.filter(r => r.userId !== req.userId));
    setRejectingId(null);
  };

  const pageClass = isPlaying ? styles.pageWide : styles.page;

  return (
    <div className={pageClass}>
      <Link to="/courses" className={styles.backLink}>← Все курсы</Link>

      {/* ── Шапка курса — скрывается во время просмотра ── */}
      {!isPlaying && (
        <>
          {coverUrl && (
            <div className={styles.coverBanner}>
              <img src={coverUrl} alt={course.title} className={styles.coverBannerImg} />
            </div>
          )}

          <div className={styles.titleRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
              <h1 className={styles.title}>{course.title}</h1>
              {isArchived && (
                <span className={styles.archivedBadge}>
                  <Archive size={12} /> Архив
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
              {canAssignCourse(user) && !isArchived && (
                <button className={styles.assignBtn} onClick={() => setAssignOpen(true)}>
                  Назначить сотрудникам
                </button>
              )}
              {canDelete && !isArchived && !editMode && (
                <button className={styles.editBtn} onClick={handleOpenEdit}>
                  <Pencil size={14} /> Редактировать
                </button>
              )}
              {canDelete && !isArchived && !editMode && (
                <button className={styles.genTestBtn} onClick={openGenCourse}>
                  <Wand2 size={14} /> Создать итоговый тест
                </button>
              )}
              {canDelete && (
                <button
                  className={styles.archiveBtn}
                  onClick={() => void handleArchiveToggle()}
                  disabled={archiving}
                  title={isArchived ? 'Восстановить из архива' : 'Архивировать курс'}
                >
                  {isArchived
                    ? <><ArchiveRestore size={15} /> {archiving ? '...' : 'Из архива'}</>
                    : <><Archive size={15} /> {archiving ? '...' : 'В архив'}</>}
                </button>
              )}
              {canDelete && !deleteConfirm && !isArchived && (
                <button
                  className={styles.deleteBtn}
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Trash2 size={15} /> Удалить
                </button>
              )}
              {canDelete && deleteConfirm && (
                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Удалить навсегда?</span>
                  <button
                    className={styles.deleteBtnConfirm}
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                  >
                    {deleting ? '...' : 'Удалить'}
                  </button>
                  <button
                    className={styles.deleteBtnCancel}
                    onClick={() => setDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.meta}>{course.lessonsCount} уроков · {new Date(course.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className={styles.courseTypeBadge}>{COURSE_TYPE_LABELS[course.courseType]}</span>
            {course.targetDepartmentName && (
              <span className={styles.targetBadge}>
                <Building2 size={11} /> {course.targetDepartmentName}
              </span>
            )}
            {course.targetDivisionName && (
              <span className={styles.targetBadge}>
                <Target size={11} /> {course.targetDivisionName}
              </span>
            )}
          </div>

          {/* ── Форма редактирования ── */}
          {editMode && (
            <div className={styles.editForm}>
              <div className={styles.editFormRow}>
                <label className={styles.editLabel}>Название</label>
                <input
                  className={styles.editInput}
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Название курса"
                />
              </div>
              <div className={styles.editFormRow}>
                <label className={styles.editLabel}>Описание</label>
                <textarea
                  className={styles.editTextarea}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={4}
                  placeholder="Описание курса"
                />
              </div>
              <div className={styles.editFormRow}>
                <label className={styles.editLabel}>Аудитория</label>
                <select
                  className={styles.editSelect}
                  value={editScope}
                  onChange={e => {
                    setEditScope(e.target.value as 'ALL' | 'DEPARTMENT' | 'DIVISION');
                    setEditDeptId('');
                    setEditDivId('');
                  }}
                >
                  <option value="ALL">Все сотрудники</option>
                  <option value="DEPARTMENT">Департамент</option>
                  <option value="DIVISION">Отдел</option>
                </select>
              </div>
              {editScope !== 'ALL' && (
                <div className={styles.editFormRow}>
                  <label className={styles.editLabel}>Департамент</label>
                  <select
                    className={styles.editSelect}
                    value={editDeptId}
                    onChange={e => { setEditDeptId(e.target.value); setEditDivId(''); }}
                  >
                    <option value="">— выберите —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {editScope === 'DIVISION' && (
                <div className={styles.editFormRow}>
                  <label className={styles.editLabel}>Отдел</label>
                  <select
                    className={styles.editSelect}
                    value={editDivId}
                    onChange={e => setEditDivId(e.target.value)}
                  >
                    <option value="">— выберите —</option>
                    {(editDeptId
                      ? divisions.filter(d => d.departmentId === editDeptId)
                      : divisions
                    ).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={styles.editFormRow}>
                <label className={styles.editLabel}>Обложка</label>
                <div className={styles.editCoverRow}>
                  <button
                    type="button"
                    className={styles.editCoverBtn}
                    onClick={() => editCoverInputRef.current?.click()}
                  >
                    <ImagePlus size={14} />
                    {editCoverFile ? editCoverFile.name : 'Загрузить новую обложку'}
                  </button>
                  <input
                    ref={editCoverInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleCoverChange}
                  />
                  {editCoverPreview && (
                    <img src={editCoverPreview} className={styles.editCoverPreview} alt="preview" />
                  )}
                </div>
              </div>
              <div className={styles.editFormActions}>
                <button
                  className={styles.editSaveBtn}
                  onClick={() => void handleSaveEdit()}
                  disabled={saving || !editTitle.trim()}
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  className={styles.editCancelBtn}
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* ── Модалка генерации итогового теста (курс) ── */}
          {genTarget?.type === 'course' && (
            <div className={styles.genTestModal}>
              <div className={styles.genTestModalHeader}>
                <span><Wand2 size={15} /> Создать итоговый тест по курсу</span>
                <button className={styles.genTestClose} onClick={() => setGenTarget(null)}><XIcon size={15} /></button>
              </div>
              <p className={styles.genTestHint}>
                Тест будет сформирован из банка вопросов курса и добавлен как шаг в выбранный модуль.
              </p>
              <div className={styles.genTestFields}>
                <div className={styles.genTestField}>
                  <label className={styles.genTestLabel}>Вопросов</label>
                  <input
                    className={styles.genTestInput}
                    type="number"
                    min="1"
                    placeholder="Все"
                    value={genCount}
                    onChange={e => setGenCount(e.target.value)}
                  />
                </div>
                <div className={styles.genTestField}>
                  <label className={styles.genTestLabel}>Порог, %</label>
                  <input
                    className={styles.genTestInput}
                    type="number"
                    min="1"
                    max="100"
                    value={genPassing}
                    onChange={e => setGenPassing(e.target.value)}
                  />
                </div>
                <div className={styles.genTestField} style={{ flex: 2 }}>
                  <label className={styles.genTestLabel}>Добавить в модуль</label>
                  <select
                    className={styles.genTestSelect}
                    value={genModuleId}
                    onChange={e => setGenModuleId(e.target.value)}
                  >
                    <option value="">— выберите модуль —</option>
                    {course.modules.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.genTestActions}>
                <button
                  className={styles.genTestSubmit}
                  onClick={() => void handleGenerate()}
                  disabled={generating || !genModuleId}
                >
                  {generating ? 'Генерируем...' : 'Создать тест'}
                </button>
                <button className={styles.genTestCancel} onClick={() => setGenTarget(null)} disabled={generating}>
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Описание + автор */}
          {!editMode && <div className={styles.descriptionCard}>
            <div className={styles.descriptionCardInner}>
              <div className={styles.descriptionBody}>
                <h2 className={styles.descriptionTitle}>О курсе</h2>
                <p className={styles.descriptionText}>{course.description}</p>
              </div>
              <div className={styles.authorBlock}>
                {(() => {
                  const authorName = course.authorName ?? course.authorId;
                  const initials   = authorName.split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <>
                      <div className={styles.authorLabel}>
                        <UserCircle2 size={13} /> Автор курса
                      </div>
                      <div className={styles.authorChip}>
                        <div className={styles.authorAvatar}>{initials}</div>
                        <div className={styles.authorInfo}>
                          <span className={styles.authorName}>{authorName}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>}

          {/* ── Программа курса (всегда видна если есть модули) ── */}
          {course.modules && course.modules.length > 0 && (
            <div className={styles.outlinePanel}>
              <h3 className={styles.outlinePanelTitle}>
                <BookOpen size={15} /> Программа курса
              </h3>
              <div className={styles.outlineModules}>
                {course.modules.map((mod, mi) => {
                  const modTotal     = mod.totalSteps ?? mod.steps.length;
                  const modCompleted = mod.completedSteps ?? mod.steps.filter(s => s.isCompleted).length;
                  const modPct       = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;
                  const modDone      = modTotal > 0 && modCompleted >= modTotal;
                  const isModOpen    = expandedModules.has(mod.id);
                  return (
                    <div key={mod.id} className={styles.outlineModule}>
                      <div className={styles.outlineModuleRow}>
                        <button
                          className={styles.outlineModuleHeader}
                          onClick={() => toggleModule(mod.id)}
                        >
                          <span className={styles.outlineModuleNum}>{mi + 1}</span>
                          <span className={styles.outlineModuleName}>{mod.title}</span>
                          <div className={styles.outlineModuleMeta}>
                            {isEnrolled && (
                              <span className={modDone ? styles.outlineModuleProgDone : styles.outlineModuleProg}>
                                {modDone ? '✓' : `${modCompleted}/${modTotal}`}
                              </span>
                            )}
                            {!isEnrolled && (
                              <span className={styles.outlineModuleStepCount}>{modTotal} шагов</span>
                            )}
                            {isModOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </button>
                        {canDelete && !isArchived && (
                          <button
                            className={styles.moduleGenBtn}
                            title="Создать тест по модулю"
                            onClick={() => openGenModule(mod.id, mod.title)}
                          >
                            <Wand2 size={13} />
                          </button>
                        )}
                      </div>
                      {isModOpen && (
                        <div className={styles.outlineSteps}>
                          {mod.steps.map((step, si) => {
                            const done = step.isCompleted ?? completedSet.has(step.id);
                            return (
                              <button
                                key={step.id}
                                className={`${styles.outlineStep} ${done ? styles.outlineStepDone : ''}`}
                                onClick={() => {
                                  if (isEnrolled) {
                                    setSelectedItemId(step.items[0]?.id ?? null);
                                    setPlayerOpen(true);
                                  }
                                }}
                                disabled={!isEnrolled}
                              >
                                <span className={styles.outlineStepIcon}>
                                  {done
                                    ? <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                                    : step.type === 'test'
                                      ? <ClipboardList size={14} />
                                      : <BookOpen size={14} />}
                                </span>
                                <span className={styles.outlineStepName}>{si + 1}. {step.title}</span>
                                <span className={styles.outlineStepType}>
                                  {step.type === 'test' ? 'Тест' : 'Урок'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isController && (
            <>
              <CourseStatsPanel
                courseId={course.id}
                getCourseEnrollments={getCourseEnrollments}
              />
              {analyticsData && (analyticsData.byDivision.length > 0 || analyticsData.byDepartment.length > 0) && (
                <div className={styles.analyticsPanel}>
                  <h3 className={styles.statsPanelTitle}>
                    <BarChart3 size={16} /> Аналитика по подразделениям
                  </h3>
                  {analyticsData.byDepartment.length > 0 && (
                    <div className={styles.analyticsGroup}>
                      <div className={styles.analyticsGroupTitle}>По департаментам</div>
                      {analyticsData.byDepartment.map(d => (
                        <div key={d.departmentId} className={styles.analyticsRow}>
                          <span className={styles.analyticsName}>{d.departmentName}</span>
                          <div className={styles.analyticsBarWrap}>
                            <div className={styles.analyticsBar}>
                              <div className={styles.analyticsBarFill} style={{ width: `${d.completionRate}%` }} />
                            </div>
                            <span className={styles.analyticsPct}>{Math.round(d.completionRate)}%</span>
                          </div>
                          <span className={styles.analyticsMeta}>{d.completed}/{d.total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {analyticsData.byDivision.length > 0 && (
                    <div className={styles.analyticsGroup}>
                      <div className={styles.analyticsGroupTitle}>По отделам</div>
                      {analyticsData.byDivision.map(d => (
                        <div key={d.divisionId} className={styles.analyticsRow}>
                          <span className={styles.analyticsName}>{d.divisionName}</span>
                          <div className={styles.analyticsBarWrap}>
                            <div className={styles.analyticsBar}>
                              <div className={styles.analyticsBarFill} style={{ width: `${d.completionRate}%` }} />
                            </div>
                            <span className={styles.analyticsPct}>{Math.round(d.completionRate)}%</span>
                          </div>
                          <span className={styles.analyticsMeta}>{d.completed}/{d.total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Прогресс (только если идёт прохождение) */}
          {isEnrolled && (
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>
                  Пройдено {completedSet.size} из {allItems.length} элементов
                </span>
                <span className={styles.progressValue}>{enrollment?.progress ?? 0}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${enrollment?.progress ?? 0}%` }} />
              </div>
            </div>
          )}

          {/* ── Панель одобрения для руководителей ── */}
          {isController && (
            <div className={styles.approvalPanel}>
              <h3 className={styles.approvalPanelTitle}>
                <Users size={16} /> Заявки на прохождение
                {pendingRequests.length > 0 && (
                  <span style={{ marginLeft: '0.375rem', background: 'var(--primary)', color: '#fff', borderRadius: '3px', padding: '0 6px', fontSize: '0.75rem' }}>
                    {pendingRequests.length}
                  </span>
                )}
              </h3>
              {pendingRequests.length === 0 ? (
                <p className={styles.approvalPanelEmpty}>Нет ожидающих заявок</p>
              ) : (
                pendingRequests.map(req => (
                  <div key={req.userId} className={styles.approvalRequestRow}>
                    <div className={styles.approvalRequestAvatar}>
                      {(req.userName || req.userEmail)[0].toUpperCase()}
                    </div>
                    <div className={styles.approvalRequestInfo}>
                      <div className={styles.approvalRequestName}>{req.userName}</div>
                      <div className={styles.approvalRequestMeta}>
                        {req.userEmail} · {new Date(req.requestedAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className={styles.approvalActions}>
                      <button
                        className={styles.approveBtn}
                        onClick={() => void handleApproveRequest(req)}
                        disabled={approvingId === req.userId || rejectingId === req.userId}
                      >
                        <CheckCircle2 size={14} />
                        {approvingId === req.userId ? '...' : 'Одобрить'}
                      </button>
                      <button
                        className={styles.rejectReqBtn}
                        onClick={() => void handleRejectRequest(req)}
                        disabled={approvingId === req.userId || rejectingId === req.userId}
                      >
                        <XCircle size={14} />
                        {rejectingId === req.userId ? '...' : 'Отклонить'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Кнопки / статусы записи ── */}

          {/* Не записан — подать заявку */}
          {enrollStatus === 'not_enrolled' && !isAdmin(user) && (
            <button
              className={styles.requestBtn}
              onClick={() => void handleRequestEnrollment()}
              disabled={actionPending}
            >
              <Clock size={18} />
              {actionPending ? 'Отправляем...' : 'Подать заявку на прохождение'}
            </button>
          )}

          {/* Admin — записывается напрямую */}
          {enrollStatus === 'not_enrolled' && isAdmin(user) && (
            <button
              className={styles.requestBtn}
              onClick={() => void handleEnrollDirect()}
              disabled={actionPending}
            >
              <Play size={18} />
              {actionPending ? 'Записываем...' : 'Начать курс'}
            </button>
          )}

          {/* Заявка на рассмотрении */}
          {isPending && (
            <div className={styles.pendingBanner}>
              <Clock size={20} className={styles.pendingBannerIcon} />
              <div className={styles.pendingBannerText}>
                <div className={styles.pendingBannerTitle}>Заявка на рассмотрении</div>
                <div className={styles.pendingBannerSub}>
                  Ваша заявка отправлена руководителю. Вы получите доступ после одобрения.
                </div>
              </div>
            </div>
          )}

          {/* Заявка отклонена */}
          {isRejected && (
            <>
              <div className={styles.rejectedBanner}>
                <XCircle size={20} className={styles.rejectedBannerIcon} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>Заявка отклонена</div>
                  <div style={{ fontSize: '0.8125rem', opacity: 0.8 }}>
                    Обратитесь к руководителю или подайте заявку повторно.
                  </div>
                </div>
              </div>
              <button
                className={styles.reRequestBtn}
                onClick={() => void handleRequestEnrollment()}
                disabled={actionPending}
              >
                <Clock size={14} />
                {actionPending ? 'Отправляем...' : 'Подать заявку повторно'}
              </button>
            </>
          )}

          {/* Курс завершён */}
          {isCompleted && !playerOpen && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div className={styles.completedBanner}>
                <CheckCircle2 size={18} /> Курс завершён!
              </div>
              <button className={styles.startBtn} style={{ margin: 0 }} onClick={() => setPlayerOpen(true)}>
                Повторить материал
              </button>
            </div>
          )}

          {/* Курс одобрен — начать/продолжить */}
          {isEnrolled && !isCompleted && !playerOpen && (
            <button className={styles.startBtn} onClick={() => setPlayerOpen(true)}>
              <Play size={18} />
              {completedSet.size === 0 ? 'Начать курс' : 'Продолжить курс'}
            </button>
          )}
        </>
      )}

      {/* ── Плеер ── */}
      {isEnrolled && playerOpen && course.modules && course.modules.length > 0 && (
        <div className={styles.player}>
          {/* Дерево модулей */}
          <nav className={styles.tree}>
            <div className={styles.treeTitle}>Содержание курса</div>
            {course.modules.map(mod => {
              const isOpen = expandedModules.has(mod.id);
              return (
                <div key={mod.id} className={styles.treeModule}>
                  <button className={styles.treeModuleBtn} onClick={() => toggleModule(mod.id)}>
                    {mod.title}
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {isOpen && (
                    <div className={styles.treeSteps}>
                      {mod.steps.map(step => (
                        <div key={step.id}>
                          <div className={styles.treeStep}>{step.title}</div>
                          {step.items.map(item => {
                            const done = completedSet.has(item.id);
                            const active = item.id === activeItemId;
                            const cls = [
                              styles.treeItem,
                              active ? styles.treeItemActive : '',
                              done && !active ? styles.treeItemDone : '',
                            ].filter(Boolean).join(' ');
                            return (
                              <button
                                key={item.id}
                                className={cls}
                                onClick={() => setSelectedItemId(item.id)}
                              >
                                <span className={styles.treeItemIcon}>
                                  {done
                                    ? <CheckCircle2 size={13} />
                                    : item.type === 'lesson'
                                      ? <BookOpen size={13} />
                                      : <ClipboardList size={13} />}
                                </span>
                                <span className={styles.treeItemLabel}>{item.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Контентная панель */}
          <div className={styles.contentPane}>
            {activeItem ? (
              <>
                <h2 className={styles.contentTitle}>{activeItem.title}</h2>
                {activeItem.type === 'lesson' ? (
                  <LessonViewer
                    key={activeItem.id}
                    item={activeItem as LessonContent}
                    isDone={completedSet.has(activeItem.id)}
                    onComplete={() => handleItemComplete(activeItem.id)}
                  />
                ) : (
                  <TestPlayer
                    key={activeItem.id}
                    item={activeItem as TestContent}
                    isDone={completedSet.has(activeItem.id)}
                    onComplete={() => handleItemComplete(activeItem.id)}
                  />
                )}
              </>
            ) : (
              <div className={styles.noItemSelected}>
                <CheckCircle2 size={40} style={{ color: '#38a169' }} />
                <p>Все материалы пройдены!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {completionOpen && (
        <CompletionModal
          courseTitle={course.title}
          certificate={certificates.find(c => c.courseId === course.id)}
          onClose={() => setCompletionOpen(false)}
        />
      )}

      {assignOpen && (
        <AssignCourseModal
          courseId={course.id}
          courseTitle={course.title}
          onClose={() => setAssignOpen(false)}
        />
      )}

      {/* ── Модалка генерации теста по модулю ── */}
      {genTarget?.type === 'module' && (
        <div className={styles.genTestOverlay} onClick={() => setGenTarget(null)}>
          <div className={styles.genTestOverlayBox} onClick={e => e.stopPropagation()}>
            <div className={styles.genTestModalHeader}>
              <span><Wand2 size={15} /> Тест по модулю «{genTarget.moduleName}»</span>
              <button className={styles.genTestClose} onClick={() => setGenTarget(null)}><XIcon size={15} /></button>
            </div>
            <p className={styles.genTestHint}>
              Тест будет сформирован из вопросов этого модуля и добавлен последним шагом.
            </p>
            <div className={styles.genTestFields}>
              <div className={styles.genTestField}>
                <label className={styles.genTestLabel}>Вопросов</label>
                <input
                  className={styles.genTestInput}
                  type="number"
                  min="1"
                  placeholder="Все"
                  value={genCount}
                  onChange={e => setGenCount(e.target.value)}
                />
              </div>
              <div className={styles.genTestField}>
                <label className={styles.genTestLabel}>Порог, %</label>
                <input
                  className={styles.genTestInput}
                  type="number"
                  min="1"
                  max="100"
                  value={genPassing}
                  onChange={e => setGenPassing(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.genTestActions}>
              <button
                className={styles.genTestSubmit}
                onClick={() => void handleGenerate()}
                disabled={generating}
              >
                {generating ? 'Генерируем...' : 'Создать тест'}
              </button>
              <button className={styles.genTestCancel} onClick={() => setGenTarget(null)} disabled={generating}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Вспомогательная типизация для Course с modules
type _CourseWithModules = Course & { modules: NonNullable<Course['modules']> };
void (null as unknown as _CourseWithModules);
