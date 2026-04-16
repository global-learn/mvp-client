import { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import type { Department } from '@entities/company/model/types';
import styles from './DepartmentList.module.css';

interface DepartmentListProps {
  departments: Department[];
  onAddEmployee?: (departmentId: string) => void;
}

export function DepartmentList({ departments, onAddEmployee }: DepartmentListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.list}>
      {departments.map(dept => {
        const isOpen = expanded.has(dept.id);
        return (
          <div key={dept.id} className={styles.dept}>
            <button
              className={styles.deptHeader}
              onClick={() => toggle(dept.id)}
            >
              <div className={styles.deptLeft}>
                <ChevronRight
                  size={18}
                  className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
                />
                <span className={styles.deptName}>{dept.name}</span>
              </div>
              <span className={styles.deptCount}>
                {dept.employees.length} чел.
              </span>
            </button>

            {isOpen && (
              <div className={styles.employees}>
                {dept.employees.length === 0 ? (
                  <p className={styles.empty}>Нет сотрудников</p>
                ) : (
                  dept.employees.map(emp => (
                    <div key={emp.id} className={styles.empRow}>
                      <div className={styles.empAvatar}>
                        {(emp.fullname ?? emp.email)[0].toUpperCase()}
                      </div>
                      <div className={styles.empInfo}>
                        <span className={styles.empName}>
                          {emp.fullname ?? emp.email}
                        </span>
                        <span className={styles.empEmail}>{emp.email}</span>
                      </div>
                      <span className={styles.roleBadge}>
                        {emp.role.name}
                      </span>
                    </div>
                  ))
                )}

                {onAddEmployee && (
                  <button
                    className={styles.addEmpBtn}
                    onClick={() => onAddEmployee(dept.id)}
                  >
                    <Plus size={14} />
                    Добавить сотрудника
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
