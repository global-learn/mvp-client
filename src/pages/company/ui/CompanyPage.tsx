import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin } from '@entities/user/model/types';
import type { Department, EmployeeListItem } from '@entities/company/model/types';
import { DepartmentList } from '@widgets/department-list/ui/DepartmentList';
import styles from './Company.module.css';

// Mock-данные внутренней структуры компании.
// Заменить на API когда появится бэкенд:
//   GET /departments          → список отделов с сотрудниками
//   GET /employees            → плоский список сотрудников (с фильтрами)
//   POST /departments         → создать отдел
//   POST /employees           → добавить сотрудника

const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-1',
    name: 'IT отдел',
    employees: [
      { id: 'emp-admin', fullname: 'Ислам Гадиляев',  email: 'admin@test.com',  role: { id: 'role-admin',    name: 'admin' },          department: { id: 'dept-1', name: 'IT отдел' }, birthDate: '1990-05-15', employmentDate: '2020-01-01' },
      { id: 'emp-head',  fullname: 'Дмитрий Козлов',  email: 'head@test.com',   role: { id: 'role-depthead', name: 'departmentHead' }, department: { id: 'dept-1', name: 'IT отдел' }, birthDate: '1988-03-22', employmentDate: '2019-06-01' },
      { id: 'emp-1',     fullname: 'Анна Серова',      email: 'anna@corp.ru',    role: { id: 'r2',            name: 'developer' },      department: { id: 'dept-1', name: 'IT отдел' }, birthDate: '1997-01-30', employmentDate: '2023-02-10' },
      { id: 'emp-2',     fullname: 'Иван Соколов',     email: 'ivan@corp.ru',    role: { id: 'r4',            name: 'manager' },         department: { id: 'dept-1', name: 'IT отдел' }, birthDate: '1993-09-12', employmentDate: '2021-03-20' },
    ],
  },
  {
    id: 'dept-2',
    name: 'Продажи',
    employees: [
      { id: 'emp-senior', fullname: 'Наталья Орлова',  email: 'senior@test.com', role: { id: 'role-senior', name: 'seniorManager' }, department: { id: 'dept-2', name: 'Продажи' }, birthDate: '1992-07-10', employmentDate: '2021-01-15' },
      { id: 'emp-3',      fullname: 'Мария Иванова',   email: 'user@test.com',   role: { id: 'r3',          name: 'employee' },       department: { id: 'dept-2', name: 'Продажи' }, birthDate: '1995-08-22', employmentDate: '2022-06-01' },
      { id: 'emp-4',      fullname: 'Сергей Волков',   email: 'serg@corp.ru',    role: { id: 'r4',          name: 'manager' },         department: { id: 'dept-2', name: 'Продажи' }, birthDate: '1988-12-10', employmentDate: '2019-03-15' },
      { id: 'emp-5',      fullname: 'Елена Попова',    email: 'elena@corp.ru',   role: { id: 'r4',          name: 'manager' },         department: { id: 'dept-2', name: 'Продажи' }, birthDate: '1991-04-18', employmentDate: '2020-09-01' },
    ],
  },
  {
    id: 'dept-3',
    name: 'HR',
    employees: [
      { id: 'emp-6', fullname: 'Ольга Смирнова', email: 'olga@corp.ru', role: { id: 'r5', name: 'accountant' }, department: { id: 'dept-3', name: 'HR' }, birthDate: '1987-07-05', employmentDate: '2018-09-01' },
    ],
  },
  {
    id: 'dept-4',
    name: 'Финансы',
    employees: [],
  },
];

const ROLES = ['admin', 'developer', 'manager', 'employee', 'accountant'] as const;

type Modal =
  | { type: 'addDepartment' }
  | { type: 'addEmployee'; departmentId?: string }
  | null;

