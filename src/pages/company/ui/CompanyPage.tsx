import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, X, Users } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, canCreateCourse, ROLE_LABELS, type EmployeeRole } from '@entities/user/model/types';
import type { Department, EmployeeListItem } from '@entities/company/model/types';
import type { EmployeeInvite, InviteStatus } from '@entities/invite/model/types';
import { makeExpiresAt } from '@entities/invite/model/types';
import { DepartmentList } from '@widgets/department-list/ui/DepartmentList';
import styles from './Company.module.css';

// ================================================================
// Mock-данные: Департамент → Отдел → Должность → Сотрудники
// ================================================================

export const MOCK_ORG: Department[] = [
  {
    id: 'dept-1', name: 'IT департамент',
    divisions: [
      {
        id: 'div-1', name: 'Отдел разработки', departmentId: 'dept-1',
        positions: [{ id: 'pos-1', name: 'Lead Developer' }, { id: 'pos-2', name: 'Developer' }],
        employees: [
          { id: 'emp-admin', fullname: 'Ислам Гадиляев',  email: 'admin@test.com',    role: { id: 'r1', name: 'admin' as EmployeeRole },          department: { id: 'dept-1', name: 'IT департамент' },     division: { id: 'div-1', name: 'Отдел разработки' },     position: { id: 'pos-1', name: 'Lead Developer' },        birthDate: '1990-05-15', employmentDate: '2020-01-01' },
          { id: 'emp-5',     fullname: 'Дмитрий Козлов',  email: 'depthead@test.com', role: { id: 'r2', name: 'dept_head' as EmployeeRole },      department: { id: 'dept-1', name: 'IT департамент' },     division: { id: 'div-1', name: 'Отдел разработки' },     position: { id: 'pos-2', name: 'Developer' },             birthDate: '1993-09-12', employmentDate: '2021-03-20' },
          { id: 'emp-6',     fullname: 'Анна Серова',      email: 'senior@test.com',   role: { id: 'r3', name: 'senior_manager' as EmployeeRole }, department: { id: 'dept-1', name: 'IT департамент' },     division: { id: 'div-1', name: 'Отдел разработки' },     position: { id: 'pos-2', name: 'Developer' },             birthDate: '1997-01-30', employmentDate: '2023-02-10' },
        ],
      },
      {
        id: 'div-2', name: 'Отдел QA', departmentId: 'dept-1',
        positions: [{ id: 'pos-3', name: 'QA Engineer' }],
        employees: [],
      },
    ],
  },
  {
    id: 'dept-2', name: 'Департамент продаж',
    divisions: [
      {
        id: 'div-3', name: 'Отдел продаж', departmentId: 'dept-2',
        positions: [{ id: 'pos-4', name: 'Менеджер по продажам' }],
        employees: [
          { id: 'emp-2', fullname: 'Мария Иванова',   email: 'user@test.com',    role: { id: 'r4', name: 'manager' as EmployeeRole }, department: { id: 'dept-2', name: 'Департамент продаж' }, division: { id: 'div-3', name: 'Отдел продаж' },                         position: { id: 'pos-4', name: 'Менеджер по продажам' }, birthDate: '1995-08-22', employmentDate: '2022-06-01' },
          { id: 'emp-3', fullname: 'Сергей Волков',   email: 'serg@corp.ru',     role: { id: 'r4', name: 'manager' as EmployeeRole }, department: { id: 'dept-2', name: 'Департамент продаж' }, division: { id: 'div-3', name: 'Отдел продаж' },                         position: { id: 'pos-4', name: 'Менеджер по продажам' }, birthDate: '1988-12-10', employmentDate: '2019-03-15' },
        ],
      },
      {
        id: 'div-4', name: 'Отдел сервиса', departmentId: 'dept-2', isService: true,
        positions: [{ id: 'pos-5', name: 'Специалист сервиса' }],
        employees: [
          { id: 'emp-service', fullname: 'Виктор Кузнецов', email: 'service@test.com', role: { id: 'r4', name: 'manager' as EmployeeRole }, department: { id: 'dept-2', name: 'Департамент продаж' }, division: { id: 'div-4', name: 'Отдел сервиса', isService: true }, position: { id: 'pos-5', name: 'Специалист сервиса' }, birthDate: '1992-11-08', employmentDate: '2021-05-15' },
        ],
      },
    ],
  },
  {
    id: 'dept-3', name: 'HR',
    divisions: [{
      id: 'div-5', name: 'Отдел персонала', departmentId: 'dept-3',
      positions: [{ id: 'pos-6', name: 'HR-менеджер' }],
      employees: [
        { id: 'emp-4', fullname: 'Наталья Орлова', email: 'nataly@corp.ru', role: { id: 'r2', name: 'dept_head' as EmployeeRole }, department: { id: 'dept-3', name: 'HR' }, division: { id: 'div-5', name: 'Отдел персонала' }, position: { id: 'pos-6', name: 'HR-менеджер' }, birthDate: '1992-03-27', employmentDate: '2021-07-01' },
      ],
    }],
  },
  {
    id: 'dept-4', name: 'Финансы',
    divisions: [{
      id: 'div-6', name: 'Финансовый отдел', departmentId: 'dept-4',
      positions: [{ id: 'pos-7', name: 'Бухгалтер' }],
      employees: [
        { id: 'emp-7', fullname: 'Ольга Смирнова', email: 'olga@corp.ru', role: { id: 'r4', name: 'manager' as EmployeeRole }, department: { id: 'dept-4', name: 'Финансы' }, division: { id: 'div-6', name: 'Финансовый отдел' }, position: { id: 'pos-7', name: 'Бухгалтер' }, birthDate: '1987-07-05', employmentDate: '2018-09-01' },
      ],
    }],
  },
];

