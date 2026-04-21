import { useMemo, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, isDeptHead, ROLE_LABELS } from '@entities/user/model/types';
import { ALL_EMPLOYEES, MOCK_ORG } from '@pages/company/ui/CompanyPage';
import styles from './AssignCourseModal.module.css';

interface AssignCourseModalProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

export function AssignCourseModal({ courseId, courseTitle, onClose }: AssignCourseModalProps) {
  const { assignCourse } = useCourses();
  const { user } = useUser();
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [deptFilter, setDeptFilter] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [done, setDone] = useState(false);

  // Скоупинг списка по роли текущего пользователя:
  //   admin      → все сотрудники
  //   dept_head  → только свой департамент
  //   senior_mgr → только менеджеры в своём отделе
  const scopedEmployees = useMemo(() => {
    let list = ALL_EMPLOYEES;
    if (isAdmin(user)) {
      // всё
    } else if (isDeptHead(user)) {
      list = list.filter(e => e.department.id === user.employee?.department.id);
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
    if (isDeptHead(user)) {
      const d = MOCK_ORG.find(d => d.id === user.employee?.department.id);
      return d ? [{ id: d.id, name: d.name }] : [];
    }
    return [];
  }, [user]);

  const filtered = deptFilter
    ? scopedEmployees.filter(e => e.department.id === deptFilter)
    : scopedEmployees;

  const toggleEmployee = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selected.size === 0) return;
    setIsAssigning(true);
    await Promise.all([...selected].map(userId => assignCourse(courseId, userId)));
    setIsAssigning(false);
    setDone(true);
  };

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
            <p className={styles.successText}>Курс назначен {selected.size} сотрудникам</p>
            <button className={styles.doneBtn} onClick={onClose}>Готово</button>
          </div>
        ) : (
          <>
            <div className={styles.filters}>
              {departments.length > 1 && (
                <select className={styles.select} value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}>
                  <option value="">Все отделы</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
              <div className={styles.bulkBtns}>
                <button className={styles.bulkBtn} onClick={() => setSelected(new Set(filtered.map(e => e.id)))}>Выбрать всех</button>
                <button className={styles.bulkBtn} onClick={() => setSelected(new Set())}>Снять</button>
              </div>
            </div>

            <div className={styles.list}>
              {filtered.map(emp => {
                const isSelected = selected.has(emp.id);
                return (
                  <button key={emp.id}
                    className={`${styles.empRow} ${isSelected ? styles.empSelected : ''}`}
                    onClick={() => toggleEmployee(emp.id)}>
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
              {filtered.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '1.5rem 0' }}>
                  Нет доступных сотрудников
                </p>
              )}
            </div>

            <div className={styles.footer}>
              <span className={styles.selectedCount}>
                {selected.size > 0 ? `Выбрано: ${selected.size}` : 'Выберите сотрудников'}
              </span>
              <button className={styles.assignBtn}
                onClick={() => void handleAssign()}
                disabled={selected.size === 0 || isAssigning}>
                {isAssigning ? 'Назначаем...' : 'Назначить'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
