import {useState, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {ChevronDown, ChevronUp, Plus, X, UserPlus, Search, BookOpen} from 'lucide-react';
import type {Company, CompanyClient} from '@entities/company/model/types';
import type {ClientInvite, InviteStatus} from '@entities/invite/model/types';
import {makeExpiresAt} from '@entities/invite/model/types';
import {useUser} from '@entities/user/model/UserContext';
import {canManageClients} from '@entities/user/model/types';
import styles from './Clients.module.css';

// ── Mock-данные ─────────────────────────────────────────────────
const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1', name: 'ТехноСтрой', createdAt: '2024-01-15',
    clients: [
      {id: 'cl-1', fullname: 'Иван Соколов',  email: 'ivan@technostroy.ru'},
      {id: 'cl-2', fullname: 'Анна Фёдорова', email: 'anna@technostroy.ru'},
    ],
  },
  {
    id: 'comp-2', name: 'МедиаГрупп', createdAt: '2024-03-20',
    clients: [
      {id: 'cl-4', fullname: 'Марина Белова', email: 'marina@mediagroup.ru'},
    ],
  },
  {
    id: 'comp-3', name: 'АгроПрайм', createdAt: '2023-11-10',
    clients: [
      {id: 'cl-5', fullname: 'Александр Новиков', email: 'alex@agroprime.ru'},
      {id: 'cl-6', fullname: 'Елена Попова',       email: 'elena@agroprime.ru'},
    ],
  },
];

const INITIAL_INVITES: ClientInvite[] = [
  {
    id: 'cinv-1', type: 'CLIENT',
    email: 'new.client@technostroy.ru', fullname: 'Пётр Зайцев', password: '***',
    companyId: 'comp-1', companyName: 'ТехноСтрой',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    expiresAt: makeExpiresAt(new Date(Date.now() - 1 * 86400000).toISOString()),
  },
  {
    id: 'cinv-2', type: 'CLIENT',
    email: 'expired@agroprime.ru', fullname: null, password: '***',
    companyId: 'comp-3', companyName: 'АгроПрайм',
    status: 'expired',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    expiresAt: makeExpiresAt(new Date(Date.now() - 14 * 86400000).toISOString()),
  },
];

const CLIENT_COURSES = [
  {id: 'cc-1', title: 'Введение в продукт', meta: '3 модуля · 45 мин'},
  {id: 'cc-2', title: 'Работа с клиентским порталом', meta: '2 модуля · 30 мин'},
  {id: 'cc-3', title: 'Политика безопасности данных', meta: '1 модуль · 20 мин'},
  {id: 'cc-4', title: 'Знакомство с сервисом', meta: '4 модуля · 1 ч'},
];

const STATUS_LABEL: Record<InviteStatus, string> = {
  active: 'Активен', pending: 'Ожидает', expired: 'Истёк',
};

function clientWord(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return '';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'а';
  return 'ов';
}

type ModalState =
  | {type: 'addCompany'}
  | {type: 'inviteClient'; companyId: string; companyName: string}
  | {type: 'assignCourse'; client: CompanyClient; companyName: string}
  | null;

// ── Guard ────────────────────────────────────────────────────────
export function ClientsPage() {
  const {user} = useUser();
  const navigate = useNavigate();

  if (!canManageClients(user)) {
    navigate('/dashboard', {replace: true});
    return null;
  }

  return <ClientsContent />;
}

