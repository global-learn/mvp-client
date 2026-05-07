import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, X, Users, PlusCircle, Building2 } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, canCreateCourse, ROLE_LABELS, type EmployeeRole } from '@entities/user/model/types';
import type { Department, EmployeeListItem } from '@entities/company/model/types';
import type { EmployeeInvite, InviteStatus } from '@entities/invite/model/types';
import { makeExpiresAt } from '@entities/invite/model/types';
import { DepartmentList } from '@widgets/department-list/ui/DepartmentList';
import styles from './Company.module.css';

// ================================================================
// Mock-данные (начальные) — Департамент → Отдел → Должность → Сотрудники
// ================================================================

const INITIAL_ORG: Department[] = [
  // ── Департамент продаж ──────────────────────────────────────────
  {
    id: 'dept-sales', name: 'Департамент продаж',
    divisions: [
      {
        id: 'div-sales', name: 'Отдел продаж', departmentId: 'dept-sales',
        positions: [
          { id: 'pos-s1', name: 'Руководитель отдела продаж' },
          { id: 'pos-s2', name: 'Менеджер по продажам' },
          { id: 'pos-s3', name: 'Специалист по продажам' },
        ],
        employees: [
          { id: 'emp-2',   fullname: 'Мария Иванова',   email: 'user@test.com',  role: { id: 'r-mgr', name: 'manager' as EmployeeRole },      department: { id: 'dept-sales', name: 'Департамент продаж' }, division: { id: 'div-sales', name: 'Отдел продаж' },    position: { id: 'pos-s2', name: 'Менеджер по продажам' },       birthDate: '1995-08-22', employmentDate: '2022-06-01' },
          { id: 'emp-3',   fullname: 'Сергей Волков',   email: 'serg@corp.ru',   role: { id: 'r-mgr', name: 'manager' as EmployeeRole },      department: { id: 'dept-sales', name: 'Департамент продаж' }, division: { id: 'div-sales', name: 'Отдел продаж' },    position: { id: 'pos-s2', name: 'Менеджер по продажам' },       birthDate: '1988-12-10', employmentDate: '2019-03-15' },
          { id: 'emp-8',   fullname: 'Артём Лебедев',   email: 'artem@corp.ru',  role: { id: 'r-mgr', name: 'manager' as EmployeeRole },      department: { id: 'dept-sales', name: 'Департамент продаж' }, division: { id: 'div-sales', name: 'Отдел продаж' },    position: { id: 'pos-s3', name: 'Специалист по продажам' },     birthDate: '1999-04-18', employmentDate: '2023-09-01' },
        ],
      },
      {
        id: 'div-supply', name: 'Отдел обеспечения продаж', departmentId: 'dept-sales',
        positions: [
          { id: 'pos-sp1', name: 'Руководитель отдела' },
          { id: 'pos-sp2', name: 'Специалист по обеспечению' },
        ],
        employees: [
          { id: 'emp-9', fullname: 'Ольга Рыбакова', email: 'olga.r@corp.ru', role: { id: 'r-mgr', name: 'manager' as EmployeeRole }, department: { id: 'dept-sales', name: 'Департамент продаж' }, division: { id: 'div-supply', name: 'Отдел обеспечения продаж' }, position: { id: 'pos-sp2', name: 'Специалист по обеспечению' }, birthDate: '1993-07-14', employmentDate: '2020-11-01' },
        ],
      },
      {
        id: 'div-service', name: 'Отдел сервиса', departmentId: 'dept-sales', isService: true,
        positions: [
          { id: 'pos-sv1', name: 'Руководитель отдела сервиса' },
          { id: 'pos-sv2', name: 'Специалист сервиса' },
        ],
        employees: [
          { id: 'emp-service', fullname: 'Виктор Кузнецов', email: 'service@test.com', role: { id: 'r-mgr', name: 'manager' as EmployeeRole }, department: { id: 'dept-sales', name: 'Департамент продаж' }, division: { id: 'div-service', name: 'Отдел сервиса', isService: true }, position: { id: 'pos-sv2', name: 'Специалист сервиса' }, birthDate: '1992-11-08', employmentDate: '2021-05-15' },
        ],
      },
    ],
  },

  // ── Департамент мониторинга ─────────────────────────────────────
  {
    id: 'dept-monitoring', name: 'Департамент мониторинга',
    divisions: [
      {
        id: 'div-meat', name: 'Отдел мясной промышленности', departmentId: 'dept-monitoring',
        positions: [
          { id: 'pos-m1', name: 'Руководитель отдела' },
          { id: 'pos-m2', name: 'Менеджер мониторинга' },
        ],
        employees: [
          { id: 'emp-10', fullname: 'Павел Зайцев', email: 'pavel@corp.ru', role: { id: 'r-mgr', name: 'manager' as EmployeeRole }, department: { id: 'dept-monitoring', name: 'Департамент мониторинга' }, division: { id: 'div-meat', name: 'Отдел мясной промышленности' }, position: { id: 'pos-m2', name: 'Менеджер мониторинга' }, birthDate: '1991-02-28', employmentDate: '2021-01-15' },
        ],
      },
      {
        id: 'div-retail', name: 'Отдел сетевого ретейла', departmentId: 'dept-monitoring',
        positions: [
          { id: 'pos-r1', name: 'Руководитель отдела' },
          { id: 'pos-r2', name: 'Менеджер мониторинга' },
        ],
        employees: [
          { id: 'emp-11', fullname: 'Екатерина Морозова', email: 'kate@corp.ru', role: { id: 'r-mgr', name: 'manager' as EmployeeRole }, department: { id: 'dept-monitoring', name: 'Департамент мониторинга' }, division: { id: 'div-retail', name: 'Отдел сетевого ретейла' }, position: { id: 'pos-r2', name: 'Менеджер мониторинга' }, birthDate: '1996-06-11', employmentDate: '2022-04-01' },
        ],
      },
      { id: 'div-poultry', name: 'Отдел птицеводческой промышленности', departmentId: 'dept-monitoring', positions: [{ id: 'pos-p1', name: 'Руководитель отдела' }, { id: 'pos-p2', name: 'Менеджер мониторинга' }], employees: [] },
      { id: 'div-dairy', name: 'Отдел молокоперерабатывающей промышленности', departmentId: 'dept-monitoring', positions: [{ id: 'pos-d1', name: 'Руководитель отдела' }, { id: 'pos-d2', name: 'Менеджер мониторинга' }], employees: [] },
    ],
  },

  // ── Департамент маркетинга ──────────────────────────────────────
  {
    id: 'dept-marketing', name: 'Департамент маркетинга',
    divisions: [
      { id: 'div-it', name: 'ИТ-отдел', departmentId: 'dept-marketing', positions: [{ id: 'pos-it1', name: 'Руководитель ИТ-отдела' }, { id: 'pos-it2', name: 'IT-специалист' }, { id: 'pos-it3', name: 'Системный администратор' }], employees: [] },
      { id: 'div-mkt', name: 'Отдел маркетинга', departmentId: 'dept-marketing', positions: [{ id: 'pos-mk1', name: 'Руководитель отдела маркетинга' }, { id: 'pos-mk2', name: 'Маркетолог' }, { id: 'pos-mk3', name: 'SMM-специалист' }], employees: [] },
      {
        id: 'div-dev', name: 'Отдел разработки', departmentId: 'dept-marketing',
        positions: [{ id: 'pos-dev1', name: 'Lead Developer' }, { id: 'pos-dev2', name: 'Разработчик' }, { id: 'pos-dev3', name: 'Junior Developer' }],
        employees: [
          { id: 'emp-admin',   fullname: 'Ислам Гадиляев',  email: 'admin@test.com',    role: { id: 'r-admin', name: 'admin' as EmployeeRole },            department: { id: 'dept-marketing', name: 'Департамент маркетинга' }, division: { id: 'div-dev', name: 'Отдел разработки' }, position: { id: 'pos-dev1', name: 'Lead Developer' }, birthDate: '1990-05-15', employmentDate: '2020-01-01' },
          { id: 'emp-5',       fullname: 'Дмитрий Козлов',  email: 'depthead@test.com', role: { id: 'r-dhead', name: 'department_head' as EmployeeRole },  department: { id: 'dept-marketing', name: 'Департамент маркетинга' }, division: { id: 'div-dev', name: 'Отдел разработки' }, position: { id: 'pos-dev1', name: 'Lead Developer' }, birthDate: '1993-09-12', employmentDate: '2021-03-20' },
          { id: 'emp-divhead', fullname: 'Иван Петров',      email: 'divhead@test.com',  role: { id: 'r-divhead', name: 'division_head' as EmployeeRole }, department: { id: 'dept-marketing', name: 'Департамент маркетинга' }, division: { id: 'div-dev', name: 'Отдел разработки' }, position: { id: 'pos-dev2', name: 'Разработчик' },    birthDate: '1994-03-22', employmentDate: '2021-07-01' },
          { id: 'emp-6',       fullname: 'Анна Серова',      email: 'senior@test.com',   role: { id: 'r-senior', name: 'senior_manager' as EmployeeRole }, department: { id: 'dept-marketing', name: 'Департамент маркетинга' }, division: { id: 'div-dev', name: 'Отдел разработки' }, position: { id: 'pos-dev2', name: 'Разработчик' },    birthDate: '1997-01-30', employmentDate: '2023-02-10' },
          { id: 'emp-12',      fullname: 'Николай Фёдоров',  email: 'nikola@corp.ru',    role: { id: 'r-mgr', name: 'manager' as EmployeeRole },            department: { id: 'dept-marketing', name: 'Департамент маркетинга' }, division: { id: 'div-dev', name: 'Отдел разработки' }, position: { id: 'pos-dev3', name: 'Junior Developer' }, birthDate: '2001-08-05', employmentDate: '2024-01-15' },
        ],
      },
    ],
  },

  // ── Административный департамент ────────────────────────────────
  {
    id: 'dept-admin', name: 'Административный департамент',
    divisions: [
      { id: 'div-house', name: 'Хозяйственный отдел', departmentId: 'dept-admin', positions: [{ id: 'pos-h1', name: 'Руководитель отдела' }, { id: 'pos-h2', name: 'Хозяйственный работник' }], employees: [] },
      {
        id: 'div-finance', name: 'Финансовый отдел', departmentId: 'dept-admin',
        positions: [{ id: 'pos-f1', name: 'Главный бухгалтер' }, { id: 'pos-f2', name: 'Финансовый аналитик' }, { id: 'pos-f3', name: 'Бухгалтер' }],
        employees: [
          { id: 'emp-4', fullname: 'Наталья Орлова',  email: 'nataly@corp.ru', role: { id: 'r-mgr', name: 'manager' as EmployeeRole }, department: { id: 'dept-admin', name: 'Административный департамент' }, division: { id: 'div-finance', name: 'Финансовый отдел' }, position: { id: 'pos-f3', name: 'Бухгалтер' },          birthDate: '1992-03-27', employmentDate: '2021-07-01' },
          { id: 'emp-7', fullname: 'Ольга Смирнова',  email: 'olga@corp.ru',   role: { id: 'r-mgr', name: 'manager' as EmployeeRole }, department: { id: 'dept-admin', name: 'Административный департамент' }, division: { id: 'div-finance', name: 'Финансовый отдел' }, position: { id: 'pos-f2', name: 'Финансовый аналитик' }, birthDate: '1987-07-05', employmentDate: '2018-09-01' },
        ],
      },
      { id: 'div-secret', name: 'Секретариат', departmentId: 'dept-admin', positions: [{ id: 'pos-sc1', name: 'Секретарь' }, { id: 'pos-sc2', name: 'Делопроизводитель' }], employees: [] },
    ],
  },
];

