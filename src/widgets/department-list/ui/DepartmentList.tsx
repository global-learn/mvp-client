import { useState } from 'react';
import { ChevronRight, PlusCircle, UserPlus, Pencil, Trash2 } from 'lucide-react';
import type { Department } from '@entities/company/model/types';
import { ROLE_LABELS } from '@entities/user/model/types';
import styles from './DepartmentList.module.css';

interface DepartmentListProps {
  departments: Department[];
  onAddDivision?: (deptId: string, name: string) => void;
  /** ID департамента текущего пользователя (руководитель видит только свой) */
  editableDeptId?: string | null;
  /** Открыть форму инвайта с предзаполненным отделом */
  onInvite?: (divisionId: string) => void;
  /** Разрешить операции rename/delete (только admin) */
  isAdmin?: boolean;
  onRenameDept?: (id: string, name: string) => Promise<void>;
  onDeleteDept?: (id: string) => Promise<void>;
  onRenameDivision?: (id: string, name: string, deptId: string) => Promise<void>;
  onDeleteDivision?: (id: string) => Promise<void>;
}

const toggle = (set: Set<string>, id: string): Set<string> => {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
};

export function DepartmentList({
  departments,
  onAddDivision,
  editableDeptId,
  onInvite,
  isAdmin,
  onRenameDept,
  onDeleteDept,
  onRenameDivision,
  onDeleteDivision,
}: DepartmentListProps) {
  const [openDepts, setOpenDepts] = useState<Set<string>>(
    new Set(departments.slice(0, 1).map(d => d.id))
  );
  const [openDivs, setOpenDivs] = useState<Set<string>>(new Set());
  const [addingDiv, setAddingDiv] = useState<Record<string, string>>({});

  // Rename state
  type EditTarget = { type: 'dept' | 'div'; id: string; deptId?: string } | null;
  const [editing, setEditing]   = useState<EditTarget>(null);
  const [nameDraft, setNameDraft] = useState('');

  // Delete confirm state
  type ConfirmTarget = { type: 'dept' | 'div'; id: string; deptId?: string } | null;
  const [confirming, setConfirming] = useState<ConfirmTarget>(null);
  const [saving, setSaving] = useState(false);

  const totalEmp = (dept: Department) =>
    dept.divisions.reduce((n, d) => n + d.employees.length, 0);

  const canEditDept = (deptId: string): boolean => {
    if (!onAddDivision) return false;
    if (editableDeptId === undefined) return true;
    return editableDeptId === deptId;
  };

  // ── Add division inline form ──────────────────────────────────────
  const startAddDiv = (deptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDepts(s => { const n = new Set(s); n.add(deptId); return n; });
    setAddingDiv(prev => ({ ...prev, [deptId]: '' }));
  };

  const commitAddDiv = (deptId: string) => {
    const name = addingDiv[deptId]?.trim();
    if (name && onAddDivision) onAddDivision(deptId, name);
    setAddingDiv(prev => { const n = { ...prev }; delete n[deptId]; return n; });
  };

  const cancelAddDiv = (deptId: string) => {
    setAddingDiv(prev => { const n = { ...prev }; delete n[deptId]; return n; });
  };

  // ── Rename ────────────────────────────────────────────────────────
  const startRename = (e: React.MouseEvent, type: 'dept' | 'div', id: string, currentName: string, deptId?: string) => {
    e.stopPropagation();
    setConfirming(null);
    setEditing({ type, id, deptId });
    setNameDraft(currentName);
  };

  const saveRename = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!editing || !nameDraft.trim() || saving) return;
    setSaving(true);
    try {
      if (editing.type === 'dept' && onRenameDept) {
        await onRenameDept(editing.id, nameDraft.trim());
      } else if (editing.type === 'div' && onRenameDivision && editing.deptId) {
        await onRenameDivision(editing.id, nameDraft.trim(), editing.deptId);
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(null);
  };

  // ── Delete confirm ────────────────────────────────────────────────
  const startDelete = (e: React.MouseEvent, type: 'dept' | 'div', id: string, deptId?: string) => {
    e.stopPropagation();
    setEditing(null);
    setConfirming({ type, id, deptId });
  };

  const doDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirming || saving) return;
    setSaving(true);
    try {
      if (confirming.type === 'dept' && onDeleteDept) {
        await onDeleteDept(confirming.id);
      } else if (confirming.type === 'div' && onDeleteDivision) {
        await onDeleteDivision(confirming.id);
      }
      setConfirming(null);
    } finally {
      setSaving(false);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(null);
  };

  return (
    <div className={styles.list}>
      {departments.map(dept => {
        const isDeptOpen = openDepts.has(dept.id);
        const isAdding   = dept.id in addingDiv;
        const editable   = canEditDept(dept.id);
        const isRenamingDept  = editing?.type === 'dept'  && editing.id === dept.id;
        const isConfirmingDept = confirming?.type === 'dept' && confirming.id === dept.id;

        return (
          <div key={dept.id} className={styles.dept}>

            {/* ── Заголовок департамента ── */}
            <button
              className={styles.deptHeader}
              onClick={() => {
                if (!isRenamingDept) setOpenDepts(s => toggle(s, dept.id));
              }}
            >
              <div className={styles.deptLeft}>
                {isRenamingDept ? (
                  <input
                    className={styles.renameInput}
                    value={nameDraft}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                    onChange={e => setNameDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  void saveRename(e);
                      if (e.key === 'Escape') cancelRename(e as unknown as React.MouseEvent);
                    }}
                  />
                ) : (
                  <>
                    <ChevronRight
                      size={16}
                      className={`${styles.chevron} ${isDeptOpen ? styles.open : ''}`}
                    />
                    <span className={styles.deptName}>{dept.name}</span>
                  </>
                )}
              </div>

              <div className={styles.deptRight}>
                {isRenamingDept ? (
                  <div className={styles.renameActions}>
                    <button
                      className={styles.renameSave}
                      disabled={!nameDraft.trim() || saving}
                      onClick={e => void saveRename(e)}
                    >
                      Сохранить
                    </button>
                    <button className={styles.renameCancel} onClick={cancelRename}>
                      Отмена
                    </button>
                  </div>
                ) : isConfirmingDept ? (
                  <div className={styles.inlineConfirm}>
                    <span className={styles.confirmLabel}>Удалить?</span>
                    <button className={styles.confirmYes} disabled={saving} onClick={e => void doDelete(e)}>
                      Да
                    </button>
                    <button className={styles.confirmNo} onClick={cancelDelete}>
                      Нет
                    </button>
                  </div>
                ) : (
                  <>
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
                    {isAdmin && onRenameDept && (
                      <button
                        className={styles.iconBtn}
                        title="Переименовать"
                        onClick={e => startRename(e, 'dept', dept.id, dept.name)}
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    {isAdmin && onDeleteDept && (
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Удалить департамент"
                        onClick={e => startDelete(e, 'dept', dept.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <span className={styles.deptCount}>{totalEmp(dept)} чел.</span>
                  </>
                )}
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
                    if (e.key === 'Enter')  commitAddDiv(dept.id);
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
                    const isDivOpen       = openDivs.has(div.id);
                    const isRenamingDiv   = editing?.type === 'div'  && editing.id === div.id;
                    const isConfirmingDiv = confirming?.type === 'div' && confirming.id === div.id;

                    return (
                      <div key={div.id} className={styles.division}>

                        {/* ── Заголовок отдела ── */}
                        <div className={styles.divHeaderRow}>
                          {isRenamingDiv ? (
                            /* Полностью заменяем строку в режиме rename */
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, padding: '0.5rem 1rem 0.5rem 2.25rem' }}
                            >
                              <input
                                className={styles.renameInputDiv}
                                value={nameDraft}
                                autoFocus
                                onChange={e => setNameDraft(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter')  void saveRename(e);
                                  if (e.key === 'Escape') cancelRename(e as unknown as React.MouseEvent);
                                }}
                              />
                              <button
                                className={styles.renameSave}
                                disabled={!nameDraft.trim() || saving}
                                onClick={e => void saveRename(e)}
                              >
                                Сохранить
                              </button>
                              <button className={styles.renameCancel} onClick={cancelRename}>
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <>
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
                                </div>
                              </button>

                              <div className={styles.divActions}>
                                {isConfirmingDiv ? (
                                  <div className={styles.inlineConfirm}>
                                    <span className={styles.confirmLabel}>Удалить?</span>
                                    <button className={styles.confirmYes} disabled={saving} onClick={e => void doDelete(e)}>
                                      Да
                                    </button>
                                    <button className={styles.confirmNo} onClick={cancelDelete}>
                                      Нет
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {isAdmin && onRenameDivision && (
                                      <button
                                        className={styles.iconBtn}
                                        title="Переименовать"
                                        onClick={e => startRename(e, 'div', div.id, div.name, div.departmentId)}
                                      >
                                        <Pencil size={12} />
                                      </button>
                                    )}
                                    {isAdmin && onDeleteDivision && (
                                      <button
                                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                        title="Удалить отдел"
                                        onClick={e => startDelete(e, 'div', div.id, div.departmentId)}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
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
                                  </>
                                )}
                              </div>
                            </>
                          )}
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
