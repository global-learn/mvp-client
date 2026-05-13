import { useMemo, useState } from 'react';
import { X, Check, Users, User } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, isDepartmentHead, isDivisionHead, canAssignToClients, ROLE_LABELS } from '@entities/user/model/types';
import { ALL_EMPLOYEES, MOCK_ORG } from '@pages/company/ui/CompanyPage';
import styles from './AssignCourseModal.module.css';

// ── Mock-клиенты (синхронизированы с ClientsPage) ─────────────
const MOCK_CLIENTS = [
  { id: 'cl-1', fullname: 'Иван Соколов',      email: 'ivan@technostroy.ru',  company: 'ТехноСтрой' },
  { id: 'cl-2', fullname: 'Анна Фёдорова',     email: 'anna@technostroy.ru',  company: 'ТехноСтрой' },
  { id: 'cl-4', fullname: 'Марина Белова',      email: 'marina@mediagroup.ru', company: 'МедиаГрупп' },
  { id: 'cl-5', fullname: 'Александр Новиков', email: 'alex@agroprime.ru',    company: 'АгроПрайм'  },
  { id: 'cl-6', fullname: 'Елена Попова',       email: 'elena@agroprime.ru',   company: 'АгроПрайм'  },
];

interface AssignCourseModalProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

type AssignTab = 'employees' | 'clients';

export function AssignCourseModal({ courseId, courseTitle, onClose }: AssignCourseModalProps) {
  const { assignCourse } = useCourses();
  const { user } = useUser();

  const showClientTab = canAssignToClients(user);
  const [tab, setTab] = useState<AssignTab>('employees');
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [deptFilter, setDeptFilter] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [done, setDone] = useState(false);

  // Скоупинг сотрудников по роли текущего пользователя
  const scopedEmployees = useMemo(() => {
    let list = ALL_EMPLOYEES;
    if (isAdmin(user)) {
      // всё
    } else if (isDepartmentHead(user)) {
      list = list.filter(e => e.department.id === user.employee?.department.id);
    } else if (isDivisionHead(user)) {
      list = list.filter(e => e.division.id === user.employee?.division.id);
    } else {
      // senior_manager: только managers своего отдела
      list = list.filter(e =>
        e.division.id === user.employee?.division.id && e.role.name === 'manager'
      );
    }
    return list;
  }, [user]);

  const departments = useMemo(() => {
    if (isAdmin(user)) return MOCK_ORG.map(d => ({ id: d.id, name: d.name }));
    if (isDepartmentHead(user)) {
      const d = MOCK_ORG.find(d => d.id === user.employee?.department.id);
      return d ? [{ id: d.id, name: d.name }] : [];
    }
    return [];
  }, [user]);

  const filteredEmployees = deptFilter
    ? scopedEmployees.filter(e => e.department.id === deptFilter)
    : scopedEmployees;

  const toggleId = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const currentList = tab === 'clients' ? MOCK_CLIENTS : filteredEmployees;
  const selectAll = () => setSelected(new Set(currentList.map(e => e.id)));
  const clearAll  = () => setSelected(new Set());

  const handleAssign = async () => {
    if (selected.size === 0) return;
    setIsAssigning(true);
    await Promise.all([...selected].map(userId => assignCourse(courseId, userId)));
    setIsAssigning(false);
    setDone(true);
  };

  const handleTabChange = (t: AssignTab) => {
    setTab(t);
    setSelected(new Set());
    setDeptFilter('');
  };

  const successLabel = tab === 'clients'
    ? `Курс назначен ${selected.size} клиент${selected.size === 1 ? 'у' : 'ам'}`
    : `Курс назначен ${selected.size} сотрудник${selected.size === 1 ? 'у' : 'ам'}`;

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Назначить курс</h2>
            <p className={styles.subtitle}>«{courseTitle}»</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {done ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}><Check size={32} /></div>
            <p className={styles.successText}>{successLabel}</p>
            <button className={styles.doneBtn} onClick={onClose}>Готово</button>
          </div>
        ) : (
          <>
            {/* Вкладки Сотрудники / Клиенты */}
            {showClientTab && (
              <div className={styles.assignTabs}>
                <button
                  className={`${styles.assignTab} ${tab === 'employees' ? styles.assignTabActive : ''}`}
                  onClick={() => handleTabChange('employees')}
                >
                  <Users size={14} /> Сотрудники
                </button>
                <button
                  className={`${styles.assignTab} ${tab === 'clients' ? styles.assignTabActive : ''}`}
                  onClick={() => handleTabChange('clients')}
                >
                  <User size={14} /> Клиенты
                </button>
              </div>
            )}

            <div className={styles.filters}>
              {/* Фильтр по департаменту — только для сотрудников */}
              {tab === 'employees' && departments.length > 1 && (
                <select className={styles.select} value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}>
                  <option value="">Все отделы</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
              <div className={styles.bulkBtns}>
                <button className={styles.bulkBtn} onClick={selectAll}>Выбрать всех</button>
                <button className={styles.bulkBtn} onClick={clearAll}>Снять</button>
              </div>
            </div>

            <div className={styles.list}>
              {/* Список сотрудников */}
              {tab === 'employees' && filteredEmployees.map(emp => {
                const isSelected = selected.has(emp.id);
                return (
                  <button key={emp.id}
                    className={`${styles.empRow} ${isSelected ? styles.empSelected : ''}`}
                    onClick={() => toggleId(emp.id)}
                  >
                    <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                      {isSelected && <Check size={12} />}
                    </div>
                    <div className={styles.empAvatar}>
                      {(emp.fullname ?? emp.email)[0]}
                    </div>
                    <div className={styles.empInfo}>
                      <span className={styles.empName}>{emp.fullname ?? emp.email}</span>
                      <span className={styles.empDept}>
                        {emp.division.name} · {ROLE_LABELS[emp.role.name]}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Список клиентов */}
              {tab === 'clients' && MOCK_CLIENTS.map(client => {
                const isSelected = selected.has(client.id);
                return (
                  <button key={client.id}
                    className={`${styles.empRow} ${isSelected ? styles.empSelected : ''}`}
                    onClick={() => toggleId(client.id)}
                  >
                    <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                      {isSelected && <Check size={12} />}
                    </div>
                    <div className={styles.empAvatar} style={{ background: 'var(--primary-light, rgba(0,113,227,0.12))', color: 'var(--primary)' }}>
                      {client.fullname[0]}
                    </div>
                    <div className={styles.empInfo}>
                      <span className={styles.empName}>{client.fullname}</span>
                      <span className={styles.empDept}>{client.company} · {client.email}</span>
                    </div>
                  </button>
                );
              })}

              {currentList.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '1.5rem 0' }}>
                  {tab === 'clients' ? 'Нет доступных клиентов' : 'Нет доступных сотрудников'}
                </p>
              )}
            </div>

            <div className={styles.footer}>
              <span className={styles.selectedCount}>
                {selected.size > 0 ? `Выбрано: ${selected.size}` : `Выберите ${tab === 'clients' ? 'клиентов' : 'сотрудников'}`}
              </span>
              <button className={styles.assignBtn}
                onClick={() => void handleAssign()}
                disabled={selected.size === 0 || isAssigning}
              >
                {isAssigning ? 'Назначаем...' : 'Назначить'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
