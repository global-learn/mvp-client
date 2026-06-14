import { useMemo, useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import type { EmployeeForAssignment } from '@entities/course/model/types';
import styles from './AssignCourseModal.module.css';

interface AssignCourseModalProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

export function AssignCourseModal({ courseId, courseTitle, onClose }: AssignCourseModalProps) {
  const { assignCourseBulk, getAssignableEmployees } = useCourses();

  const [employees, setEmployees]     = useState<EmployeeForAssignment[]>([]);
  const [loadingEmps, setLoadingEmps] = useState(true);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [deptFilter, setDeptFilter]   = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [done, setDone]               = useState(false);

  useEffect(() => {
    void getAssignableEmployees().then(emps => {
      setEmployees(emps);
      setLoadingEmps(false);
    });
  }, [getAssignableEmployees]);

  const departments = useMemo(() => {
    const seen = new Map<string, string>();
    employees.forEach(e => {
      if (e.department.id) seen.set(e.department.id, e.department.name);
    });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [employees]);

  const filteredEmployees = deptFilter
    ? employees.filter(e => e.department.id === deptFilter)
    : employees;

  const toggleId = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filteredEmployees.map(e => e.userId)));
  const clearAll  = () => setSelected(new Set());

  const handleAssign = async () => {
    if (selected.size === 0) return;
    setIsAssigning(true);
    try {
      await assignCourseBulk(courseId, [...selected]);
      setDone(true);
    } catch { /* тост уже показан в контексте */ }
    finally { setIsAssigning(false); }
  };

  const successLabel = `Курс назначен ${selected.size} сотрудник${selected.size === 1 ? 'у' : 'ам'}`;

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
            <div className={styles.filters}>
              {departments.length > 1 && (
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
              {loadingEmps ? (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '1.5rem 0' }}>
                  Загрузка...
                </p>
              ) : filteredEmployees.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '1.5rem 0' }}>
                  Нет доступных сотрудников
                </p>
              ) : (
                filteredEmployees.map(emp => {
                  const isSelected = selected.has(emp.userId);
                  return (
                    <button key={emp.userId}
                      className={`${styles.empRow} ${isSelected ? styles.empSelected : ''}`}
                      onClick={() => toggleId(emp.userId)}
                    >
                      <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <div className={styles.empAvatar}>
                        {(emp.fullname || emp.email || emp.userId)[0]}
                      </div>
                      <div className={styles.empInfo}>
                        <span className={styles.empName}>{emp.fullname || emp.email || emp.userId}</span>
                        <span className={styles.empDept}>{emp.division.name}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className={styles.footer}>
              <span className={styles.selectedCount}>
                {selected.size > 0 ? `Выбрано: ${selected.size}` : `Выберите сотрудников`}
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