// ── Main ─────────────────────────────────────────────────────────
function ClientsContent() {
  const [companies, setCompanies]   = useState<Company[]>(INITIAL_COMPANIES);
  const [allInvites, setAllInvites] = useState<ClientInvite[]>(INITIAL_INVITES);
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [modal, setModal]           = useState<ModalState>(null);
  const [query, setQuery]           = useState('');
  // clientId → assigned course ids
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  const [companyName,    setCompanyName]    = useState('');
  const [inviteEmail,    setInviteEmail]    = useState('');
  const [inviteFullname, setInviteFullname] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── stats
  const totalClients = companies.reduce((s, c) => s + c.clients.length, 0);
  const totalPending = allInvites.filter(i => i.status === 'pending').length;

  // ── search
  const q = query.toLowerCase().trim();
  const filtered = useMemo(() => {
    if (!q) return companies;
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.clients.some(cl =>
        (cl.fullname ?? '').toLowerCase().includes(q) ||
        cl.email.toLowerCase().includes(q),
      ),
    );
  }, [companies, q]);

  const invitesByCompany = useMemo(() => {
    const map: Record<string, ClientInvite[]> = {};
    allInvites.forEach(inv => {
      if (!map[inv.companyId]) map[inv.companyId] = [];
      map[inv.companyId].push(inv);
    });
    return map;
  }, [allInvites]);

  // ── handlers
  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const closeModal = () => {
    setModal(null);
    setCompanyName('');
    setInviteEmail('');
    setInviteFullname('');
    setSelectedCourse(null);
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setCompanies(prev => [...prev, {
      id: `comp-${Date.now()}`,
      name: companyName.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      clients: [],
    }]);
    closeModal();
  };

  const handleInviteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal?.type !== 'inviteClient') return;
    setSubmitting(true);
    await new Promise<void>(r => setTimeout(r, 350));
    const now = new Date().toISOString();
    setAllInvites(prev => [{
      id: `cinv-${Date.now()}`, type: 'CLIENT',
      email: inviteEmail.trim(),
      fullname: inviteFullname.trim() || null,
      password: '',
      companyId: modal.companyId,
      companyName: modal.companyName,
      status: 'pending', createdAt: now, expiresAt: makeExpiresAt(now),
    }, ...prev]);
    setSubmitting(false);
    closeModal();
  };

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal?.type !== 'assignCourse' || !selectedCourse) return;
    setSubmitting(true);
    await new Promise<void>(r => setTimeout(r, 350));
    const clientId = modal.client.id;
    setAssignments(prev => ({
      ...prev,
      [clientId]: [...(prev[clientId] ?? []), selectedCourse],
    }));
    setSubmitting(false);
    closeModal();
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Клиенты</h1>
        <button className={styles.addBtn} onClick={() => setModal({type: 'addCompany'})}>
          <Plus size={15}/> Добавить компанию
        </button>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <span>{companies.length} компани{companies.length === 1 ? 'я' : 'и'}</span>
        <span className={styles.summaryDot}/>
        <span>{totalClients} клиент{clientWord(totalClients)}</span>
        {totalPending > 0 && (
          <>
            <span className={styles.summaryDot}/>
            <span className={styles.summaryWarning}>{totalPending} ожидают ответа</span>
          </>
        )}
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <Search size={14} className={styles.searchIcon}/>
        <input
          className={styles.searchInput}
          placeholder="Поиск по компании или клиенту…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button className={styles.searchClear} onClick={() => setQuery('')}>
            <X size={13}/>
          </button>
        )}
      </div>

      {/* List */}
      <div className={styles.list}>
        {filtered.map(company => {
          const isOpen = expanded.has(company.id);
          const companyInvites = invitesByCompany[company.id] ?? [];
          const pendingCount = companyInvites.filter(i => i.status === 'pending').length;

          return (
            <div key={company.id} className={styles.companyCard}>

              <button className={styles.companyHeader} onClick={() => toggle(company.id)}>
                <div className={styles.companyLeft}>
                  <span className={styles.companyName}>{company.name}</span>
                  <span className={styles.countPill}>
                    {company.clients.length} клиент{clientWord(company.clients.length)}
                  </span>
                  {pendingCount > 0 && (
                    <span className={styles.pendingPill}>{pendingCount} ожидают</span>
                  )}
                </div>
                <div className={styles.companyRight}>
                  <span className={styles.companyDate}>
                    с {new Date(company.createdAt).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})}
                  </span>
                  {isOpen
                    ? <ChevronUp size={15} className={styles.chevron}/>
                    : <ChevronDown size={15} className={styles.chevron}/>
                  }
                </div>
              </button>

              {isOpen && (
                <div className={styles.panel}>

                  {/* Active clients */}
                  {company.clients.length > 0 && (
                    <div className={styles.section}>
                      <p className={styles.sectionLabel}>Активные</p>
                      {company.clients.map(client => {
                        const assigned = (assignments[client.id] ?? [])
                          .map(id => CLIENT_COURSES.find(c => c.id === id))
                          .filter(Boolean) as typeof CLIENT_COURSES;

                        return (
                          <div key={client.id} className={styles.clientBlock}>
                            <div className={styles.clientRow}>
                              <div className={styles.clientInfo}>
                                <span className={styles.clientName}>{client.fullname ?? '—'}</span>
                                <span className={styles.clientEmail}>{client.email}</span>
                              </div>
                              <div className={styles.clientRowRight}>
                                <button
                                  className={styles.assignBtn}
                                  onClick={() => setModal({type: 'assignCourse', client, companyName: company.name})}
                                >
                                  Назначить курс
                                </button>
                                <span className={styles.badgeActive}>Активен</span>
                              </div>
                            </div>
                            {assigned.length > 0 && (
                              <div className={styles.coursesRow}>
                                <BookOpen size={12} className={styles.coursesIcon}/>
                                {assigned.map(c => (
                                  <span key={c.id} className={styles.courseTag}>{c.title}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Invites */}
                  {companyInvites.length > 0 && (
                    <div className={styles.section}>
                      <p className={styles.sectionLabel}>Инвайты</p>
                      {companyInvites.map(inv => (
                        <div key={inv.id} className={styles.clientBlock}>
                          <div className={styles.clientRow}>
                            <div className={styles.clientInfo}>
                              <span className={styles.clientName}>{inv.fullname ?? '—'}</span>
                              <span className={styles.clientEmail}>{inv.email}</span>
                            </div>
                            <span className={styles[`badge${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}` as keyof typeof styles]}>
                              {STATUS_LABEL[inv.status]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {company.clients.length === 0 && companyInvites.length === 0 && (
                    <p className={styles.emptyPanel}>Клиентов пока нет</p>
                  )}

                  <button
                    className={styles.inviteBtn}
                    onClick={() => setModal({type: 'inviteClient', companyId: company.id, companyName: company.name})}
                  >
                    <UserPlus size={13}/> Пригласить клиента
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className={styles.emptyPage}>
            <p className={styles.emptyTitle}>{q ? 'Ничего не найдено' : 'Компаний пока нет'}</p>
            <p className={styles.emptySub}>
              {q ? `По запросу «${query}» нет результатов` : 'Добавьте первую клиентскую компанию'}
            </p>
          </div>
        )}
      </div>

      {/* ── Modal: add company ── */}
      {modal?.type === 'addCompany' && (
        <div className={styles.overlay} onClick={e => {if (e.target === e.currentTarget) closeModal();}}>
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <h2 className={styles.modalTitle}>Новая компания</h2>
              <button className={styles.closeBtn} onClick={closeModal}><X size={16}/></button>
            </div>
            <form onSubmit={handleAddCompany} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Название</label>
                <input className={styles.input} value={companyName}
                  onChange={e => setCompanyName(e.target.value)} placeholder="ООО Пример" required autoFocus/>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Отмена</button>
                <button type="submit" className={styles.submitBtn}>Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: invite client ── */}
      {modal?.type === 'inviteClient' && (
        <div className={styles.overlay} onClick={e => {if (e.target === e.currentTarget) closeModal();}}>
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <div>
                <h2 className={styles.modalTitle}>Пригласить клиента</h2>
                <p className={styles.modalSub}>{modal.companyName}</p>
              </div>
              <button className={styles.closeBtn} onClick={closeModal}><X size={16}/></button>
            </div>
            <p className={styles.modalHint}>Клиент получит ссылку для регистрации. Действует 7 дней.</p>
            <form onSubmit={e => {void handleInviteClient(e);}} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email <span className={styles.req}>*</span></label>
                <input className={styles.input} type="email" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} placeholder="client@company.com" required autoFocus/>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Имя <span className={styles.optional}>(необязательно)</span>
                </label>
                <input className={styles.input} value={inviteFullname}
                  onChange={e => setInviteFullname(e.target.value)} placeholder="Иван Иванов"/>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Отмена</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Отправляем…' : 'Отправить ссылку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: assign course ── */}
      {modal?.type === 'assignCourse' && (
        <div className={styles.overlay} onClick={e => {if (e.target === e.currentTarget) closeModal();}}>
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <div>
                <h2 className={styles.modalTitle}>Назначить курс</h2>
                <p className={styles.modalSub}>
                  {modal.client.fullname ?? modal.client.email} · {modal.companyName}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={closeModal}><X size={16}/></button>
            </div>
            <form onSubmit={e => {void handleAssignCourse(e);}} className={styles.form}>
              <div className={styles.courseList}>
                {CLIENT_COURSES.map(course => {
                  const done = (assignments[modal.client.id] ?? []).includes(course.id);
                  const sel  = selectedCourse === course.id;
                  return (
                    <button
                      key={course.id}
                      type="button"
                      disabled={done}
                      className={`${styles.courseOption} ${sel ? styles.courseOptionSel : ''} ${done ? styles.courseOptionDone : ''}`}
                      onClick={() => !done && setSelectedCourse(course.id)}
                    >
                      <div className={styles.courseOptionBody}>
                        <span className={styles.courseOptionTitle}>{course.title}</span>
                        <span className={styles.courseOptionMeta}>{course.meta}</span>
                      </div>
                      {done
                        ? <span className={styles.courseAssignedMark}>Назначен</span>
                        : sel && <span className={styles.courseSelDot}/>
                      }
                    </button>
                  );
                })}
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Отмена</button>
                <button type="submit" className={styles.submitBtn} disabled={!selectedCourse || submitting}>
                  {submitting ? 'Назначаем…' : 'Назначить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
