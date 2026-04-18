import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, Users, UserPlus } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin } from '@entities/user/model/types';
import type { Department, EmployeeListItem } from '@entities/company/model/types';
import type { EmployeeInvite, InviteStatus } from '@entities/invite/model/types';
import { makeExpiresAt } from '@entities/invite/model/types';
import { DepartmentList } from '@widgets/department-list/ui/DepartmentList';
import styles from './Company.module.css';

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'IT отдел',  employees: [
    { id: 'emp-admin', fullname: 'Ислам Гадиляев',  email: 'admin@test.com', role: { id: 'r1', name: 'admin' },     department: { id: 'dept-1', name: 'IT отдел' },   birthDate: '1990-05-15', employmentDate: '2020-01-01' },
    { id: 'emp-5',     fullname: 'Дмитрий Козлов',  email: 'dmitry@corp.ru', role: { id: 'r2', name: 'developer' }, department: { id: 'dept-1', name: 'IT отдел' },   birthDate: '1993-09-12', employmentDate: '2021-03-20' },
    { id: 'emp-6',     fullname: 'Анна Серова',      email: 'anna@corp.ru',   role: { id: 'r2', name: 'developer' }, department: { id: 'dept-1', name: 'IT отдел' },   birthDate: '1997-01-30', employmentDate: '2023-02-10' },
  ]},
  { id: 'dept-2', name: 'Продажи',   employees: [
    { id: 'emp-2',     fullname: 'Мария Иванова',   email: 'user@test.com',  role: { id: 'r3', name: 'employee' }, department: { id: 'dept-2', name: 'Продажи' }, birthDate: '1995-08-22', employmentDate: '2022-06-01' },
    { id: 'emp-3',     fullname: 'Сергей Волков',   email: 'serg@corp.ru',   role: { id: 'r3', name: 'employee' }, department: { id: 'dept-2', name: 'Продажи' }, birthDate: '1988-12-10', employmentDate: '2019-03-15' },
  ]},
  { id: 'dept-3', name: 'HR',         employees: [
    { id: 'emp-4',     fullname: 'Наталья Орлова',  email: 'nataly@corp.ru', role: { id: 'r4', name: 'manager' },  department: { id: 'dept-3', name: 'HR' },         birthDate: '1992-03-27', employmentDate: '2021-07-01' },
  ]},
  { id: 'dept-4', name: 'Финансы',    employees: [
    { id: 'emp-7',     fullname: 'Ольга Смирнова',  email: 'olga@corp.ru',   role: { id: 'r5', name: 'accountant' }, department: { id: 'dept-4', name: 'Финансы' },    birthDate: '1987-07-05', employmentDate: '2018-09-01' },
  ]},
];

const ALL_EMPLOYEES: EmployeeListItem[] = MOCK_DEPARTMENTS.flatMap(d => d.employees);

const MOCK_ROLES = [
  { id: 'r1', name: 'admin' },
  { id: 'r2', name: 'developer' },
  { id: 'r3', name: 'employee' },
  { id: 'r4', name: 'manager' },
  { id: 'r5', name: 'accountant' },
];

const INITIAL_INVITES: EmployeeInvite[] = [
  {
    id: 'inv-1', type: 'EMPLOYEE',
    email: 'new.dev@corp.ru', fullname: 'Игорь Кравцов', password: '***',
    department: { id: 'dept-1', name: 'IT отдел' }, role: { id: 'r2', name: 'developer' },
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    expiresAt: makeExpiresAt(new Date(Date.now() - 2 * 86400000).toISOString()),
  },
  {
    id: 'inv-2', type: 'EMPLOYEE',
    email: 'old.invite@corp.ru', fullname: null, password: '***',
    department: { id: 'dept-2', name: 'Продажи' }, role: { id: 'r3', name: 'employee' },
    status: 'expired',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    expiresAt: makeExpiresAt(new Date(Date.now() - 15 * 86400000).toISOString()),
  },
];

