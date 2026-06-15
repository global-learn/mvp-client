import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Users, ChevronDown, ChevronRight, X, BookOpen, ClipboardList,
  CheckCircle2, Clock, AlertCircle, Check, Loader2,
} from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useOnboarding } from '@entities/onboarding/model/OnboardingContext';
import { useSubordinateTreeQuery, useTeamDashboardQuery } from '@entities/user/api/employeeHooks';
import { canControl } from '@entities/user/model/types';
import type { SubordinateTreeNodeDto, SubordinateTreeEmployeeDto, SubordinateDashboardItemDto, SubordinateEnrollmentDto } from '@shared/api/schemas';
import { onboardingRealApi } from '@entities/onboarding/api/onboardingRealApi';
import type { OnboardingStep } from '@entities/onboarding/model/types';
import { toast } from '@shared/lib/toast';
import styles from './TeamPage.module.css';

// ── Утилиты ──────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function statusIcon(status: string) {
  if (status === 'COMPLETED' || status === 'completed') return <CheckCircle2 size={13} className={styles.iconDone} />;
  if (status === 'IN_PROGRESS' || status === 'in_progress') return <Clock size={13} className={styles.iconActive} />;
  return <AlertCircle size={13} className={styles.iconPending} />;
}

function statusLabel(status: string): string {
  if (status === 'COMPLETED' || status === 'completed') return 'Завершён';
  if (status === 'IN_PROGRESS' || status === 'in_progress') return 'В процессе';
  return 'Не начат';
}

// ── Прогресс-бар ─────────────────────────────────────────────────

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className={styles.progressRow}>
      {label && <span className={styles.progressLabel}>{label}</span>}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className={styles.progressPct}>{Math.round(value)}%</span>
    </div>
  );
}

// ── Счётчик непрочитанных сотрудников в ноде ─────────────────────

function countEmployees(node: SubordinateTreeNodeDto): number {
  return node.employees.length + node.children.reduce((s, c) => s + countEmployees(c), 0);
}

// ── Дерево-нода ───────────────────────────────────────────────────

interface TreeNodeProps {
  node:       SubordinateTreeNodeDto;
  depth:      number;
  dashMap:    Map<string, SubordinateDashboardItemDto>;
  onSelect:   (emp: SubordinateTreeEmployeeDto, dash: SubordinateDashboardItemDto | undefined) => void;
}

