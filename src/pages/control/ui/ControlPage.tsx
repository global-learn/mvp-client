import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { canControl, getStatsScope } from '@entities/user/model/types';
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

// ══════════════════════════════════════════════════════════
export function ControlPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!canControl(user)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (!canControl(user)) return null;

  return <ControlContent scope={getStatsScope(user)} deptName={user.employee?.department.name} divisionName={user.employee?.division.name} />;
}

// ── Основной контент ──────────────────────────────────────
function ControlContent({
  scope, deptName, divisionName,
}: {
  scope: 'all' | 'department' | 'division' | 'assigned' | 'self';
  deptName?: string;
  divisionName?: string;
}) {
  const [view, setView]       = useState<View>('byCourse');
  const [search, setSearch]   = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [records, setRecords] = useState<AdminEnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const all = await controlApi.getEmployeeEnrollments();
      let emp = all;
      if (scope === 'department') {
        emp = all.filter(r => r.department === deptName);
      } else if (scope === 'division') {
        emp = all.filter(r => r.division === divisionName);
      } else if (scope === 'assigned') {
        emp = all.filter(r => r.division === divisionName);
      }
      setRecords(emp);
      setLoading(false);
    })();
  }, [scope, deptName, divisionName]);

  useEffect(() => {
    setSearch('');
    setGroupFilter('');
    setStatusFilter('');
    setExpanded(new Set());
  }, [view]);

  // ── Опции фильтра отдела ──────────────────────────
  const groupOptions = useMemo(() => {
    const depts = [...new Set(records.map(r => r.department ?? '').filter(Boolean))];
    return depts.sort();
  }, [records]);

  // ── Фильтрация записей ────────────────────────────────────
  const filteredRecords = useMemo(() => {
    let list = records;
    if (groupFilter) list = list.filter(r => r.department === groupFilter);
    if (statusFilter) list = list.filter(r => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q),
      );
    }
    return list;
  }, [records, groupFilter, statusFilter, search]);

  // ── Сводки ───────────────────────────────────────────────
  const courseSummaries  = useMemo(() => buildCourseSummaries(filteredRecords),  [filteredRecords]);
  const personSummaries  = useMemo(() => buildPersonSummaries(filteredRecords),  [filteredRecords]);

  // ── Глобальная статистика ──────────
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Контроль обучения</h1>
        <p className={styles.subtitle}>Прогресс прохождения курсов по назначениям</p>
      </div>

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

      <div className={styles.toolbar}>
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
            По сотрудникам
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={`Поиск по имени, email или курсу...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {groupOptions.length > 0 && (
          <select className={styles.select} value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
            <option value="">Все департаменты</option>
            {groupOptions.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}

        <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="completed">Завершён</option>
          <option value="in_progress">В процессе</option>
          <option value="not_enrolled">Не начат</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.empty}>Загрузка...</p>
      ) : view === 'byCourse' ? (
        <CourseSummaryList summaries={courseSummaries} expanded={expanded} onToggle={toggleExpand} />
      ) : (
        <PersonSummaryList summaries={personSummaries} expanded={expanded} onToggle={toggleExpand} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Вид «По курсам»
// ══════════════════════════════════════════════════════════
function CourseSummaryList({
  summaries, expanded, onToggle,
}: {
  summaries: CourseSummary[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
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
                  return (
                    <div key={`${r.userId}-${r.courseId}`} className={styles.expandedRow}>
                      <div className={styles.expandedAvatar}>{initials(r.userName)}</div>
                      <div className={styles.expandedInfo}>
                        <span className={styles.expandedName}>{r.userName}</span>
                        <span className={styles.expandedSub}>{r.userEmail} · {r.department}</span>
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
// Вид «По сотрудникам»
// ══════════════════════════════════════════════════════════
function PersonSummaryList({
  summaries, expanded, onToggle,
}: {
  summaries: PersonSummary[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (summaries.length === 0) return <p className={styles.empty}>Нет данных</p>;

  return (
    <div className={styles.list}>
      {summaries.map(ps => {
        const isOpen = expanded.has(ps.userId);
        return (
          <div key={ps.userId} className={styles.summaryCard}>
            <button className={styles.summaryHeader} onClick={() => onToggle(ps.userId)}>
              <div className={styles.expandedAvatar} style={{ flexShrink: 0, marginRight: '-0.25rem' }}>
                {initials(ps.userName)}
              </div>
              <div className={styles.summaryLeft}>
                <span className={styles.summaryName}>{ps.userName}</span>
                <span className={styles.summaryMeta}>{ps.userEmail} · {ps.department}</span>
              </div>

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