const INITIAL_INVITES: EmployeeInvite[] = [
  {
    id: 'inv-1', type: 'EMPLOYEE',
    email: 'new.dev@corp.ru', fullname: 'Игорь Кравцов', password: '',
    department: { id: 'dept-marketing', name: 'Департамент маркетинга' }, role: { id: 'r-mgr', name: 'developer' },
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    expiresAt: makeExpiresAt(new Date(Date.now() - 2 * 86400000).toISOString()),
  },
  {
    id: 'inv-2', type: 'EMPLOYEE',
    email: 'old.invite@corp.ru', fullname: null, password: '',
    department: { id: 'dept-sales', name: 'Департамент продаж' }, role: { id: 'r-mgr', name: 'employee' },
    status: 'expired',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    expiresAt: makeExpiresAt(new Date(Date.now() - 15 * 86400000).toISOString()),
  },
];

const STATUS_CONFIG: Record<InviteStatus, { label: string; color: string; bg: string }> = {
  active:  { label: 'Активен', color: '#065f46', bg: '#d1fae5' },
  pending: { label: 'Ожидает', color: '#92400e', bg: '#fef3c7' },
  expired: { label: 'Истёк',   color: '#991b1b', bg: '#fee2e2' },
};

type Tab = 'departments' | 'employees' | 'invites';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ================================================================

