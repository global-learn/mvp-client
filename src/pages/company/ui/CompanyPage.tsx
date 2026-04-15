import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin } from '@entities/user/model/types';
import type { Department, EmployeeListItem } from '@entities/company/model/types';
import { DepartmentList } from '@widgets/department-list/ui/DepartmentList';
import styles from './Company.module.css';

// Mock-данные внутренней структуры компании.
// Заменить на API когда появится бэкенд:
//   GET /departments          → список отделов с сотрудниками
//   GET /employees            → плоский список сотрудников (с фильтрами)

const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 'dept-1',
    name: 'IT отдел',
    employees: [
      { id: 'emp-admin', fullname: 'Алексей Петров',  email: 'admin@test.com', role: { id: 'r1', name: 'admin' },     department: { id: 'dept-1', name: 'IT отдел' },   birthDate: '1990-05-15', employmentDate: '2020-01-01' },
      { id: 'emp-5',     fullname: 'Дмитрий Козлов',  email: 'dmitry@corp.ru', role: { id: 'r2', name: 'developer' }, department: { id: 'dept-1', name: 'IT отдел' },   birthDate: '1993-09-12', employmentDate: '2021-03-20' },
      { id: 'emp-6',     fullname: 'Анна Серова',      email: 'anna@corp.ru',   role: { id: 'r2', name: 'developer' }, department: { id: 'dept-1', name: 'IT отдел' },   birthDate: '1997-01-30', employmentDate: '2023-02-10' },
    ],
  },
  {
    id: 'dept-2',
    name: 'Продажи',
    employees: [
      { id: 'emp-2', fullname: 'Мария Иванова',  email: 'user@test.com',  role: { id: 'r3', name: 'employee' }, department: { id: 'dept-2', name: 'Продажи' }, birthDate: '1995-08-22', employmentDate: '2022-06-01' },
      { id: 'emp-3', fullname: 'Сергей Волков',  email: 'serg@corp.ru',   role: { id: 'r3', name: 'employee' }, department: { id: 'dept-2', name: 'Продажи' }, birthDate: '1988-12-10', employmentDate: '2019-03-15' },
    ],
  },
  {
    id: 'dept-3',
    name: 'HR',
    employees: [
      { id: 'emp-4', fullname: 'Наталья Орлова', email: 'nataly@corp.ru', role: { id: 'r4', name: 'manager' },  department: { id: 'dept-3', name: 'HR' },         birthDate: '1992-03-27', employmentDate: '2021-07-01' },
    ],
  },
  {
    id: 'dept-4',
    name: 'Финансы',
    employees: [
      { id: 'emp-7', fullname: 'Ольга Смирнова', email: 'olga@corp.ru',   role: { id: 'r5', name: 'accountant' }, department: { id: 'dept-4', name: 'Финансы' },    birthDate: '1987-07-05', employmentDate: '2018-09-01' },
    ],
  },
];

const ALL_EMPLOYEES: EmployeeListItem[] = MOCK_DEPARTMENTS.flatMap(d => d.employees);

type Tab = 'departments' | 'employees';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function CompanyPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('departments');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    if (!isAdmin(user)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (!isAdmin(user)) return null;

  const filtered = useMemo(() => {
    let list = ALL_EMPLOYEES;
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
  }, [search, deptFilter]);

  const totalEmployees = ALL_EMPLOYEES.length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Компания</h1>
        <span className={styles.totalBadge}>{totalEmployees} сотрудников</span>
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
        <DepartmentList departments={MOCK_DEPARTMENTS} />
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
              {MOCK_DEPARTMENTS.map(d => (
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
            Показано {filtered.length} из {ALL_EMPLOYEES.length}
          </p>
        </div>
      )}
    </div>
  );
}
