import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import styles from './AssignCourseModal.module.css';

// Mock сотрудников — синхронизировать с CompanyPage когда появится единый контекст/API
const MOCK_EMPLOYEES = [
  { id: 'emp-admin', fullname: 'Ислам Гадиляев',   email: 'admin@test.com', dept: 'IT отдел' },
  { id: 'emp-5',     fullname: 'Дмитрий Козлов',   email: 'dmitry@corp.ru', dept: 'IT отдел' },
  { id: 'emp-6',     fullname: 'Анна Серова',       email: 'anna@corp.ru',   dept: 'IT отдел' },
  { id: 'emp-2',     fullname: 'Мария Иванова',     email: 'user@test.com',  dept: 'Продажи' },
  { id: 'emp-3',     fullname: 'Сергей Волков',     email: 'serg@corp.ru',   dept: 'Продажи' },
  { id: 'emp-4',     fullname: 'Наталья Орлова',    email: 'nataly@corp.ru', dept: 'HR' },
  { id: 'emp-7',     fullname: 'Ольга Смирнова',    email: 'olga@corp.ru',   dept: 'Финансы' },
];

const DEPARTMENTS = ['IT отдел', 'Продажи', 'HR', 'Финансы'];

interface AssignCourseModalProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

export function AssignCourseModal({ courseId, courseTitle, onClose }: AssignCourseModalProps) {
  const { assignCourse } = useCourses();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deptFilter, setDeptFilter] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [done, setDone] = useState(false);

  const filtered = deptFilter
    ? MOCK_EMPLOYEES.filter(e => e.dept === deptFilter)
    : MOCK_EMPLOYEES;

  const toggleEmployee = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map(e => e.id)));
  };

  const clearAll = () => setSelected(new Set());

  const handleAssign = async () => {
    if (selected.size === 0) return;
    setIsAssigning(true);
    await Promise.all([...selected].map(userId => assignCourse(courseId, userId)));
    setIsAssigning(false);
    setDone(true);
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleBackdrop}>
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
              <select
                className={styles.select}
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="">Все отделы</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className={styles.bulkBtns}>
                <button className={styles.bulkBtn} onClick={selectAll}>Выбрать всех</button>
                <button className={styles.bulkBtn} onClick={clearAll}>Снять</button>
              </div>
            </div>

            <div className={styles.list}>
              {filtered.map(emp => {
                const isSelected = selected.has(emp.id);
                return (
                  <button
                    key={emp.id}
                    className={`${styles.empRow} ${isSelected ? styles.empSelected : ''}`}
                    onClick={() => toggleEmployee(emp.id)}
                  >
                    <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                      {isSelected && <Check size={12} />}
                    </div>
                    <div className={styles.empAvatar}>
                      {(emp.fullname)[0]}
                    </div>
                    <div className={styles.empInfo}>
                      <span className={styles.empName}>{emp.fullname}</span>
                      <span className={styles.empDept}>{emp.dept}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={styles.footer}>
              <span className={styles.selectedCount}>
                {selected.size > 0 ? `Выбрано: ${selected.size}` : 'Выберите сотрудников'}
              </span>
              <button
                className={styles.assignBtn}
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