export const ALL_EMPLOYEES: EmployeeListItem[] =
  MOCK_ORG.flatMap(d => d.divisions.flatMap(div => div.employees));

const ALL_DIVISIONS = MOCK_ORG.flatMap(d =>
  d.divisions.map(div => ({ id: div.id, name: div.name, deptId: d.id, deptName: d.name, isService: div.isService }))
);
const ALL_POSITIONS = MOCK_ORG.flatMap(d =>
  d.divisions.flatMap(div => div.positions.map(p => ({ id: p.id, name: p.name, divId: div.id })))
);

const INITIAL_INVITES: EmployeeInvite[] = [
  {
    id: 'inv-1', type: 'EMPLOYEE',
    email: 'new.dev@corp.ru', fullname: 'Игорь Кравцов', password: '',
    department: { id: 'dept-1', name: 'IT департамент' }, role: { id: 'r2', name: 'developer' },
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    expiresAt: makeExpiresAt(new Date(Date.now() - 2 * 86400000).toISOString()),
  },
  {
    id: 'inv-2', type: 'EMPLOYEE',
    email: 'old.invite@corp.ru', fullname: null, password: '',
    department: { id: 'dept-2', name: 'Департамент продаж' }, role: { id: 'r4', name: 'employee' },
    status: 'expired',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    expiresAt: makeExpiresAt(new Date(Date.now() - 15 * 86400000).toISOString()),
  },
];

const STATUS_CONFIG: Record<InviteStatus, { label: string; color: string; bg: string }> = {
  active:  { label: 'Активен', color: '#276749', bg: '#c6f6d5' },
  pending: { label: 'Ожидает', color: '#7b4e0e', bg: '#fefcbf' },
  expired: { label: 'Истёк',   color: '#9b2c2c', bg: '#fed7d7' },
};

type Tab = 'departments' | 'employees' | 'invites';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ================================================================