type Tab = 'departments' | 'employees' | 'invites';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_CONFIG: Record<InviteStatus, { label: string; color: string; bg: string }> = {
  active:  { label: 'Активен',  color: '#276749', bg: '#c6f6d5' },
  pending: { label: 'Ожидает',  color: '#7b4e0e', bg: '#fefcbf' },
  expired: { label: 'Истёк',    color: '#9b2c2c', bg: '#fed7d7' },
};

export function CompanyPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('departments');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [invites, setInvites] = useState<EmployeeInvite[]>(INITIAL_INVITES);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Форма инвайта
  const [form, setForm] = useState({
    email: '', password: '', fullname: '',
    departmentId: 'dept-1', roleId: 'r3',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin(user)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (!isAdmin(user)) return null;

  const filtered = useMemo(() => {
    let list = ALL_EMPLOYEES;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => (e.fullname ?? '').toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
    }
    if (deptFilter) list = list.filter(e => e.department.id === deptFilter);
    return list;
  }, [search, deptFilter]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise<void>(r => setTimeout(r, 400)); // имитация API
    const now = new Date().toISOString();
    const dept = MOCK_DEPARTMENTS.find(d => d.id === form.departmentId)!;
    const role = MOCK_ROLES.find(r => r.id === form.roleId)!;
    const invite: EmployeeInvite = {
      id: `inv-${Date.now()}`,
      type: 'EMPLOYEE',
      email: form.email,
      fullname: form.fullname || null,
      password: form.password,
      department: { id: dept.id, name: dept.name },
      role: { id: role.id, name: role.name },
      status: 'pending',
      createdAt: now,
      expiresAt: makeExpiresAt(now),
    };
    setInvites(prev => [invite, ...prev]);
    setForm({ email: '', password: '', fullname: '', departmentId: 'dept-1', roleId: 'r3' });
    setInviteOpen(false);
    setSubmitting(false);
    setTab('invites');
  };

  const totalEmployees = ALL_EMPLOYEES.length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <h1 className={styles.pageTitle}>Компания</h1>
          <span className={styles.totalBadge}>{totalEmployees} сотрудников</span>
        </div>
        <button className={styles.inviteBtn} onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} />
          Пригласить сотрудника
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

      {tab === 'departments' && <DepartmentList departments={MOCK_DEPARTMENTS} />}

      {tab === 'employees' && (
        <div>
          <div className={styles.filters}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="Поиск по имени или email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className={styles.select} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">Все отделы</option>
              {MOCK_DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
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
                    <span className={styles.deptName}>{emp.department.name}</span>
                    <span className={styles.roleBadge}>{emp.role.name}</span>
                  </div>
                  <div className={styles.empDates}>
                    <span className={styles.dateLabel}>Принят</span>
                    <span className={styles.dateValue}>{formatDate(emp.employmentDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className={styles.resultsNote}>Показано {filtered.length} из {ALL_EMPLOYEES.length}</p>
        </div>
      )}

      {tab === 'invites' && (
        <div className={styles.inviteList}>
          {invites.length === 0 ? (
            <p className={styles.empty}>Нет инвайтов</p>
          ) : (
            invites.map(inv => {
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
                    <span className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className={styles.dateLabel}>
                      {inv.status === 'expired' ? 'Истёк' : 'Действует до'} {formatDate(inv.expiresAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
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
            <form onSubmit={e => { void handleInvite(e); }} className={styles.form}>
              <label className={styles.label}>
                Email <span className={styles.req}>*</span>
                <input className={styles.input} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="employee@company.ru" required autoFocus />
              </label>
              <label className={styles.label}>
                Пароль (временный) <span className={styles.req}>*</span>
                <input className={styles.input} type="text" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Минимум 8 символов" required minLength={6} />
              </label>
              <label className={styles.label}>
                Имя (необязательно)
                <input className={styles.input} value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))} placeholder="Иван Иванов" />
              </label>
              <div className={styles.row}>
                <label className={styles.label}>
                  Отдел
                  <select className={styles.input} value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
                    {MOCK_DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <label className={styles.label}>
                  Роль
                  <select className={styles.input} value={form.roleId} onChange={e => setForm(p => ({ ...p, roleId: e.target.value }))}>
                    {MOCK_ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setInviteOpen(false)}>Отмена</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Отправляем...' : 'Отправить приглашение'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
