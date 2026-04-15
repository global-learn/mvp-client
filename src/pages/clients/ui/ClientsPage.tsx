import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Plus, X, User } from 'lucide-react';
import type { Company, CompanyClient } from '@entities/company/model/types';
import styles from './Clients.module.css';

// Mock-данные — заменить на API-запросы когда появится бэкенд:
// GET /companies           → список компаний с клиентами
// POST /companies          → создать компанию
// POST /companies/:id/clients → добавить клиента в компанию

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'ТехноСтрой',
    createdAt: '2024-01-15',
    clients: [
      { id: 'cl-1', fullname: 'Иван Соколов',   email: 'ivan@technostroy.ru' },
      { id: 'cl-2', fullname: 'Анна Фёдорова',  email: 'anna@technostroy.ru' },
      { id: 'cl-3', fullname: 'Пётр Зайцев',    email: 'petr@technostroy.ru' },
    ],
  },
  {
    id: 'comp-2',
    name: 'МедиаГрупп',
    createdAt: '2024-03-20',
    clients: [
      { id: 'cl-4', fullname: 'Марина Белова', email: 'marina@mediagroup.ru' },
    ],
  },
  {
    id: 'comp-3',
    name: 'АгроПрайм',
    createdAt: '2023-11-10',
    clients: [
      { id: 'cl-5', fullname: 'Александр Новиков', email: 'alex@agroprime.ru' },
      { id: 'cl-6', fullname: 'Елена Попова',       email: 'elena@agroprime.ru' },
      { id: 'cl-7', fullname: null,                  email: 'mark@agroprime.ru' },
    ],
  },
];

type Modal =
  | { type: 'addCompany' }
  | { type: 'addClient'; companyId: string }
  | null;

export function ClientsPage() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<Modal>(null);

  // Форма "Добавить компанию"
  const [companyName, setCompanyName] = useState('');

  // Форма "Добавить клиента"
  const [clientEmail, setClientEmail] = useState('');
  const [clientFullname, setClientFullname] = useState('');

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
    setClientEmail('');
    setClientFullname('');
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    const newCompany: Company = {
      id: `comp-${Date.now()}`,
      name: companyName.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      clients: [],
    };
    setCompanies(prev => [...prev, newCompany]);
    closeModal();
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail.trim() || modal?.type !== 'addClient') return;
    const { companyId } = modal;
    const newClient: CompanyClient = {
      id: `cl-${Date.now()}`,
      fullname: clientFullname.trim() || null,
      email: clientEmail.trim(),
    };
    setCompanies(prev =>
      prev.map(c =>
        c.id === companyId ? { ...c, clients: [...c.clients, newClient] } : c,
      ),
    );
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
          return (
            <div key={company.id} className={styles.companyCard}>
              <button
                className={styles.companyHeader}
                onClick={() => toggleExpand(company.id)}
              >
                <div className={styles.companyLeft}>
                  <span className={styles.companyName}>{company.name}</span>
                  <span className={styles.clientCount}>
                    {company.clients.length} клиент{clientWord(company.clients.length)}
                  </span>
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
                  {company.clients.length === 0 ? (
                    <p className={styles.empty}>Клиентов пока нет</p>
                  ) : (
                    company.clients.map(client => (
                      <div key={client.id} className={styles.clientRow}>
                        <div className={styles.clientAvatar}>
                          <User size={16} />
                        </div>
                        <div className={styles.clientInfo}>
                          <span className={styles.clientName}>
                            {client.fullname ?? '—'}
                          </span>
                          <span className={styles.clientEmail}>{client.email}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    className={styles.addClientBtn}
                    onClick={() => setModal({ type: 'addClient', companyId: company.id })}
                  >
                    <Plus size={14} />
                    Добавить клиента
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {companies.length === 0 && (
          <p className={styles.emptyPage}>Компаний пока нет. Добавьте первую!</p>
        )}
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
                <input
                  className={styles.input}
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="ООО Пример"
                  required
                  autoFocus
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Отмена</button>
                <button type="submit" className={styles.submitBtn}>Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка: добавить клиента */}
      {modal?.type === 'addClient' && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Добавить клиента</h2>
              <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddClient} className={styles.form}>
              <label className={styles.label}>
                Email
                <input
                  className={styles.input}
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="client@company.com"
                  required
                  autoFocus
                />
              </label>
              <label className={styles.label}>
                Имя (необязательно)
                <input
                  className={styles.input}
                  value={clientFullname}
                  onChange={e => setClientFullname(e.target.value)}
                  placeholder="Иван Иванов"
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Отмена</button>
                <button type="submit" className={styles.submitBtn}>Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function clientWord(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return '';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'а';
  return 'ов';
}
