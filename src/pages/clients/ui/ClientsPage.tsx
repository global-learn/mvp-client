import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, X, User, UserPlus } from 'lucide-react';
import type { Company, CompanyClient } from '@entities/company/model/types';
import type { ClientInvite, InviteStatus } from '@entities/invite/model/types';
import { makeExpiresAt } from '@entities/invite/model/types';
import { useUser } from '@entities/user/model/UserContext';
import { canManageClients } from '@entities/user/model/types';
import styles from './Clients.module.css';

// Mock-данные — заменить на API когда появится бэкенд

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1', name: 'ТехноСтрой', createdAt: '2024-01-15',
    clients: [
      { id: 'cl-1', fullname: 'Иван Соколов',  email: 'ivan@technostroy.ru' },
      { id: 'cl-2', fullname: 'Анна Фёдорова', email: 'anna@technostroy.ru' },
    ],
  },
  {
    id: 'comp-2', name: 'МедиаГрупп', createdAt: '2024-03-20',
    clients: [
      { id: 'cl-4', fullname: 'Марина Белова', email: 'marina@mediagroup.ru' },
    ],
  },
  {
    id: 'comp-3', name: 'АгроПрайм', createdAt: '2023-11-10',
    clients: [
      { id: 'cl-5', fullname: 'Александр Новиков', email: 'alex@agroprime.ru' },
      { id: 'cl-6', fullname: 'Елена Попова',       email: 'elena@agroprime.ru' },
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

const STATUS_CONFIG: Record<InviteStatus, { label: string; color: string; bg: string }> = {
  active:  { label: 'Активен', color: '#276749', bg: '#c6f6d5' },
  pending: { label: 'Ожидает', color: '#7b4e0e', bg: '#fefcbf' },
  expired: { label: 'Истёк',   color: '#9b2c2c', bg: '#fed7d7' },
};

type ModalState =
  | { type: 'addCompany' }
  | { type: 'inviteClient'; companyId: string; companyName: string }
  | null;

function clientWord(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return '';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'а';
  return 'ов';
}

export function ClientsPage() {
  const { user } = useUser();
  const navigate  = useNavigate();

  useEffect(() => {
    if (!canManageClients(user)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (!canManageClients(user)) return null;

  return <ClientsContent />;
}

function ClientsContent() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [allInvites, setAllInvites] = useState<ClientInvite[]>(INITIAL_INVITES);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<ModalState>(null);

  const [companyName, setCompanyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullname, setInviteFullname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const invitesByCompany = useMemo(() => {
    const map: Record<string, ClientInvite[]> = {};
    allInvites.forEach(inv => {
      if (!map[inv.companyId]) map[inv.companyId] = [];
      map[inv.companyId].push(inv);
    });
    return map;
  }, [allInvites]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closeModal = () => {
    setModal(null);
    setCompanyName('');
    setInviteEmail('');
    setInviteFullname('');
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setCompanies(prev => [...prev, {
      id: `comp-${Date.now()}`, name: companyName.trim(),
      createdAt: new Date().toISOString().slice(0, 10), clients: [],
    }]);
    closeModal();
  };

  const handleInviteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || modal?.type !== 'inviteClient') return;
    setSubmitting(true);
    await new Promise<void>(r => setTimeout(r, 400));
    const now = new Date().toISOString();
    const invite: ClientInvite = {
      id: `cinv-${Date.now()}`, type: 'CLIENT',
      email: inviteEmail.trim(), fullname: inviteFullname.trim() || null,
      password: '',  // регистрация через ссылку на почте
      companyId: modal.companyId, companyName: modal.companyName,
      status: 'pending', createdAt: now, expiresAt: makeExpiresAt(now),
    };
    setAllInvites(prev => [invite, ...prev]);
    setSubmitting(false);
    closeModal();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Клиенты</h1>
          <p className={styles.subtitle}>Клиентские компании и их пользователи</p>
        </div>
        <button className={styles.addBtn} onClick={() => setModal({ type: 'addCompany' })}>
          <Plus size={18} />
          Добавить компанию
        </button>
      </div>

      <div className={styles.list}>
        {companies.map(company => {
          const isOpen = expanded.has(company.id);
          const companyInvites = invitesByCompany[company.id] ?? [];
          const pendingCount = companyInvites.filter(i => i.status === 'pending').length;

          return (
            <div key={company.id} className={styles.companyCard}>
              <button className={styles.companyHeader} onClick={() => toggleExpand(company.id)}>
                <div className={styles.companyLeft}>
                  <span className={styles.companyName}>{company.name}</span>
                  <span className={styles.clientCount}>
                    {company.clients.length} клиент{clientWord(company.clients.length)}
                  </span>
                  {pendingCount > 0 && (
                    <span className={styles.pendingBadge}>{pendingCount} ожидают</span>
                  )}
                </div>
                <div className={styles.companyRight}>
                  <span className={styles.companyDate}>
                    с {new Date(company.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {isOpen && (
                <div className={styles.clientsPanel}>
                  {/* Активные клиенты */}
                  {company.clients.length > 0 && (
                    <>
                      <p className={styles.panelLabel}>Активные</p>
                      {company.clients.map(client => (
                        <div key={client.id} className={styles.clientRow}>
                          <div className={styles.clientAvatar}><User size={16} /></div>
                          <div className={styles.clientInfo}>
                            <span className={styles.clientName}>{client.fullname ?? '—'}</span>
                            <span className={styles.clientEmail}>{client.email}</span>
                          </div>
                          <span className={styles.statusBadge} style={{ background: '#c6f6d5', color: '#276749' }}>
                            Активен
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Инвайты */}
                  {companyInvites.length > 0 && (
                    <>
                      <p className={styles.panelLabel}>Инвайты</p>
                      {companyInvites.map(inv => {
                        const cfg = STATUS_CONFIG[inv.status];
                        return (
                          <div key={inv.id} className={styles.clientRow}>
                            <div className={styles.clientAvatar}><UserPlus size={16} /></div>
                            <div className={styles.clientInfo}>
                              <span className={styles.clientName}>{inv.fullname ?? '—'}</span>
                              <span className={styles.clientEmail}>{inv.email}</span>
                            </div>
                            <span className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {company.clients.length === 0 && companyInvites.length === 0 && (
                    <p className={styles.empty}>Клиентов пока нет</p>
                  )}

                  <button
                    className={styles.addClientBtn}
                    onClick={() => setModal({ type: 'inviteClient', companyId: company.id, companyName: company.name })}
                  >
                    <UserPlus size={14} />
                    Пригласить клиента
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {companies.length === 0 && <p className={styles.emptyPage}>Компаний пока нет. Добавьте первую!</p>}
      </div>

      {/* Модалка: добавить компанию */}
      {modal?.type === 'addCompany' && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Новая компания</h2>
              <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddCompany} className={styles.form}>
              <label className={styles.label}>
                Название компании
                <input className={styles.input} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="ООО Пример" required autoFocus />
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Отмена</button>
                <button type="submit" className={styles.submitBtn}>Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка: пригласить клиента */}
      {modal?.type === 'inviteClient' && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Пригласить клиента</h2>
                <p className={styles.modalSubtitle}>{modal.companyName}</p>
              </div>
              <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
            </div>
            <p style={{ margin: '-0.5rem 0 1rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Клиент получит письмо со ссылкой для завершения регистрации
            </p>
            <form onSubmit={e => { void handleInviteClient(e); }} className={styles.form}>
              <label className={styles.label}>
                Email <span className={styles.req}>*</span>
                <input className={styles.input} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="client@company.com" required autoFocus />
              </label>
              <label className={styles.label}>
                Имя (необязательно)
                <input className={styles.input} value={inviteFullname} onChange={e => setInviteFullname(e.target.value)} placeholder="Иван Иванов" />
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Отмена</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Отправляем...' : '✉️ Отправить ссылку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
