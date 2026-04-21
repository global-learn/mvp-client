import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { canControl, isAdmin, getStatsScope } from '@entities/user/model/types';
import type { AdminEnrollmentRecord, CourseSummary, PersonSummary } from '@entities/course/model/controlTypes';
import { buildCourseSummaries, buildPersonSummaries } from '@entities/course/model/controlTypes';
import { controlApi } from '@entities/course/api/controlApi';
import styles from './Control.module.css';

// ── Конфиг статусов ──────────────────────────────────────
type StatusKey = 'completed' | 'in_progress' | 'not_enrolled';

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bg: string }> = {
  completed:    { label: 'Завершён',      color: '#276749', bg: '#c6f6d5' },
  in_progress:  { label: 'В процессе',   color: '#7b4e0e', bg: '#fefcbf' },
  not_enrolled: { label: 'Не начат',      color: '#5a5a72', bg: 'var(--secondary)' },
};

function statusConfig(s: string) {
  return STATUS_CONFIG[s as StatusKey] ?? STATUS_CONFIG.not_enrolled;
}

// ── Прогресс-бар ─────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  const cls =
    value === 100 ? styles.fillCompleted
    : value > 0   ? styles.fillInProgress
    :               styles.fillNotStarted;
  return (
    <div className={styles.progressTrack}>
      <div className={`${styles.progressFill} ${cls}`} style={{ width: `${value}%` }} />
    </div>
  );
}

// ── Вспомогательные функции ───────────────────────────────
function initials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type View = 'byCourse' | 'byPerson';
type EmpTab = 'employees' | 'clients';

// ══════════════════════════════════════════════════════════
export function ControlPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!canControl(user)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (!canControl(user)) return null;

  return <ControlContent adminMode={isAdmin(user)} scope={getStatsScope(user)} deptName={user.employee?.department.name} divisionId={user.employee?.division.id} />;
}