export function CompanyPage() {
  const { user }   = useUser();
  const navigate   = useNavigate();
  const adminUser  = isAdmin(user);

  const [org, setOrg]             = useState<Department[]>(INITIAL_ORG);
  const [tab, setTab]             = useState<Tab>('departments');
  const [search, setSearch]       = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [invites, setInvites]     = useState<EmployeeInvite[]>(INITIAL_INVITES);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addingDept, setAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const [form, setForm] = useState({
    email: '', fullname: '',
    divisionId: INITIAL_ORG[0]?.divisions[0]?.id ?? '',
    positionId: INITIAL_ORG[0]?.divisions[0]?.positions[0]?.id ?? '',
    roleId: 'manager' as EmployeeRole,
  });

  useEffect(() => {
    if (!canCreateCourse(user)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);
  if (!canCreateCourse(user)) return null;

  // Derived from org state
  const allEmployees: EmployeeListItem[] = useMemo(
    () => org.flatMap(d => d.divisions.flatMap(div => div.employees)),
    [org]
  );
  const allDivisions = useMemo(
    () => org.flatMap(d => d.divisions.map(div => ({ id: div.id, name: div.name, deptId: d.id, deptName: d.name, isService: div.isService }))),
    [org]
  );
  const allPositions = useMemo(
    () => org.flatMap(d => d.divisions.flatMap(div => div.positions.map(p => ({ id: p.id, name: p.name, divId: div.id })))),
    [org]
  );

  const availableDivisions = adminUser
    ? allDivisions
    : allDivisions.filter(d => d.deptId === user.employee?.department.id);

  const availablePositions = allPositions.filter(p => p.divId === form.divisionId);
  const availableRoles: EmployeeRole[] = adminUser
    ? ['admin', 'department_head', 'division_head', 'senior_manager', 'manager']
    : ['department_head', 'division_head', 'senior_manager', 'manager'];

  const filtered = useMemo(() => {
    let list = allEmployees;
    if (!adminUser) list = list.filter(e => e.department.id === user.employee?.department.id);
    const q = search.toLowerCase();
    if (q) list = list.filter(e => (e.fullname ?? '').toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
    if (deptFilter) list = list.filter(e => e.department.id === deptFilter);
    return list;
  }, [allEmployees, search, deptFilter, adminUser, user]);

  // ── Обработчики org-management ──────────────────────────────────

  const handleAddDepartment = () => {
    const name = newDeptName.trim();
    if (!name) return;
    const id = `dept-${Date.now()}`;
    setOrg(prev => [...prev, { id, name, divisions: [] }]);
    setNewDeptName('');
    setAddingDept(false);
  };

  const handleAddDivision = (deptId: string, name: string) => {
    const divId = `div-${Date.now()}`;
    setOrg(prev => prev.map(d => {
      if (d.id !== deptId) return d;
      return {
        ...d,
        divisions: [...d.divisions, {
          id: divId, name, departmentId: deptId,
          positions: [], employees: [],
        }],
      };
    }));
  };

  // Dept head's own department id (for restricting division add)
  const editableDeptId: string | null | undefined = adminUser
    ? undefined  // undefined → admin can edit all depts
    : (user.employee?.department.id ?? null);

  // ── Invite submit ──────────────────────────────────────────────

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise<void>(r => setTimeout(r, 400));
    const now  = new Date().toISOString();
    const dept = org.find(d => d.divisions.some(dv => dv.id === form.divisionId));
    const invite: EmployeeInvite = {
      id: `inv-${Date.now()}`, type: 'EMPLOYEE',
      email: form.email, fullname: form.fullname || null, password: '',
      department: { id: dept?.id ?? '', name: dept?.name ?? '' },
      role: { id: form.roleId, name: form.roleId },
      status: 'pending', createdAt: now, expiresAt: makeExpiresAt(now),
    };
    setInvites(prev => [invite, ...prev]);
    setForm(f => ({ ...f, email: '', fullname: '' }));
    setInviteOpen(false);
    setSubmitting(false);
    setTab('invites');
  };

  // ================================================================

  return (
    <div className={styles.page}>

      {/* ── Заголовок ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitleRow}>
            <h1 className={styles.pageTitle}>Компания</h1>
            <span className={styles.totalBadge}>{allEmployees.length} сотрудников</span>
          </div>
          <p className={styles.pageSubtitle}>Структура организации и управление персоналом</p>
        </div>
        <button className={styles.inviteBtn} onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} /> Пригласить сотрудника
        </button>
      </div>

      {/* ── Табы ── */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'departments' ? styles.activeTab : ''}`} onClick={() => setTab('departments')}>
          <Building2 size={15} /> По отделам
        </button>
        <button className={`${styles.tab} ${tab === 'employees' ? styles.activeTab : ''}`} onClick={() => setTab('employees')}>
          <Users size={15} /> Сотрудники
        </button>
        <button className={`${styles.tab} ${tab === 'invites' ? styles.activeTab : ''}`} onClick={() => setTab('invites')}>
          Инвайты
          {invites.filter(i => i.status === 'pending').length > 0 && (
            <span className={styles.tabBadge}>{invites.filter(i => i.status === 'pending').length}</span>
          )}
        </button>
      </div>

      {/* ── Вкладка: Структура ── */}
      {tab === 'departments' && (
        <div>
          {/* Кнопка добавления департамента (только admin) */}
          {adminUser && (
            <div style={{ marginBottom: '1rem' }}>
              {!addingDept ? (
                <button
                  onClick={() => setAddingDept(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.4375rem 0.875rem',
                    background: 'transparent',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--primary)',
                    fontSize: '0.875rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.12s',
                  }}
                >
                  <PlusCircle size={15} /> Добавить департамент
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddDepartment();
                      if (e.key === 'Escape') { setAddingDept(false); setNewDeptName(''); }
                    }}
                    placeholder="Название департамента..."
                    style={{
                      padding: '0.4375rem 0.75rem',
                      border: '1.5px solid var(--primary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem', fontFamily: 'inherit',
                      outline: 'none', width: 280,
                      boxShadow: '0 0 0 3px var(--ring)',
                    }}
                  />
                  <button
                    onClick={handleAddDepartment}
                    style={{
                      padding: '0.4375rem 0.875rem', background: 'var(--primary)', color: '#fff',
                      border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem',
                    }}
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => { setAddingDept(false); setNewDeptName(''); }}
                    style={{
                      padding: '0.4375rem 0.75rem', background: 'transparent',
                      border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>
          )}

          <DepartmentList
            departments={adminUser ? org : org.filter(d => d.id === user.employee?.department.id)}
            onAddDivision={handleAddDivision}
            editableDeptId={editableDeptId}
          />
        </div>
      )}

      {/* ── Вкладка: Сотрудники ── */}
      {tab === 'employees' && (
        <div>
          <div className={styles.filters}>
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {adminUser && (
              <select className={styles.select} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="">Все департаменты</option>
                {org.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className={styles.empty}>Сотрудники не найдены</p>
          ) : (
            <div className={styles.empList}>
              {filtered.map(emp => (
                <div key={emp.id} className={styles.empCard}>
                  <div className={styles.empAvatar}>{(emp.fullname ?? emp.email)[0].toUpperCase()}</div>
                  <div className={styles.empMain}>
                    <span className={styles.empName}>{emp.fullname ?? '—'}</span>
                    <span className={styles.empEmail}>{emp.email}</span>
                  </div>
                  <div className={styles.empMeta}>
                    <span className={styles.deptName}>{emp.division.name}</span>
                    <span className={styles.roleBadge}>{ROLE_LABELS[emp.role.name]}</span>
                  </div>
                  <div className={styles.empDates}>
                    <span className={styles.dateLabel}>Должность</span>
                    <span className={styles.dateValue}>{emp.position.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className={styles.resultsNote}>Показано {filtered.length} из {allEmployees.length}</p>
        </div>
      )}

      {/* ── Вкладка: Инвайты ── */}
      {tab === 'invites' && (
        <div className={styles.inviteList}>
          {invites.length === 0 ? (
            <p className={styles.empty}>Нет инвайтов</p>
          ) : invites.map(inv => {
            const cfg = STATUS_CONFIG[inv.status];
            return (
              <div key={inv.id} className={styles.inviteCard}>
                <div className={styles.inviteLeft}>
                  <div className={styles.empAvatar}>{(inv.fullname ?? inv.email)[0].toUpperCase()}</div>
                  <div>
                    <span className={styles.empName}>{inv.fullname ?? '—'}</span>
                    <span style={{ display: 'block' }} className={styles.empEmail}>{inv.email}</span>
                    <span className={styles.inviteMeta}>{inv.department.name} · {inv.role.name}</span>
                  </div>
                </div>
                <div className={styles.inviteRight}>
                  <span className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  <span className={styles.dateLabel}>{inv.status === 'expired' ? 'Истёк' : 'До'} {formatDate(inv.expiresAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Модалка приглашения ── */}
      {inviteOpen && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setInviteOpen(false); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Пригласить сотрудника</h2>
              <button className={styles.closeBtn} onClick={() => setInviteOpen(false)}><X size={18} /></button>
            </div>
            <p style={{ margin: '-0.5rem 0 1.375rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Сотрудник получит письмо со ссылкой для завершения регистрации
            </p>
            <form onSubmit={e => { void handleInvite(e); }} className={styles.form}>
              <label className={styles.label}>
                Email <span className={styles.req}>*</span>
                <input className={styles.input} type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="employee@company.ru" required autoFocus />
              </label>
              <label className={styles.label}>
                Имя (необязательно)
                <input className={styles.input} value={form.fullname}
                  onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))}
                  placeholder="Иван Иванов" />
              </label>
              <div className={styles.row}>
                <label className={styles.label}>
                  Отдел
                  <select className={styles.input} value={form.divisionId}
                    onChange={e => {
                      const divId = e.target.value;
                      const firstPos = allPositions.find(p => p.divId === divId);
                      setForm(p => ({ ...p, divisionId: divId, positionId: firstPos?.id ?? '' }));
                    }}>
                    {availableDivisions.map(d => (
                      <option key={d.id} value={d.id}>{d.name}{d.isService ? ' (сервис)' : ''}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Должность
                  <select className={styles.input} value={form.positionId}
                    onChange={e => setForm(p => ({ ...p, positionId: e.target.value }))}>
                    {availablePositions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              </div>
              <label className={styles.label}>
                Роль
                <select className={styles.input} value={form.roleId}
                  onChange={e => setForm(p => ({ ...p, roleId: e.target.value as EmployeeRole }))}>
                  {availableRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setInviteOpen(false)}>Отмена</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Отправляем...' : 'Отправить ссылку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Export для совместимости с другими модулями, которые могут использовать MOCK_ORG
export const MOCK_ORG = INITIAL_ORG;
export const ALL_EMPLOYEES: EmployeeListItem[] =
  INITIAL_ORG.flatMap(d => d.divisions.flatMap(div => div.employees));
