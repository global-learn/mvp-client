import { useState } from 'react';
import { ChevronRight, Headset, PlusCircle, UserPlus } from 'lucide-react';
import type { Department } from '@entities/company/model/types';
import { ROLE_LABELS } from '@entities/user/model/types';
import styles from './DepartmentList.module.css';

interface DepartmentListProps {
  departments: Department[];
  /** Вызывается когда нужно добавить отдел в departmentId. */
  onAddDivision?: (deptId: string, name: string) => void;
  /** ID департамента текущего пользователя (руководитель видит только свой) */
  editableDeptId?: string | null;
  /** Открыть форму инвайта с предзаполненным отделом */
  onInvite?: (divisionId: string) => void;
}

const toggle = (set: Set<string>, id: string): Set<string> => {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
};

export function DepartmentList({ departments, onAddDivision, editableDeptId, onInvite }: DepartmentListProps) {
  const [openDepts, setOpenDepts] = useState<Set<string>>(
    new Set(departments.slice(0, 1).map(d => d.id))
  );
  const [openDivs, setOpenDivs] = useState<Set<string>>(new Set());
  // deptId → временное поле ввода названия нового отдела
  const [addingDiv, setAddingDiv] = useState<Record<string, string>>({});

  const totalEmp = (dept: Department) =>
    dept.divisions.reduce((n, d) => n + d.employees.length, 0);

  const canEditDept = (deptId: string): boolean => {
    if (!onAddDivision) return false;
    if (editableDeptId === undefined) return true; // admin — all
    return editableDeptId === deptId;
  };

  const startAddDiv = (deptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDepts(s => { const n = new Set(s); n.add(deptId); return n; });
    setAddingDiv(prev => ({ ...prev, [deptId]: '' }));
  };

  const commitAddDiv = (deptId: string) => {
    const name = addingDiv[deptId]?.trim();
    if (name && onAddDivision) {
      onAddDivision(deptId, name);
    }
    setAddingDiv(prev => { const n = { ...prev }; delete n[deptId]; return n; });
  };

  const cancelAddDiv = (deptId: string) => {
    setAddingDiv(prev => { const n = { ...prev }; delete n[deptId]; return n; });
  };

  return (
    <div className={styles.list}>
      {departments.map(dept => {
        const isDeptOpen = openDepts.has(dept.id);
        const isAdding = dept.id in addingDiv;
        const editable = canEditDept(dept.id);

        return (
          <div key={dept.id} className={styles.dept}>

            {/* ── Заголовок департамента ── */}
            <button
              className={styles.deptHeader}
              onClick={() => setOpenDepts(s => toggle(s, dept.id))}
            >
              <div className={styles.deptLeft}>
                <ChevronRight
                  size={16}
                  className={`${styles.chevron} ${isDeptOpen ? styles.open : ''}`}
                />
                <span className={styles.deptName}>{dept.name}</span>
              </div>
              <div className={styles.deptRight}>
                {editable && !isAdding && (
                  <button
                    className={styles.addDivBtn}
                    onClick={e => startAddDiv(dept.id, e)}
                    title="Добавить отдел"
                  >
                    <PlusCircle size={12} />
                    Добавить отдел
                  </button>
                )}
                <span className={styles.deptCount}>{totalEmp(dept)} чел.</span>
              </div>
            </button>

            {/* Форма добавления отдела */}
            {isAdding && (
              <div className={styles.addDivForm}>
                <input
                  className={styles.addDivInput}
                  placeholder="Название нового отдела..."
                  value={addingDiv[dept.id] ?? ''}
                  onChange={e => setAddingDiv(prev => ({ ...prev, [dept.id]: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitAddDiv(dept.id);
                    if (e.key === 'Escape') cancelAddDiv(dept.id);
                  }}
                  autoFocus
                />
                <button className={styles.addDivConfirm} onClick={() => commitAddDiv(dept.id)}>
                  Добавить
                </button>
                <button className={styles.addDivCancel} onClick={() => cancelAddDiv(dept.id)}>
                  Отмена
                </button>
              </div>
            )}

            {isDeptOpen && (
              <div className={styles.divisions}>
                {dept.divisions.length === 0 ? (
                  <p className={styles.empty}>Отделов нет — добавьте первый</p>
                ) : (
                  dept.divisions.map(div => {
                    const isDivOpen = openDivs.has(div.id);
                    return (
                      <div key={div.id} className={styles.division}>

                        {/* ── Заголовок отдела ── */}
                        <div className={styles.divHeaderRow}>
                          <button
                            className={styles.divHeaderBtn}
                            onClick={() => setOpenDivs(s => toggle(s, div.id))}
                          >
                            <div className={styles.divLeft}>
                              <ChevronRight
                                size={13}
                                className={`${styles.chevron} ${isDivOpen ? styles.open : ''}`}
                              />
                              <span className={styles.divName}>{div.name}</span>
                              {div.isService && (
                                <span className={styles.serviceBadge}>
                                  <Headset size={10} /> сервис
                                </span>
                              )}
                            </div>
                          </button>
                          <div className={styles.divActions}>
                            {onInvite && (
                              <button
                                className={styles.inviteDivBtn}
                                onClick={() => onInvite(div.id)}
                                title={`Пригласить в ${div.name}`}
                              >
                                <UserPlus size={12} />
                                Пригласить
                              </button>
                            )}
                            <span className={styles.divCount}>{div.employees.length} чел.</span>
                          </div>
                        </div>

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
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