// ── Основной контент ──────────────────────────────────────
function ControlContent({
  adminMode, scope, deptName, divisionId,
}: {
  adminMode: boolean;
  scope: 'all' | 'department' | 'assigned' | 'self';
  deptName?: string;
  divisionId?: string;
}) {
  const [tab, setTab]         = useState<EmpTab>('employees');
  const [view, setView]       = useState<View>('byCourse');
  const [search, setSearch]   = useState('');
  const [groupFilter, setGroupFilter] = useState(''); // dept or company
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [empRecords, setEmpRecords]     = useState<AdminEnrollmentRecord[]>([]);
  const [clientRecords, setClientRecords] = useState<AdminEnrollmentRecord[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [allEmp, cli] = await Promise.all([
        controlApi.getEmployeeEnrollments(),
        adminMode ? controlApi.getClientEnrollments() : Promise.resolve([]),
      ]);
      // Скоупинг по роли
      const emp = scope === 'all'
        ? allEmp
        : scope === 'department'
          ? allEmp.filter(r => r.department === deptName)
          : scope === 'assigned'
            // senior_manager: только managers в своём отделе (упрощённый mock)
            ? allEmp.filter(r => {
                const found = allEmp.find(e => e.userId === r.userId);
                return found?.department === deptName;
              })
            : allEmp; // fallback
      setEmpRecords(emp);
      setClientRecords(cli);
      setLoading(false);
    })();
  }, [adminMode, scope, deptName, divisionId]);

  // Сбрасываем фильтры при смене таба или вида
  useEffect(() => {
    setSearch('');
    setGroupFilter('');
    setStatusFilter('');
    setExpanded(new Set());
  }, [tab, view]);

  const records = tab === 'employees' ? empRecords : clientRecords;

  // ── Опции фильтра отдела / компании ──────────────────────
  const groupOptions = useMemo(() => {
    if (tab === 'employees') {
      const depts = [...new Set(records.map(r => r.department ?? '').filter(Boolean))];
      return depts.sort();
    } else {
      const cos = [...new Set(records.map(r => r.companyName ?? '').filter(Boolean))];
      return cos.sort();
    }
  }, [records, tab]);

  // ── Фильтрация записей ────────────────────────────────────
  const filteredRecords = useMemo(() => {
    let list = records;
    if (groupFilter) {
      list = tab === 'employees'
        ? list.filter(r => r.department === groupFilter)
        : list.filter(r => r.companyName === groupFilter);
    }
    if (statusFilter) {
      list = list.filter(r => r.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q),
      );
    }
    return list;
  }, [records, tab, groupFilter, statusFilter, search]);

  // ── Сводки ───────────────────────────────────────────────
  const courseSummaries  = useMemo(() => buildCourseSummaries(filteredRecords),  [filteredRecords]);
  const personSummaries  = useMemo(() => buildPersonSummaries(filteredRecords),  [filteredRecords]);

  // ── Глобальная статистика (по всем записям таба) ──────────
  const totalRecords    = records.length;
  const totalCompleted  = records.filter(r => r.status === 'completed').length;
  const totalInProgress = records.filter(r => r.status === 'in_progress').length;
  const totalNotStarted = records.filter(r => r.status === 'not_enrolled').length;
  const completionPct   = totalRecords > 0 ? Math.round((totalCompleted / totalRecords) * 100) : 0;

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const personLabel = tab === 'employees' ? 'сотрудников' : 'клиентов';
  const groupLabel  = tab === 'employees' ? 'Отдел'       : 'Компания';

  return (
    <div className={styles.page}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h1 className={styles.title}>Контроль обучения</h1>
        <p className={styles.subtitle}>Прогресс прохождения курсов по назначениям</p>
      </div>

      {/* Статистика */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Всего назначений</span>
          <span className={styles.statValue}>{totalRecords}</span>
          <span className={styles.statSub}>{completionPct}% завершены</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Завершили</span>
          <span className={styles.statValue}>{totalCompleted}</span>
          <span className={styles.statSub} style={{ color: '#276749' }}>✓ пройдено</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>В процессе</span>
          <span className={styles.statValue}>{totalInProgress}</span>
          <span className={styles.statSub}>продолжают учёбу</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Не начали</span>
          <span className={styles.statValue}>{totalNotStarted}</span>
          <span className={styles.statSub} style={{ color: '#9b2c2c' }}>требуют внимания</span>
        </div>
      </div>

      {/* Табы (только если admin — показываем Клиентов) */}
      {adminMode && (
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'employees' ? styles.activeTab : ''}`}
            onClick={() => setTab('employees')}
          >
            Сотрудники
          </button>
          <button
            className={`${styles.tab} ${tab === 'clients' ? styles.activeTab : ''}`}
            onClick={() => setTab('clients')}
          >
            Клиенты
          </button>
        </div>
      )}

      {/* Тулбар */}
      <div className={styles.toolbar}>
        {/* Переключатель вида */}
        <div className={styles.viewSwitch}>
          <button
            className={`${styles.viewBtn} ${view === 'byCourse' ? styles.activeView : ''}`}
            onClick={() => setView('byCourse')}
          >
            По курсам
          </button>
          <button
            className={`${styles.viewBtn} ${view === 'byPerson' ? styles.activeView : ''}`}
            onClick={() => setView('byPerson')}
          >
            По {personLabel}
          </button>
        </div>

        {/* Поиск */}
        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={`Поиск по имени, email или курсу...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Фильтр отдела / компании */}
        {groupOptions.length > 0 && (
          <select className={styles.select} value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
            <option value="">Все ({groupLabel})</option>
            {groupOptions.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}

        {/* Фильтр статуса */}
        <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="completed">Завершён</option>
          <option value="in_progress">В процессе</option>
          <option value="not_enrolled">Не начат</option>
        </select>
      </div>

      {/* Список */}
      {loading ? (
        <p className={styles.empty}>Загрузка...</p>
      ) : view === 'byCourse' ? (
        <CourseSummaryList summaries={courseSummaries} expanded={expanded} onToggle={toggleExpand} tab={tab} />
      ) : (
        <PersonSummaryList summaries={personSummaries} expanded={expanded} onToggle={toggleExpand} tab={tab} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Вид «По курсам»
// ══════════════════════════════════════════════════════════
function CourseSummaryList({
  summaries, expanded, onToggle, tab,
}: {
  summaries: CourseSummary[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  tab: EmpTab;
}) {
  if (summaries.length === 0) return <p className={styles.empty}>Нет данных</p>;

  return (
    <div className={styles.list}>
      {summaries.map(cs => {
        const isOpen = expanded.has(cs.courseId);
        return (
          <div key={cs.courseId} className={styles.summaryCard}>
            <button className={styles.summaryHeader} onClick={() => onToggle(cs.courseId)}>
              <div className={styles.summaryLeft}>
                <span className={styles.summaryName}>{cs.courseTitle}</span>
                <span className={styles.summaryMeta}>
                  {cs.totalAssigned} назначений · {cs.completed} завершили
                </span>
              </div>

              {/* Мини-счётчики */}
              <div className={styles.miniCounts}>
                <div className={styles.miniCount}>
                  <span className={styles.miniCountVal} style={{ color: '#276749' }}>{cs.completed}</span>
                  <span className={styles.miniCountLabel}>готово</span>
                </div>
                <div className={styles.miniCount}>
                  <span className={styles.miniCountVal} style={{ color: '#7b4e0e' }}>{cs.inProgress}</span>
                  <span className={styles.miniCountLabel}>в процессе</span>
                </div>
                <div className={styles.miniCount}>
                  <span className={styles.miniCountVal} style={{ color: '#9b2c2c' }}>{cs.notStarted}</span>
                  <span className={styles.miniCountLabel}>не начали</span>
                </div>
              </div>

              {/* Прогресс-бар завершения */}
              <div className={styles.headerProgress}>
                <ProgressBar value={cs.completionRate} />
                <span className={styles.progressPct}>{cs.completionRate}%</span>
              </div>

              <ChevronDown
                size={18}
                className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
              />
            </button>

            {isOpen && (
              <div className={styles.expandedPanel}>
                {cs.records.map(r => {
                  const cfg = statusConfig(r.status);
                  const groupInfo = tab === 'employees' ? r.department : r.companyName;
                  return (
                    <div key={`${r.userId}-${r.courseId}`} className={styles.expandedRow}>
                      <div className={styles.expandedAvatar}>{initials(r.userName)}</div>
                      <div className={styles.expandedInfo}>
                        <span className={styles.expandedName}>{r.userName}</span>
                        <span className={styles.expandedSub}>{r.userEmail} · {groupInfo}</span>
                      </div>
                      <div className={styles.expandedProgress}>
                        <ProgressBar value={r.progress} />
                        <span className={styles.expandedPct}>{r.progress}%</span>
                      </div>
                      <span
                        className={styles.statusBadge}
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Вид «По сотрудникам / клиентам»
// ══════════════════════════════════════════════════════════
function PersonSummaryList({
  summaries, expanded, onToggle, tab,
}: {
  summaries: PersonSummary[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  tab: EmpTab;
}) {
  if (summaries.length === 0) return <p className={styles.empty}>Нет данных</p>;

  return (
    <div className={styles.list}>
      {summaries.map(ps => {
        const isOpen = expanded.has(ps.userId);
        const groupInfo = tab === 'employees' ? ps.department : ps.companyName;
        return (
          <div key={ps.userId} className={styles.summaryCard}>
            <button className={styles.summaryHeader} onClick={() => onToggle(ps.userId)}>
              <div className={styles.expandedAvatar} style={{ flexShrink: 0, marginRight: '-0.25rem' }}>
                {initials(ps.userName)}
              </div>
              <div className={styles.summaryLeft}>
                <span className={styles.summaryName}>{ps.userName}</span>
                <span className={styles.summaryMeta}>{ps.userEmail} · {groupInfo}</span>
              </div>

              {/* Мини-счётчики */}
              <div className={styles.miniCounts}>
                <div className={styles.miniCount}>
                  <span className={styles.miniCountVal} style={{ color: '#276749' }}>{ps.completed}</span>
                  <span className={styles.miniCountLabel}>готово</span>
                </div>
                <div className={styles.miniCount}>
                  <span className={styles.miniCountVal} style={{ color: '#7b4e0e' }}>{ps.inProgress}</span>
                  <span className={styles.miniCountLabel}>в процессе</span>
                </div>
                <div className={styles.miniCount}>
                  <span className={styles.miniCountVal} style={{ color: '#9b2c2c' }}>{ps.notStarted}</span>
                  <span className={styles.miniCountLabel}>не начали</span>
                </div>
              </div>

              {/* Средний прогресс */}
              <div className={styles.headerProgress}>
                <ProgressBar value={ps.avgProgress} />
                <span className={styles.progressPct}>{ps.avgProgress}%</span>
              </div>

              <ChevronDown
                size={18}
                className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
              />
            </button>

            {isOpen && (
              <div className={styles.expandedPanel}>
                {ps.records.map(r => {
                  const cfg = statusConfig(r.status);
                  return (
                    <div key={`${r.userId}-${r.courseId}`} className={styles.expandedRow}>
                      <div className={styles.expandedInfo}>
                        <span className={styles.expandedName}>{r.courseTitle}</span>
                        <span className={styles.expandedSub}>
                          Назначен {new Date(r.assignedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className={styles.expandedProgress}>
                        <ProgressBar value={r.progress} />
                        <span className={styles.expandedPct}>{r.progress}%</span>
                      </div>
                      <span
                        className={styles.statusBadge}
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
