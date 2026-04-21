import { useState } from 'react';
import { ChevronRight, Headset } from 'lucide-react';
import type { Department } from '@entities/company/model/types';
import { ROLE_LABELS } from '@entities/user/model/types';
import styles from './DepartmentList.module.css';

interface DepartmentListProps {
  departments: Department[];
}

const toggle = (set: Set<string>, id: string): Set<string> => {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
};

export function DepartmentList({ departments }: DepartmentListProps) {
  const [openDepts, setOpenDepts] = useState<Set<string>>(
    new Set(departments.slice(0, 1).map(d => d.id))
  );
  const [openDivs, setOpenDivs] = useState<Set<string>>(new Set());

  const totalEmp = (dept: Department) =>
    dept.divisions.reduce((n, d) => n + d.employees.length, 0);

  return (
    <div className={styles.list}>
      {departments.map(dept => {
        const isDeptOpen = openDepts.has(dept.id);
        return (
          <div key={dept.id} className={styles.dept}>

            {/* ── Департамент ── */}
            <button
              className={styles.deptHeader}
              onClick={() => setOpenDepts(s => toggle(s, dept.id))}
            >
              <div className={styles.deptLeft}>
                <ChevronRight size={18} className={`${styles.chevron} ${isDeptOpen ? styles.open : ''}`} />
                <span className={styles.deptName}>{dept.name}</span>
              </div>
              <span className={styles.deptCount}>{totalEmp(dept)} чел.</span>
            </button>

            {isDeptOpen && (
              <div className={styles.divisions}>
                {dept.divisions.map(div => {
                  const isDivOpen = openDivs.has(div.id);
                  return (
                    <div key={div.id} className={styles.division}>

                      {/* ── Отдел ── */}
                      <button
                        className={styles.divHeader}
                        onClick={() => setOpenDivs(s => toggle(s, div.id))}
                      >
                        <div className={styles.divLeft}>
                          <ChevronRight size={14} className={`${styles.chevron} ${isDivOpen ? styles.open : ''}`} />
                          <span className={styles.divName}>{div.name}</span>
                          {div.isService && (
                            <span className={styles.serviceBadge}>
                              <Headset size={11} /> сервис
                            </span>
                          )}
                        </div>
                        <span className={styles.divCount}>{div.employees.length} чел.</span>
                      </button>

                      {isDivOpen && (
                        <div className={styles.employees}>
                          {div.employees.length === 0 ? (
                            <p className={styles.empty}>Нет сотрудников</p>
                          ) : (
                            div.employees.map(emp => (
                              <div key={emp.id} className={styles.empRow}>
                                <div className={styles.empAvatar}>
                                  {(emp.fullname ?? emp.email)[0].toUpperCase()}
                                </div>
                                <div className={styles.empInfo}>
                                  <span className={styles.empName}>{emp.fullname ?? emp.email}</span>
                                  <span className={styles.empEmail}>{emp.email} · {emp.position.name}</span>
                                </div>
                                <span className={styles.roleBadge}>{ROLE_LABELS[emp.role.name]}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
