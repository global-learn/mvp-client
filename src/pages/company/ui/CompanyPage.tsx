import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, X, Users, PlusCircle, Building2, Briefcase, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, ROLE_LABELS, type EmployeeRole } from '@entities/user/model/types';
import type { Department, EmployeeListItem } from '@entities/company/model/types';
import { DepartmentList } from '@widgets/department-list/ui/DepartmentList';
import { departmentApi, divisionApi, positionApi } from '@entities/company/api/companyApi';
import { employeeApi, roleApi } from '@entities/user/api/employeeApi';
import type { DepartmentDto, DivisionDto, PositionDto, RoleDto, EmployeeDto } from '@shared/api/schemas';
import { toast } from '@shared/lib/toast';
import styles from './Company.module.css';

type Tab = 'departments' | 'employees' | 'positions';

function formatRoleLabel(roleName: string): string {
  const normalized = roleName.toLowerCase().replace(/\s+/g, '_') as EmployeeRole;
  return ROLE_LABELS[normalized] ?? roleName;
}

function parseEmployeeRole(raw: string): EmployeeRole {
  const normalized = raw.toLowerCase().replace(/\s+/g, '_') as EmployeeRole;
  const valid: EmployeeRole[] = ['admin', 'department_head', 'division_head', 'senior_manager', 'manager'];
  return valid.includes(normalized) ? normalized : 'manager';
}

function mapToListItem(
  emp: EmployeeDto,
  divMap: Map<string, DivisionDto>,
  posMap: Map<string, PositionDto>,
): EmployeeListItem {
  const div = divMap.get(emp.divisionId);
  const pos = emp.positionId ? posMap.get(emp.positionId) : undefined;
  return {
    id:             emp.id,
    fullname:       emp.fullname,
    email:          emp.email,
    role:           { id: emp.role.id, name: parseEmployeeRole(emp.role.name) },
    department:     emp.department,
    division:       div ? { id: div.id, name: div.name } : { id: emp.divisionId, name: emp.divisionId },
    position:       pos ? { id: pos.id, name: pos.name } : { id: '', name: '—' },
    birthDate:      '',
    employmentDate: emp.employmentDate,
  };
}

const defaultForm = {
  email: '',
  fullname: '',
  divisionId: '',
  positionId: '',
  employmentDate: new Date().toISOString().slice(0, 10),
};

// ── Employee Detail Modal ────────────────────────────────────────

interface EmployeeDetailModalProps {
  emp: EmployeeListItem;
  rawEmp: EmployeeDto;
  isAdmin: boolean;
  divisionsList: Array<{ id: string; name: string; deptName: string }>;
  positionsList: PositionDto[];
  onClose: () => void;
  onLoad: () => Promise<void>;
}