export function CompanyPage() {
  const { user }  = useUser();
  const navigate  = useNavigate();
  const [tab, setTab]         = useState<Tab>('departments');
  const [search, setSearch]   = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [invites, setInvites] = useState<EmployeeInvite[]>(INITIAL_INVITES);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: '', fullname: '',
    divisionId: ALL_DIVISIONS[0]?.id ?? '',
    positionId: ALL_POSITIONS[0]?.id ?? '',
    roleId: 'manager' as EmployeeRole,
  });

  // Только canCreateCourse (admin, dept_head, senior_manager)
  useEffect(() => {
    if (!canCreateCourse(user)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);
  if (!canCreateCourse(user)) return null;

  // Отделы, доступные для приглашения (dept_head/senior видят только свой департамент)
  const availableDivisions = isAdmin(user)
    ? ALL_DIVISIONS
    : ALL_DIVISIONS.filter(d => d.deptId === user.employee?.department.id);

  const availablePositions = ALL_POSITIONS.filter(p => p.divId === form.divisionId);
  const availableRoles: EmployeeRole[] = isAdmin(user)
    ? ['admin', 'dept_head', 'senior_manager', 'manager']
    : ['dept_head', 'senior_manager', 'manager'];

  const filtered = useMemo(() => {
    let list = ALL_EMPLOYEES;
    if (!isAdmin(user)) {
      list = list.filter(e => e.department.id === user.employee?.department.id);
    }
    const q = search.toLowerCase();
    if (q) list = list.filter(e => (e.fullname ?? '').toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
    if (deptFilter) list = list.filter(e => e.department.id === deptFilter);
    return list;
  }, [search, deptFilter, user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise<void>(r => setTimeout(r, 400));
    const now  = new Date().toISOString();
    const dept = MOCK_ORG.find(d => d.divisions.some(dv => dv.id === form.divisionId));
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

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <h1 className={styles.pageTitle}>Компания</h1>
          <span className={styles.totalBadge}>{ALL_EMPLOYEES.length} сотрудников</span>
        </div>
        <button className={styles.inviteBtn} onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} /> Пригласить сотрудника
        </button>
      </div>

      {/* Табы */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'departments' ? styles.activeTab : ''}`} onClick={() => setTab('departments')}>
          <Users size={16} /> По отделам
        </button>
        <button className={`${styles.tab} ${tab === 'employees' ? styles.activeTab : ''}`} onClick={() => setTab('employees')}>
          Все сотрудники
        </button>
        <button className={`${styles.tab} ${tab === 'invites' ? styles.activeTab : ''}`} onClick={() => setTab('invites')}>
          Инвайты
          {invites.filter(i => i.status === 'pending').length > 0 && (
            <span className={styles.tabBadge}>{invites.filter(i => i.status === 'pending').length}</span>
          )}
        </button>
      </div>

      {/* Вкладка: По отделам */}
      {tab === 'departments' && (
        <DepartmentList
          departments={isAdmin(user) ? MOCK_ORG : MOCK_ORG.filter(d => d.id === user.employee?.department.id)}
        />
      )}

      {/* Вкладка: Все сотрудники */}
      {tab === 'employees' && (
        <div>
          <div className={styles.filters}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="Поиск по имени или email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {isAdmin(user) && (
              <select className={styles.select} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="">Все департаменты</option>
                {MOCK_ORG.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
          <p className={styles.resultsNote}>Показано {filtered.length} из {ALL_EMPLOYEES.length}</p>
        </div>
      )}

      {/* Вкладка: Инвайты */}
      {tab === 'invites' && (
        <div className={styles.inviteList}>
          {invites.length === 0 ? <p className={styles.empty}>Нет инвайтов</p>
            : invites.map(inv => {
              const cfg = STATUS_CONFIG[inv.status];
              return (
                <div key={inv.id} className={styles.inviteCard}>
                  <div className={styles.inviteLeft}>
                    <div className={styles.empAvatar}>{(inv.fullname ?? inv.email)[0].toUpperCase()}</div>
                    <div>
                      <span className={styles.empName}>{inv.fullname ?? '—'}</span>
                      <span className={styles.empEmail}>{inv.email}</span>
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

      {/* Модалка приглашения */}
      {inviteOpen && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setInviteOpen(false); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Пригласить сотрудника</h2>
              <button className={styles.closeBtn} onClick={() => setInviteOpen(false)}><X size={18} /></button>
            </div>
            <p style={{ margin: '-0.5rem 0 1.25rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
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
                      const firstPos = ALL_POSITIONS.find(p => p.divId === divId);
                      setForm(p => ({ ...p, divisionId: divId, positionId: firstPos?.id ?? '' }));
                    }}>
                    {availableDivisions.map(d => (
                      <option key={d.id} value={d.id}>{d.name}{d.isService ? ' 🎧' : ''}</option>
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
                  {submitting ? 'Отправляем...' : '✉️ Отправить ссылку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
