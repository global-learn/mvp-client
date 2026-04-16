import { useState } from 'react';
import { UserPlus, X, Check } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { canAssignCourses } from '@entities/user/model/types';
import { useCourses } from '@entities/course/model/CoursesContext';
import type { EmployeeForAssignment } from '@entities/course/model/types';
import styles from './AssignCourse.module.css';

interface AssignCourseButtonProps {
  courseId: string;
  courseTitle: string;
}

export function AssignCourseButton({ courseId, courseTitle }: AssignCourseButtonProps) {
  const { user } = useUser();
  const { assignCourse, getAssignableEmployees } = useCourses();

  const [isOpen, setIsOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeForAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);

  if (!canAssignCourses(user)) return null;

  const open = async () => {
    setIsOpen(true);
    setIsLoading(true);
    const list = await getAssignableEmployees();
    setEmployees(list);
    setIsLoading(false);
  };

  const close = () => {
    setIsOpen(false);
    setEmployees([]);
    setAssigned(new Set());
  };

  const handleAssign = async (emp: EmployeeForAssignment) => {
    if (assigned.has(emp.userId) || pending === emp.userId) return;
    setPending(emp.userId);
    await assignCourse(courseId, emp.userId);
    setAssigned(prev => new Set(prev).add(emp.userId));
    setPending(null);
  };

  return (
    <>
      <button className={styles.assignBtn} onClick={() => void open()}>
        <UserPlus size={16} />
        Назначить
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) close(); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Назначить курс</h2>
                <p className={styles.modalSub}>«{courseTitle}»</p>
              </div>
              <button className={styles.closeBtn} onClick={close}><X size={18} /></button>
            </div>

            {isLoading ? (
              <p className={styles.loadingText}>Загрузка сотрудников...</p>
            ) : employees.length === 0 ? (
              <p className={styles.emptyText}>Нет доступных сотрудников для назначения</p>
            ) : (
              <ul className={styles.list}>
                {employees.map(emp => {
                  const isDone = assigned.has(emp.userId);
                  const isPending = pending === emp.userId;
                  return (
                    <li key={emp.userId} className={styles.item}>
                      <div className={styles.empAvatar}>
                        {(emp.fullname ?? emp.email)[0].toUpperCase()}
                      </div>
                      <div className={styles.empInfo}>
                        <span className={styles.empName}>{emp.fullname ?? emp.email}</span>
                        <span className={styles.empMeta}>
                          {emp.department.name} · {emp.role.name}
                        </span>
                      </div>
                      <button
                        className={`${styles.itemBtn} ${isDone ? styles.done : ''}`}
                        onClick={() => void handleAssign(emp)}
                        disabled={isDone || isPending}
                      >
                        {isDone ? (
                          <><Check size={14} /> Назначен</>
                        ) : isPending ? (
                          'Назначаем...'
                        ) : (
                          'Назначить'
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