function EmployeeDetailModal({
  emp, rawEmp, isAdmin, divisionsList, positionsList, onClose, onLoad,
}: EmployeeDetailModalProps) {
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [form, setForm] = useState({
    fullname:   rawEmp.fullname ?? '',
    biography:  rawEmp.biography ?? '',
    divisionId: rawEmp.divisionId,
    positionId: rawEmp.positionId ?? '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await employeeApi.update(rawEmp.id, {
        fullname:   form.fullname || undefined,
        biography:  form.biography || null,
        divisionId: form.divisionId || undefined,
        positionId: form.positionId || null,
      });
      setEditing(false);
      await onLoad();
      toast.success('Данные сотрудника обновлены');
    } catch (err) {
      toast.apiError(err, 'Не удалось обновить данные');
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = async () => {
    setSaving(true);
    try {
      await employeeApi.dismiss(rawEmp.id);
      onClose();
      await onLoad();
      toast.success('Сотрудник уволен');
    } catch (err) {
      toast.apiError(err, 'Не удалось уволить сотрудника');
    } finally {
      setSaving(false);
    }
  };

  const infoRows: [string, string][] = [
    ['Департамент',          emp.department.name],
    ['Отдел',                emp.division.name],
    ['Должность',            emp.position.name],
    ['Роль',                 ROLE_LABELS[emp.role.name] ?? emp.role.name],
    ['Дата трудоустройства', new Date(emp.employmentDate).toLocaleDateString('ru-RU')],
  ];
  if (rawEmp.biography) infoRows.push(['Биография', rawEmp.biography]);

  return (
    <div
      className={styles.overlay}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal} style={{ maxWidth: 520 }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {editing ? 'Редактировать сотрудника' : 'Карточка сотрудника'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Avatar + name row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div
            className={styles.empAvatar}
            style={{ width: 52, height: 52, fontSize: '1.25rem', flexShrink: 0 }}
          >
            {(emp.fullname ?? emp.email)[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>
              {emp.fullname ?? '—'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{emp.email}</div>
          </div>
        </div>

        {editing ? (
          <div className={styles.form}>
            <label className={styles.label}>
              ФИО
              <input
                className={styles.input}
                value={form.fullname}
                onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))}
              />
            </label>
            <label className={styles.label}>
              Биография
              <textarea
                className={styles.input}
                value={form.biography}
                onChange={e => setForm(p => ({ ...p, biography: e.target.value }))}
                rows={3}
                style={{ resize: 'vertical' as const }}
              />
            </label>
            <label className={styles.label}>
              Отдел
              <select
                className={styles.input}
                value={form.divisionId}
                onChange={e => setForm(p => ({ ...p, divisionId: e.target.value }))}
              >
                {divisionsList.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.deptName})</option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Должность
              <select
                className={styles.input}
                value={form.positionId}
                onChange={e => setForm(p => ({ ...p, positionId: e.target.value }))}
              >
                <option value="">— не указана —</option>
                {positionsList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Отмена</button>
              <button
                className={styles.submitBtn}
                disabled={saving}
                onClick={() => void handleSave()}
              >
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
              {infoRows.map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: '0.8125rem', color: 'var(--muted-foreground)',
                    minWidth: 150, flexShrink: 0,
                  }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: 500 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className={styles.modalActions}>
                {confirming ? (
                  <>
                    <span style={{
                      fontSize: '0.875rem', color: '#dc2626',
                      fontWeight: 500, marginRight: 'auto',
                    }}>
                      Уволить сотрудника?
                    </span>
                    <button className={styles.cancelBtn} onClick={() => setConfirming(false)}>
                      Отмена
                    </button>
                    <button
                      disabled={saving}
                      onClick={() => void handleDismiss()}
                      style={{
                        padding: '0.5625rem 1.125rem',
                        background: '#dc2626', color: '#fff',
                        border: 'none', borderRadius: 'var(--radius-md)',
                        fontWeight: 700, fontFamily: 'inherit',
                        cursor: 'pointer', fontSize: '0.875rem',
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {saving ? '...' : 'Уволить'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={styles.cancelBtn}
                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={() => setConfirming(true)}
                    >
                      Уволить
                    </button>
                    <button className={styles.submitBtn} onClick={() => setEditing(true)}>
                      Редактировать
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Positions Tab ────────────────────────────────────────────────

interface PositionNode extends PositionDto {
  depth: number;
  children: PositionNode[];
}

function buildPositionTree(positions: PositionDto[]): PositionNode[] {
  const byId = new Map<string, PositionNode>(
    positions.map(p => [p.id, { ...p, depth: 0, children: [] }])
  );
  const roots: PositionNode[] = [];
  for (const p of positions) {
    const node = byId.get(p.id)!;
    if (p.parentId && byId.has(p.parentId)) {
      byId.get(p.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  // assign depths
  const assignDepth = (nodes: PositionNode[], depth: number) => {
    for (const n of nodes) {
      n.depth = depth;
      assignDepth(n.children, depth + 1);
    }
  };
  assignDepth(roots, 0);
  return roots;
}

function flattenPositionTree(nodes: PositionNode[]): PositionNode[] {
  return nodes.flatMap(n => [n, ...flattenPositionTree(n.children)]);
}

interface PositionsTabProps {
  rawPositions: PositionDto[];
  onLoad: () => Promise<void>;
}

function PositionsTab({ rawPositions, onLoad }: PositionsTabProps) {
  const tree = useMemo(() => buildPositionTree(rawPositions), [rawPositions]);
  const flat = useMemo(() => flattenPositionTree(tree), [tree]);
  const posMap = useMemo(() => new Map(rawPositions.map(p => [p.id, p])), [rawPositions]);

  // Create form
  const [addOpen, setAddOpen]         = useState(false);
  const [newName, setNewName]         = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [creating, setCreating]       = useState(false);

  // Rename
  const [renamingId, setRenamingId]   = useState<string | null>(null);
  const [nameDraft, setNameDraft]     = useState('');
  const [saving, setSaving]           = useState(false);

  // Delete confirm
  const [confirmId, setConfirmId]     = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await positionApi.create({ name, parentId: newParentId || null });
      setNewName('');
      setNewParentId('');
      setAddOpen(false);
      await onLoad();
      toast.success('Должность добавлена');
    } catch (err) {
      toast.apiError(err, 'Не удалось создать должность');
    } finally {
      setCreating(false);
    }
  };

  const startRename = (pos: PositionDto) => {
    setConfirmId(null);
    setRenamingId(pos.id);
    setNameDraft(pos.name);
  };

  const saveRename = async (id: string) => {
    if (!nameDraft.trim() || saving) return;
    setSaving(true);
    try {
      const pos = posMap.get(id);
      await positionApi.update(id, { name: nameDraft.trim(), parentId: pos?.parentId ?? null });
      setRenamingId(null);
      await onLoad();
      toast.success('Должность переименована');
    } catch (err) {
      toast.apiError(err, 'Не удалось переименовать');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: string) => {
    setDeleting(true);
    try {
      await positionApi.delete(id);
      setConfirmId(null);
      await onLoad();
      toast.success('Должность удалена');
    } catch (err) {
      toast.apiError(err, 'Не удалось удалить должность');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ marginBottom: '1rem' }}>
        {!addOpen ? (
          <button
            onClick={() => setAddOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.4375rem 0.875rem',
              background: 'transparent',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--primary)',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <PlusCircle size={15} /> Добавить должность
          </button>
        ) : (
          <div style={{
            display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap',
            padding: '0.75rem 1rem',
            background: 'var(--primary-light)',
            border: '1px dashed rgba(79,70,229,0.2)',
            borderRadius: 'var(--radius-md)',
          }}>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  void handleCreate();
                if (e.key === 'Escape') { setAddOpen(false); setNewName(''); setNewParentId(''); }
              }}
              placeholder="Название должности..."
              style={{
                padding: '0.4375rem 0.75rem',
                border: '1.5px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem', fontFamily: 'inherit',
                outline: 'none', width: 260,
                boxShadow: '0 0 0 3px var(--ring)',
                background: 'var(--card)',
                color: 'var(--foreground)',
              }}
            />
            <select
              value={newParentId}
              onChange={e => setNewParentId(e.target.value)}
              style={{
                padding: '0.4375rem 0.75rem',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem', fontFamily: 'inherit',
                background: 'var(--card)',
                color: 'var(--foreground)',
                outline: 'none',
              }}
            >
              <option value="">Без родителя (корневая)</option>
              {rawPositions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={() => void handleCreate()}
              disabled={!newName.trim() || creating}
              style={{
                padding: '0.4375rem 0.875rem', background: 'var(--primary)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem',
                opacity: !newName.trim() || creating ? 0.6 : 1,
              }}
            >
              {creating ? 'Создаём...' : 'Добавить'}
            </button>
            <button
              onClick={() => { setAddOpen(false); setNewName(''); setNewParentId(''); }}
              style={{
                padding: '0.4375rem 0.75rem', background: 'transparent',
                border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem',
                color: 'var(--muted-foreground)',
              }}
            >
              Отмена
            </button>
          </div>
        )}
      </div>

      {/* Positions list */}
      {flat.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
          <Briefcase size={36} style={{ opacity: 0.25, display: 'block', margin: '0 auto 0.75rem' }} />
          Должностей пока нет — добавьте первую
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {flat.map(pos => {
            const isRenaming  = renamingId === pos.id;
            const isConfirming = confirmId === pos.id;
            const parentName  = pos.parentId ? posMap.get(pos.parentId)?.name : null;

            return (
              <div
                key={pos.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 1rem',
                  paddingLeft: `${1 + pos.depth * 1.75}rem`,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}
              >
                {/* Indent connector */}
                {pos.depth > 0 && (
                  <ChevronRight size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0, opacity: 0.5 }} />
                )}

                {/* Name or rename input */}
                {isRenaming ? (
                  <>
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={e => setNameDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  void saveRename(pos.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      style={{
                        flex: 1, padding: '0.25rem 0.5rem',
                        border: '1.5px solid var(--primary)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--card)', color: 'var(--foreground)',
                        fontSize: '0.9375rem', fontWeight: 600,
                        fontFamily: 'inherit', outline: 'none',
                        boxShadow: '0 0 0 3px var(--ring)',
                      }}
                    />
                    <button
                      disabled={!nameDraft.trim() || saving}
                      onClick={() => void saveRename(pos.id)}
                      style={{
                        padding: '0.25rem 0.625rem', background: 'var(--primary)',
                        color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem', fontWeight: 600,
                        fontFamily: 'inherit', cursor: 'pointer',
                        opacity: !nameDraft.trim() || saving ? 0.6 : 1,
                      }}
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      style={{
                        padding: '0.25rem 0.5rem', background: 'transparent',
                        border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem', fontFamily: 'inherit',
                        color: 'var(--muted-foreground)', cursor: 'pointer',
                      }}
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{
                      flex: 1, fontSize: '0.9375rem', fontWeight: 600,
                      color: 'var(--foreground)',
                    }}>
                      {pos.name}
                    </span>
                    {parentName && (
                      <span style={{
                        fontSize: '0.75rem', color: 'var(--muted-foreground)',
                        background: 'var(--secondary)', padding: '0.125rem 0.5rem',
                        borderRadius: '3px', border: '1px solid var(--border)',
                        flexShrink: 0,
                      }}>
                        {parentName}
                      </span>
                    )}

                    {isConfirming ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.8125rem', color: '#dc2626', fontWeight: 500 }}>Удалить?</span>
                        <button
                          disabled={deleting}
                          onClick={() => void doDelete(pos.id)}
                          style={{
                            padding: '0.1875rem 0.625rem', background: '#dc2626',
                            color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                            opacity: deleting ? 0.6 : 1,
                          }}
                        >
                          Да
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          style={{
                            padding: '0.1875rem 0.5rem', background: 'transparent',
                            border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem', fontFamily: 'inherit',
                            color: 'var(--muted-foreground)', cursor: 'pointer',
                          }}
                        >
                          Нет
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                          onClick={() => startRename(pos)}
                          title="Переименовать"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28,
                            border: 'none', borderRadius: 'var(--radius-md)',
                            background: 'transparent', color: 'var(--muted-foreground)',
                            cursor: 'pointer', transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--secondary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => { setRenamingId(null); setConfirmId(pos.id); }}
                          title="Удалить"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28,
                            border: 'none', borderRadius: 'var(--radius-md)',
                            background: 'transparent', color: 'var(--muted-foreground)',
                            cursor: 'pointer', transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; (e.currentTarget as HTMLButtonElement).style.color = '#dc2626'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export function CompanyPage() {
  const { user }   = useUser();
  const navigate   = useNavigate();
  const adminUser  = isAdmin(user);

  const [rawDepts, setRawDepts]         = useState<DepartmentDto[]>([]);
  const [rawDivisions, setRawDivisions] = useState<DivisionDto[]>([]);
  const [rawEmployees, setRawEmployees] = useState<EmployeeDto[]>([]);
  const [rawPositions, setRawPositions] = useState<PositionDto[]>([]);
  const [roles, setRoles]               = useState<RoleDto[]>([]);
  const [isLoading, setIsLoading]       = useState(true);

  const [tab, setTab]               = useState<Tab>('departments');
  const [search, setSearch]         = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [addOpen, setAddOpen]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addingDept, setAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!isAdmin(user)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [depts, divs, emps, pos, rls] = await Promise.all([
        departmentApi.list({ page: 1, limit: 200 }),
        divisionApi.list({ page: 1, limit: 200 }),
        employeeApi.list({ page: 1, limit: 500 }),
        positionApi.list({ page: 1, limit: 200 }),
        roleApi.list({ page: 1, limit: 50 }),
      ]);
      setRawDepts(depts.data);
      setRawDivisions(divs.data);
      setRawEmployees(emps.data);
      setRawPositions(pos.data);
      setRoles(rls.data);
    } catch (err) {
      toast.apiError(err, 'Не удалось загрузить данные компании');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (!isAdmin(user)) return null;

  // ── Maps for fast lookups ────────────────────────────────────────
  const divMap = useMemo(() => new Map(rawDivisions.map(d => [d.id, d])), [rawDivisions]);
  const posMap = useMemo(() => new Map(rawPositions.map(p => [p.id, p])), [rawPositions]);

  // ── Org tree ──────────────────────────────────────────────────────
  const org = useMemo<Department[]>(() => {
    const empByDiv = new Map<string, EmployeeDto[]>();
    for (const emp of rawEmployees) {
      const list = empByDiv.get(emp.divisionId) ?? [];
      list.push(emp);
      empByDiv.set(emp.divisionId, list);
    }
    return rawDepts.map(dept => ({
      id:   dept.id,
      name: dept.name,
      divisions: rawDivisions
        .filter(div => div.departmentId === dept.id)
        .map(div => ({
          id:           div.id,
          name:         div.name,
          departmentId: div.departmentId,
          positions:    [],
          employees:    (empByDiv.get(div.id) ?? []).map(e => mapToListItem(e, divMap, posMap)),
        })),
    }));
  }, [rawDepts, rawDivisions, rawEmployees, divMap, posMap]);

  const allEmployees = useMemo<EmployeeListItem[]>(
    () => rawEmployees.map(e => mapToListItem(e, divMap, posMap)),
    [rawEmployees, divMap, posMap],
  );

  const allDivisions = useMemo(
    () => rawDivisions.map(div => {
      const dept = rawDepts.find(d => d.id === div.departmentId);
      return { id: div.id, name: div.name, deptId: div.departmentId, deptName: dept?.name ?? '' };
    }),
    [rawDivisions, rawDepts],
  );

  const availableDivisions = adminUser
    ? allDivisions
    : allDivisions.filter(d => d.deptId === user.employee?.department.id);

  const availablePositions = rawPositions;

  const editableDeptId: string | null | undefined = adminUser ? undefined : (user.employee?.department.id ?? null);

  const filtered = useMemo(() => {
    let list = allEmployees;
    if (!adminUser) list = list.filter(e => e.department.id === user.employee?.department.id);
    const q = search.toLowerCase();
    if (q) list = list.filter(e => (e.fullname ?? '').toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
    if (deptFilter) list = list.filter(e => e.department.id === deptFilter);
    if (roleFilter) {
      const matchIds = new Set(rawEmployees.filter(e => e.role.id === roleFilter).map(e => e.id));
      list = list.filter(e => matchIds.has(e.id));
    }
    return list;
  }, [allEmployees, rawEmployees, search, deptFilter, roleFilter, adminUser, user]);

  // ── Department actions ────────────────────────────────────────────
  const handleAddDepartment = async () => {
    const name = newDeptName.trim();
    if (!name) return;
    try {
      await departmentApi.create(name);
      setNewDeptName('');
      setAddingDept(false);
      await load();
    } catch (err) {
      toast.apiError(err, 'Не удалось создать департамент');
    }
  };

  const handleRenameDepartment = async (id: string, name: string) => {
    try {
      await departmentApi.update(id, name);
      await load();
      toast.success('Департамент переименован');
    } catch (err) {
      toast.apiError(err, 'Не удалось переименовать департамент');
      throw err;
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      await departmentApi.delete(id);
      await load();
      toast.success('Департамент удалён');
    } catch (err) {
      toast.apiError(err, 'Не удалось удалить департамент');
      throw err;
    }
  };

  const handleAddDivision = async (deptId: string, name: string) => {
    try {
      await divisionApi.create({ name, departmentId: deptId });
      await load();
    } catch (err) {
      toast.apiError(err, 'Не удалось создать отдел');
    }
  };

  const handleRenameDivision = async (id: string, name: string, deptId: string) => {
    try {
      await divisionApi.update(id, { name, departmentId: deptId });
      await load();
      toast.success('Отдел переименован');
    } catch (err) {
      toast.apiError(err, 'Не удалось переименовать отдел');
      throw err;
    }
  };

  const handleDeleteDivision = async (id: string) => {
    try {
      await divisionApi.delete(id);
      await load();
      toast.success('Отдел удалён');
    } catch (err) {
      toast.apiError(err, 'Не удалось удалить отдел');
      throw err;
    }
  };

  const handleInviteFromDiv = (divisionId: string) => {
    setForm(f => ({ ...f, divisionId, positionId: '' }));
    setAddOpen(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.divisionId) { toast.error('Выберите отдел'); return; }
    setSubmitting(true);
    try {
      await employeeApi.create({
        email:          form.email,
        fullname:       form.fullname,
        divisionId:     form.divisionId,
        employmentDate: new Date(form.employmentDate).toISOString(),
        positionId:     form.positionId || null,
      });
      setAddOpen(false);
      setForm(defaultForm);
      await load();
      toast.success('Сотрудник добавлен');
    } catch (err) {
      toast.apiError(err, 'Не удалось добавить сотрудника');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '3rem', color: 'var(--muted-foreground)' }}>Загрузка...</div>;
  }

  return (
    <div className={styles.page}>

      {/* ── Заголовок ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitleRow}>
            <h1 className={styles.pageTitle}>Компания</h1>
            <span className={styles.totalBadge}>{allEmployees.length} сотрудников</span>
          </div>
          <p className={styles.pageSubtitle}>Структура организации и управление персоналом</p>
        </div>
        <button className={styles.inviteBtn} onClick={() => setAddOpen(true)}>
          <UserPlus size={16} /> Добавить сотрудника
        </button>
      </div>

      {/* ── Табы ── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'departments' ? styles.activeTab : ''}`}
          onClick={() => setTab('departments')}
        >
          <Building2 size={15} /> По отделам
        </button>
        <button
          className={`${styles.tab} ${tab === 'employees' ? styles.activeTab : ''}`}
          onClick={() => setTab('employees')}
        >
          <Users size={15} /> Сотрудники
        </button>
        {adminUser && (
          <button
            className={`${styles.tab} ${tab === 'positions' ? styles.activeTab : ''}`}
            onClick={() => setTab('positions')}
          >
            <Briefcase size={15} /> Должности
            {rawPositions.length > 0 && (
              <span className={styles.tabBadge}>{rawPositions.length}</span>
            )}
          </button>
        )}
      </div>

      {/* ── Вкладка: По отделам ── */}
      {tab === 'departments' && (
        <div>
          {adminUser && (
            <div style={{ marginBottom: '1rem' }}>
              {!addingDept ? (
                <button
                  onClick={() => setAddingDept(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.4375rem 0.875rem',
                    background: 'transparent',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--primary)',
                    fontSize: '0.875rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <PlusCircle size={15} /> Добавить департамент
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  void handleAddDepartment();
                      if (e.key === 'Escape') { setAddingDept(false); setNewDeptName(''); }
                    }}
                    placeholder="Название департамента..."
                    style={{
                      padding: '0.4375rem 0.75rem',
                      border: '1.5px solid var(--primary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem', fontFamily: 'inherit',
                      outline: 'none', width: 280,
                      boxShadow: '0 0 0 3px var(--ring)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <button
                    onClick={() => void handleAddDepartment()}
                    style={{
                      padding: '0.4375rem 0.875rem', background: 'var(--primary)', color: '#fff',
                      border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem',
                    }}
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => { setAddingDept(false); setNewDeptName(''); }}
                    style={{
                      padding: '0.4375rem 0.75rem', background: 'transparent',
                      border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>
          )}

          <DepartmentList
            departments={adminUser ? org : org.filter(d => d.id === user.employee?.department.id)}
            onAddDivision={(deptId, name) => void handleAddDivision(deptId, name)}
            editableDeptId={editableDeptId}
            onInvite={handleInviteFromDiv}
            isAdmin={adminUser}
            onRenameDept={adminUser ? handleRenameDepartment : undefined}
            onDeleteDept={adminUser ? handleDeleteDepartment : undefined}
            onRenameDivision={adminUser ? handleRenameDivision : undefined}
            onDeleteDivision={adminUser ? handleDeleteDivision : undefined}
          />
        </div>
      )}

      {/* ── Вкладка: Сотрудники ── */}
      {tab === 'employees' && (
        <div>
          <div className={styles.filters}>
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {adminUser && (
              <select className={styles.select} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="">Все департаменты</option>
                {rawDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            <select className={styles.select} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">Все роли</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{formatRoleLabel(r.name)}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className={styles.empty}>Сотрудники не найдены</p>
          ) : (
            <div className={styles.empList}>
              {filtered.map(emp => (
                <div
                  key={emp.id}
                  className={styles.empCard}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedEmpId(emp.id)}
                >
                  <div className={styles.empAvatar}>{(emp.fullname ?? emp.email)[0].toUpperCase()}</div>
                  <div className={styles.empMain}>
                    <span className={styles.empName}>{emp.fullname ?? '—'}</span>
                    <span className={styles.empEmail}>{emp.email}</span>
                  </div>
                  <div className={styles.empMeta}>
                    <span className={styles.deptName}>{emp.division.name}</span>
                    <span className={styles.roleBadge}>{ROLE_LABELS[emp.role.name] ?? emp.role.name}</span>
                  </div>
                  <div className={styles.empDates}>
                    <span className={styles.dateLabel}>Должность</span>
                    <span className={styles.dateValue}>{emp.position.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className={styles.resultsNote}>Показано {filtered.length} из {allEmployees.length}</p>
        </div>
      )}

      {/* ── Вкладка: Должности (admin only) ── */}
      {tab === 'positions' && adminUser && (
        <PositionsTab rawPositions={rawPositions} onLoad={load} />
      )}

      {/* ── Модалка: карточка сотрудника ── */}
      {(() => {
        if (!selectedEmpId) return null;
        const listEmp = allEmployees.find(e => e.id === selectedEmpId);
        const rawEmp  = rawEmployees.find(e => e.id === selectedEmpId);
        if (!listEmp || !rawEmp) return null;
        return (
          <EmployeeDetailModal
            emp={listEmp}
            rawEmp={rawEmp}
            isAdmin={adminUser}
            divisionsList={allDivisions}
            positionsList={rawPositions}
            onClose={() => setSelectedEmpId(null)}
            onLoad={load}
          />
        );
      })()}

      {/* ── Модалка: добавить сотрудника ── */}
      {addOpen && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setAddOpen(false); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Добавить сотрудника</h2>
              <button className={styles.closeBtn} onClick={() => setAddOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={e => { void handleCreateEmployee(e); }} className={styles.form}>
              <label className={styles.label}>
                Email <span className={styles.req}>*</span>
                <input className={styles.input} type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="employee@company.ru" required autoFocus />
              </label>
              <label className={styles.label}>
                ФИО <span className={styles.req}>*</span>
                <input className={styles.input} value={form.fullname}
                  onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))}
                  placeholder="Иван Иванов" required />
              </label>
              <label className={styles.label}>
                Дата трудоустройства <span className={styles.req}>*</span>
                <input className={styles.input} type="date" value={form.employmentDate}
                  onChange={e => setForm(p => ({ ...p, employmentDate: e.target.value }))}
                  required />
              </label>
              <label className={styles.label}>
                Отдел <span className={styles.req}>*</span>
                <select className={styles.input} value={form.divisionId}
                  onChange={e => setForm(p => ({ ...p, divisionId: e.target.value, positionId: '' }))}
                  required>
                  <option value="">— выберите отдел —</option>
                  {availableDivisions.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Должность
                <select className={styles.input} value={form.positionId}
                  onChange={e => setForm(p => ({ ...p, positionId: e.target.value }))}>
                  <option value="">— не указана —</option>
                  {availablePositions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setAddOpen(false)}>Отмена</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Создаём...' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