type Tab = 'departments' | 'employees';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CompanyPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [tab, setTab] = useState<Tab>('departments');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modal, setModal] = useState<Modal>(null);

  // Форма "Добавить отдел"
  const [deptName, setDeptName] = useState('');

  // Форма "Добавить сотрудника"
  const [empEmail, setEmpEmail]           = useState('');
  const [empFullname, setEmpFullname]     = useState('');
  const [empBirth, setEmpBirth]           = useState('');
  const [empEmployed, setEmpEmployed]     = useState(today);
  const [empDeptId, setEmpDeptId]         = useState('');
  const [empRole, setEmpRole]             = useState<string>(ROLES[3]);

  useEffect(() => {
    if (!isAdmin(user)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (!isAdmin(user)) return null;

  const allEmployees: EmployeeListItem[] = departments.flatMap(d => d.employees);

  const filtered = useMemo(() => {
    let list = allEmployees;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.fullname ?? '').toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q),
      );
    }
    if (deptFilter) {
      list = list.filter(e => e.department.id === deptFilter);
    }
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, deptFilter, departments]);

  const closeModal = () => {
    setModal(null);
    setDeptName('');
    setEmpEmail('');
    setEmpFullname('');
    setEmpBirth('');
    setEmpEmployed(today());
    setEmpRole(ROLES[3]);
    setEmpDeptId('');
  };

  const openAddEmployee = (departmentId?: string) => {
    setEmpDeptId(departmentId ?? (departments[0]?.id ?? ''));
    setModal({ type: 'addEmployee', departmentId });
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const name = deptName.trim();
    if (!name) return;
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name,
      employees: [],
    };
    setDepartments(prev => [...prev, newDept]);
    closeModal();
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empEmail.trim() || !empDeptId || !empBirth || !empEmployed) return;
    const dept = departments.find(d => d.id === empDeptId);
    if (!dept) return;
    const newEmp: EmployeeListItem = {
      id: `emp-${Date.now()}`,
      email: empEmail.trim(),
      fullname: empFullname.trim() || null,
      role: { id: `role-${empRole}`, name: empRole },
      department: { id: dept.id, name: dept.name },
      birthDate: empBirth,
      employmentDate: empEmployed,
    };
    setDepartments(prev =>
      prev.map(d =>
        d.id === empDeptId ? { ...d, employees: [...d.employees, newEmp] } : d,
      ),
    );
    closeModal();
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <h1 className={styles.pageTitle}>Компания</h1>
          <span className={styles.totalBadge}>{allEmployees.length} сотрудников</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn} onClick={() => setModal({ type: 'addDepartment' })}>
            <Plus size={16} />
            Добавить отдел
          </button>
          <button className={styles.actionBtn} onClick={() => openAddEmployee()}>
            <Plus size={16} />
            Добавить сотрудника
          </button>
        </div>
      </div>

      {/* Табы */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'departments' ? styles.activeTab : ''}`}
          onClick={() => setTab('departments')}
        >
          По отделам
        </button>
        <button
          className={`${styles.tab} ${tab === 'employees' ? styles.activeTab : ''}`}
          onClick={() => setTab('employees')}
        >
          Все сотрудники
        </button>
      </div>

      {/* Таб: отделы */}
      {tab === 'departments' && (
        <DepartmentList departments={departments} onAddEmployee={openAddEmployee} />
      )}

      {/* Таб: все сотрудники */}
      {tab === 'employees' && (
        <div>
          {/* Фильтры */}
          <div className={styles.filters}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className={styles.select}
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="">Все отделы</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Список */}
          {filtered.length === 0 ? (
            <p className={styles.empty}>Сотрудники не найдены</p>
          ) : (
            <div className={styles.empList}>
              {filtered.map(emp => (
                <div key={emp.id} className={styles.empCard}>
                  <div className={styles.empAvatar}>
                    {(emp.fullname ?? emp.email)[0].toUpperCase()}
                  </div>
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

          <p className={styles.resultsNote}>
            Показано {filtered.length} из {allEmployees.length}
          </p>
        </div>
      )}

      {/* Модалка: добавить отдел */}
      {modal?.type === 'addDepartment' && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Новый отдел</h2>
              <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddDepartment} className={styles.form}>
              <label className={styles.label}>
                Название отдела
                <input
                  className={styles.input}
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  placeholder="Например: Маркетинг"
                  required
                  autoFocus
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Отмена</button>
                <button type="submit" className={styles.submitBtn}>Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка: добавить сотрудника */}
      {modal?.type === 'addEmployee' && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Новый сотрудник</h2>
              <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddEmployee} className={styles.form}>
              <label className={styles.label}>
                Email
                <input
                  className={styles.input}
                  type="email"
                  value={empEmail}
                  onChange={e => setEmpEmail(e.target.value)}
                  placeholder="employee@corp.ru"
                  required
                  autoFocus
                />
              </label>
              <label className={styles.label}>
                Полное имя (необязательно)
                <input
                  className={styles.input}
                  value={empFullname}
                  onChange={e => setEmpFullname(e.target.value)}
                  placeholder="Иван Иванов"
                />
              </label>
              <div className={styles.formRow}>
                <label className={styles.label}>
                  Дата рождения
                  <input
                    className={styles.input}
                    type="date"
                    value={empBirth}
                    onChange={e => setEmpBirth(e.target.value)}
                    required
                  />
                </label>
                <label className={styles.label}>
                  Дата найма
                  <input
                    className={styles.input}
                    type="date"
                    value={empEmployed}
                    onChange={e => setEmpEmployed(e.target.value)}
                    required
                  />
                </label>
              </div>
              <label className={styles.label}>
                Отдел
                <select
                  className={styles.input}
                  value={empDeptId}
                  onChange={e => setEmpDeptId(e.target.value)}
                  required
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Роль
                <select
                  className={styles.input}
                  value={empRole}
                  onChange={e => setEmpRole(e.target.value)}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Отмена</button>
                <button type="submit" className={styles.submitBtn}>Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