function TreeNode({ node, depth, dashMap, onSelect }: TreeNodeProps) {
  const totalInNode = countEmployees(node);
  const [open, setOpen] = useState(depth === 0);

  const ChevronIcon = open ? ChevronDown : ChevronRight;

  return (
    <div className={styles.treeNode} style={{ '--depth': depth } as React.CSSProperties}>
      <button className={styles.nodeHeader} onClick={() => setOpen(p => !p)}>
        <ChevronIcon size={14} className={styles.chevron} />
        <span className={styles.positionName}>{node.positionName}</span>
        <span className={styles.empCount}>{totalInNode}</span>
      </button>

      {open && (
        <div className={styles.nodeBody}>
          {node.employees.map(emp => {
            const dash = dashMap.get(emp.id);
            const activeCount = dash?.enrollments.filter(e => e.status !== 'COMPLETED').length ?? 0;
            const doneCount = dash?.enrollments.filter(e => e.status === 'COMPLETED').length ?? 0;
            const hasOnboarding = !!dash?.activeOnboarding;
            return (
              <button
                key={emp.id}
                className={styles.empCard}
                onClick={() => onSelect(emp, dash)}
              >
                <div className={styles.empAvatar}>{initials(emp.fullname)}</div>
                <div className={styles.empInfo}>
                  <span className={styles.empName}>{emp.fullname}</span>
                  <span className={styles.empMeta}>{emp.divisionName}</span>
                </div>
                <div className={styles.empStats}>
                  {activeCount > 0 && (
                    <span className={styles.statChip} title="Курсы в процессе">
                      <BookOpen size={11} /> {activeCount}
                    </span>
                  )}
                  {doneCount > 0 && (
                    <span className={`${styles.statChip} ${styles.chipDone}`} title="Курсы завершены">
                      <CheckCircle2 size={11} /> {doneCount}
                    </span>
                  )}
                  {hasOnboarding && (
                    <span className={`${styles.statChip} ${styles.chipOnb}`} title="Онбординг">
                      <ClipboardList size={11} />
                    </span>
                  )}
                </div>
                <ChevronRight size={14} className={styles.empArrow} />
              </button>
            );
          })}
          {node.children.map(child => (
            <TreeNode key={child.positionId} node={child} depth={depth + 1} dashMap={dashMap} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Drawer: назначить курс ────────────────────────────────────────

interface AssignCourseDialogProps {
  employee: SubordinateTreeEmployeeDto;
  onClose:  () => void;
}

// Can this course be assigned to this employee? Mirrors the course scope:
// ALL → anyone; DIVISION → same division; DEPARTMENT → same department.
function courseInScopeForEmployee(
  course: { targetDepartmentId?: string | null; targetDivisionId?: string | null },
  emp: SubordinateTreeEmployeeDto,
): boolean {
  if (!course.targetDepartmentId && !course.targetDivisionId) return true;
  if (course.targetDivisionId) return course.targetDivisionId === emp.divisionId;
  return course.targetDepartmentId === emp.departmentId;
}

function AssignCourseDialog({ employee, onClose }: AssignCourseDialogProps) {
  const employeeId = employee.id;
  const { courses, assignCourse } = useCourses();
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const published = useMemo(
    () => courses
      .filter(c => c.status === 'published')
      .filter(c => courseInScopeForEmployee(c, employee))
      .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase())),
    [courses, employee, search],
  );

  const handleAssign = async (courseId: string) => {
    setAssigning(courseId);
    try {
      await assignCourse(courseId, employeeId);
      setDone(prev => new Set(prev).add(courseId));
      toast.success('Курс назначен');
    } catch {
      /* apiError toast already fired */
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className={styles.dialogOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <h3 className={styles.dialogTitle}>Назначить курс</h3>
          <button className={styles.dialogClose} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.dialogSearch}>
          <input
            className={styles.searchInput}
            placeholder="Поиск курса..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className={styles.dialogList}>
          {published.length === 0 && (
            <p className={styles.dialogEmpty}>Нет доступных курсов</p>
          )}
          {published.map(course => {
            const isDone = done.has(course.id);
            const isBusy = assigning === course.id;
            return (
              <div key={course.id} className={styles.dialogItem}>
                <div className={styles.dialogItemInfo}>
                  <span className={styles.dialogItemName}>{course.title}</span>
                  {course.lessonsCount > 0 && (
                    <span className={styles.dialogItemMeta}>{course.lessonsCount} уроков</span>
                  )}
                </div>
                <button
                  className={`${styles.assignBtn} ${isDone ? styles.assignBtnDone : ''}`}
                  onClick={() => { if (!isDone && !isBusy) void handleAssign(course.id); }}
                  disabled={isDone || isBusy}
                >
                  {isBusy ? <Loader2 size={14} className={styles.spin} /> : isDone ? <Check size={14} /> : 'Назначить'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Drawer: назначить онбординг ───────────────────────────────────

interface AssignOnboardingDialogProps {
  employee: SubordinateTreeEmployeeDto;
  onClose:  () => void;
}

function AssignOnboardingDialog({ employee, onClose }: AssignOnboardingDialogProps) {
  const { templates, assign } = useOnboarding();
  const [templateId, setTemplateId] = useState('');
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const available = templates.filter(t =>
    !t.targetDivisionId || t.targetDivisionId === employee.divisionId,
  );

  useEffect(() => {
    if (available.length > 0 && !templateId) setTemplateId(available[0].id);
  }, [available, templateId]);

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

  const handleSubmit = async () => {
    if (!templateId || steps.length === 0) return;
    setSubmitting(true);
    try {
      await assign(
        templateId,
        employee.id,
        employee.fullname,
        employee.email,
        employee.divisionId,
        employee.divisionName,
        '',
        '',
        steps,
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.dialogOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <h3 className={styles.dialogTitle}>Назначить онбординг</h3>
          <button className={styles.dialogClose} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.dialogBody}>
          <p className={styles.dialogSub}>Сотрудник: <strong>{employee.fullname}</strong></p>
          {available.length === 0 ? (
            <p className={styles.dialogEmpty}>Нет доступных шаблонов для отдела «{employee.divisionName}»</p>
          ) : (
            <>
              <label className={styles.fieldLabel}>
                Шаблон онбординга
                <select
                  className={styles.fieldSelect}
                  value={templateId}
                  onChange={e => setTemplateId(e.target.value)}
                >
                  {available.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </label>
              {stepsLoading && <p className={styles.dialogEmpty}>Загрузка шагов...</p>}
              {!stepsLoading && steps.length > 0 && (
                <p className={styles.stepsInfo}>{steps.length} шагов в шаблоне</p>
              )}
              <button
                className={styles.submitBtn}
                onClick={() => void handleSubmit()}
                disabled={submitting || stepsLoading || steps.length === 0}
              >
                {submitting ? 'Назначаем...' : 'Назначить'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Drawer: профиль сотрудника ────────────────────────────────────

interface EmployeeDrawerProps {
  emp:  SubordinateTreeEmployeeDto;
  dash: SubordinateDashboardItemDto | undefined;
  onClose: () => void;
}

function EmployeeDrawer({ emp, dash, onClose }: EmployeeDrawerProps) {
  const [assignCourseOpen, setAssignCourseOpen] = useState(false);
  const [assignOnbOpen, setAssignOnbOpen]       = useState(false);

  const active    = dash?.enrollments.filter(e => e.status !== 'COMPLETED') ?? [];
  const completed = dash?.enrollments.filter(e => e.status === 'COMPLETED') ?? [];

  return (
    <>
      <div className={styles.drawerBackdrop} onClick={onClose} />
      <aside className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <div className={styles.drawerAvatar}>{initials(emp.fullname)}</div>
          <div className={styles.drawerHeaderInfo}>
            <h2 className={styles.drawerName}>{emp.fullname}</h2>
            <p className={styles.drawerMeta}>{emp.divisionName}</p>
            <p className={styles.drawerEmail}>{emp.email}</p>
          </div>
          <button className={styles.drawerClose} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.drawerBody}>
          {/* Активные курсы */}
          {active.length > 0 && (
            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>
                <Clock size={14} className={styles.iconActive} /> В процессе ({active.length})
              </h3>
              {active.map(e => <EnrollmentRow key={e.enrollmentId} enrollment={e} />)}
            </section>
          )}

          {/* Завершённые курсы */}
          {completed.length > 0 && (
            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>
                <CheckCircle2 size={14} className={styles.iconDone} /> Завершено ({completed.length})
              </h3>
              {completed.map(e => <EnrollmentRow key={e.enrollmentId} enrollment={e} />)}
            </section>
          )}

          {/* Нет курсов */}
          {(dash?.enrollments.length ?? 0) === 0 && (
            <div className={styles.drawerEmpty}>
              <BookOpen size={28} className={styles.drawerEmptyIcon} />
              <p>Нет назначенных курсов</p>
            </div>
          )}

          {/* Онбординг */}
          {dash?.activeOnboarding && (
            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>
                <ClipboardList size={14} /> Онбординг
              </h3>
              <div className={styles.onbCard}>
                <div className={styles.onbHeader}>
                  <span className={styles.onbName}>{dash.activeOnboarding.name}</span>
                  <span className={`${styles.statusBadge} ${
                    dash.activeOnboarding.status === 'COMPLETED' ? styles.badgeDone :
                    dash.activeOnboarding.status === 'IN_PROGRESS' ? styles.badgeActive : styles.badgePending
                  }`}>
                    {statusLabel(dash.activeOnboarding.status)}
                  </span>
                </div>
                <ProgressBar
                  value={dash.activeOnboarding.totalSteps > 0
                    ? (dash.activeOnboarding.completedSteps / dash.activeOnboarding.totalSteps) * 100
                    : 0}
                  label={`${dash.activeOnboarding.completedSteps}/${dash.activeOnboarding.totalSteps} шагов`}
                />
              </div>
            </section>
          )}
        </div>

        <div className={styles.drawerFooter}>
          <button className={styles.actionBtn} onClick={() => setAssignCourseOpen(true)}>
            <BookOpen size={15} />
            Назначить курс
          </button>
          <button className={`${styles.actionBtn} ${styles.actionBtnSecondary}`} onClick={() => setAssignOnbOpen(true)}>
            <ClipboardList size={15} />
            Назначить онбординг
          </button>
        </div>
      </aside>

      {assignCourseOpen && (
        <AssignCourseDialog employee={emp} onClose={() => setAssignCourseOpen(false)} />
      )}
      {assignOnbOpen && (
        <AssignOnboardingDialog employee={emp} onClose={() => setAssignOnbOpen(false)} />
      )}
    </>
  );
}

function EnrollmentRow({ enrollment }: { enrollment: SubordinateEnrollmentDto }) {
  return (
    <div className={styles.enrollRow}>
      <div className={styles.enrollHeader}>
        {statusIcon(enrollment.status)}
        <span className={styles.enrollName}>{enrollment.courseName}</span>
      </div>
      <ProgressBar value={enrollment.completionRate} />
    </div>
  );
}

// ── Страница ─────────────────────────────────────────────────────

export function TeamPage() {
  const { user } = useUser();

  if (!canControl(user)) {
    return <div className={styles.accessDenied}>Нет доступа</div>;
  }

  return <TeamPageContent />;
}

function TeamPageContent() {
  const { data: tree = [], isLoading: treeLoading } = useSubordinateTreeQuery();
  const { data: dashboard, isLoading: dashLoading }  = useTeamDashboardQuery();

  const [selectedEmp, setSelectedEmp] = useState<SubordinateTreeEmployeeDto | null>(null);
  const [selectedDash, setSelectedDash] = useState<SubordinateDashboardItemDto | undefined>(undefined);

  const dashMap = useMemo(() => {
    const m = new Map<string, SubordinateDashboardItemDto>();
    dashboard?.subordinates.forEach(s => m.set(s.id, s));
    return m;
  }, [dashboard]);

  const handleSelect = useCallback((emp: SubordinateTreeEmployeeDto, dash: SubordinateDashboardItemDto | undefined) => {
    setSelectedEmp(emp);
    setSelectedDash(dash);
  }, []);

  const summary = dashboard?.summary;
  const isLoading = treeLoading || dashLoading;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <Users size={22} className={styles.pageTitleIcon} />
          Моя команда
        </h1>
      </div>

      {/* ── Summary stats ── */}
      {summary && (
        <div className={styles.statsRow}>
          {[
            { label: 'Сотрудников',          val: summary.totalSubordinates,    color: 'default' },
            { label: 'Курсов активно',        val: summary.activeEnrollments,    color: 'active' },
            { label: 'Курсов завершено',      val: summary.completedEnrollments, color: 'done' },
            { label: 'Онбордингов активно',   val: summary.activeOnboardings,    color: 'active' },
            { label: 'Онбордингов завершено', val: summary.completedOnboardings, color: 'done' },
          ].map(s => (
            <div key={s.label} className={`${styles.statCard} ${styles[`statCard_${s.color}`]}`}>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Body ── */}
      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <Loader2 size={24} className={styles.spin} />
            <span>Загрузка данных команды...</span>
          </div>
        ) : tree.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={40} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Нет подчинённых</p>
            <p className={styles.emptySub}>У вас пока нет сотрудников в подчинении</p>
          </div>
        ) : (
          <div className={styles.tree}>
            {tree.map(node => (
              <TreeNode
                key={node.positionId}
                node={node}
                depth={0}
                dashMap={dashMap}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Drawer ── */}
      {selectedEmp && (
        <EmployeeDrawer
          emp={selectedEmp}
          dash={selectedDash}
          onClose={() => { setSelectedEmp(null); setSelectedDash(undefined); }}
        />
      )}
    </div>
  );
}
