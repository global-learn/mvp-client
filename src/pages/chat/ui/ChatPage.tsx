import { useRef, useState } from 'react';
import { Search, MessageSquare, Send } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { canManageClients, displayName } from '@entities/user/model/types';
import { ALL_EMPLOYEES } from '@pages/company/ui/CompanyPage';
import styles from './Chat.module.css';

// ── Типы ─────────────────────────────────────────────────

interface ChatContact {
  id: string;
  name: string;
  sub: string;       // должность / компания
  type: 'employee' | 'client';
  color: string;     // bg-color для аватара
  unread?: number;
}

interface Message {
  id: string;
  senderId: string;  // 'me' | contactId
  text: string;
  time: string;
}

// ── Палитра цветов для аватаров ───────────────────────────
const COLORS = [
  '#4299e1','#48bb78','#ed8936','#9f7aea','#f56565',
  '#38b2ac','#e53e3e','#667eea','#e91e63','#00bcd4',
];
function avatarColor(id: string): string {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

// ── Mock-данные ───────────────────────────────────────────
const CLIENT_CONTACTS: ChatContact[] = [
  { id: 'cl-1', name: 'Иван Соколов',        sub: 'ТехноСтрой',  type: 'client', color: avatarColor('cl-1'), unread: 2 },
  { id: 'cl-2', name: 'Анна Фёдорова',       sub: 'ТехноСтрой',  type: 'client', color: avatarColor('cl-2') },
  { id: 'cl-4', name: 'Марина Белова',        sub: 'МедиаГрупп',  type: 'client', color: avatarColor('cl-4') },
  { id: 'cl-5', name: 'Александр Новиков',    sub: 'АгроПрайм',   type: 'client', color: avatarColor('cl-5') },
  { id: 'cl-6', name: 'Елена Попова',         sub: 'АгроПрайм',   type: 'client', color: avatarColor('cl-6') },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  'emp-5': [
    { id: 'm1', senderId: 'emp-5',  text: 'Привет! Видел новые курсы по React?', time: '10:00' },
    { id: 'm2', senderId: 'me',     text: 'Да, уже добавил в расписание команды', time: '10:02' },
    { id: 'm3', senderId: 'emp-5',  text: 'Отлично, дай знать как пройдут',       time: '10:03' },
  ],
  'cl-1': [
    { id: 'c1', senderId: 'cl-1',   text: 'Добрый день! У меня вопрос по курсу', time: 'Вчера' },
    { id: 'c2', senderId: 'me',     text: 'Здравствуйте, слушаю вас!',            time: 'Вчера' },
    { id: 'c3', senderId: 'cl-1',   text: 'Когда будет следующий модуль?',        time: 'Вчера' },
    { id: 'c4', senderId: 'cl-1',   text: 'И ещё — тест не засчитался, помогите', time: '09:15' },
  ],
};

// ── Компонент ─────────────────────────────────────────────

export function ChatPage() {
  const { user } = useUser();
  const myName   = displayName(user);
  const myId     = user.id;
  const showClients = canManageClients(user);

  // Контакты-сотрудники (все кроме себя)
  const empContacts: ChatContact[] = ALL_EMPLOYEES
    .filter(e => e.id !== user.employee?.id)
    .map(e => ({
      id: e.id,
      name: e.fullname ?? e.email,
      sub: e.position.name,
      type: 'employee' as const,
      color: avatarColor(e.id),
    }));

  const [search, setSearch]         = useState('');
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [messages, setMessages]     = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [draft, setDraft]           = useState('');
  const [unread, setUnread]         = useState<Record<string, number>>({ 'cl-1': 2 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allContacts: ChatContact[] = [
    ...empContacts,
    ...(showClients ? CLIENT_CONTACTS : []),
  ];

  const filteredContacts = search
    ? allContacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : allContacts;

  const empFiltered    = filteredContacts.filter(c => c.type === 'employee');
  const clientFiltered = filteredContacts.filter(c => c.type === 'client');

  const activeContact = allContacts.find(c => c.id === activeId) ?? null;
  const thread        = activeId ? (messages[activeId] ?? []) : [];

  const selectContact = (id: string) => {
    setActiveId(id);
    setUnread(prev => ({ ...prev, [id]: 0 }));
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const sendMessage = () => {
    if (!draft.trim() || !activeId) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      text: draft.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), msg] }));
    setDraft('');
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Контакты ── */}
      <aside className={styles.contacts}>
        <div className={styles.contactsHeader}>
          <h2 className={styles.contactsTitle}>Чат</h2>
          <div className={styles.searchBox}>
            <Search size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.contactsList}>
          {/* Сотрудники */}
          {empFiltered.length > 0 && (
            <>
              <div className={styles.groupLabel}>Сотрудники</div>
              {empFiltered.map(c => (
                <ContactRow
                  key={c.id} contact={c}
                  active={c.id === activeId}
                  unread={unread[c.id] ?? 0}
                  onClick={() => selectContact(c.id)}
                />
              ))}
            </>
          )}

          {/* Клиенты (только admin/service) */}
          {showClients && clientFiltered.length > 0 && (
            <>
              <div className={styles.groupLabel}>Клиенты</div>
              {clientFiltered.map(c => (
                <ContactRow
                  key={c.id} contact={c}
                  active={c.id === activeId}
                  unread={unread[c.id] ?? 0}
                  onClick={() => selectContact(c.id)}
                />
              ))}
            </>
          )}
        </div>
      </aside>

      {/* ── Диалог ── */}
      <div className={styles.chatArea}>
        {activeContact ? (
          <>
            <div className={styles.chatHeader}>
              <div
                className={styles.msgAvatar}
                style={{ background: activeContact.color, width: 36, height: 36 }}
              >
                {activeContact.name[0]}
              </div>
              <div>
                <div className={styles.chatHeaderName}>{activeContact.name}</div>
                <div className={styles.chatHeaderSub}>{activeContact.sub}</div>
              </div>
            </div>

            <div className={styles.messages}>
              {thread.map(msg => {
                const isOwn = msg.senderId === 'me';
                const initials = isOwn
                  ? myName[0]
                  : activeContact.name[0];
                const color = isOwn ? '#4299e1' : activeContact.color;
                return (
                  <div key={msg.id} className={`${styles.msgRow} ${isOwn ? styles.own : ''}`}>
                    <div className={styles.msgAvatar} style={{ background: color }}>
                      {initials}
                    </div>
                    <div>
                      <div className={styles.bubble}>{msg.text}</div>
                      <div className={styles.msgTime}>{msg.time}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputRow}>
              <textarea
                className={styles.textInput}
                rows={1}
                placeholder="Написать сообщение... (Enter — отправить)"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className={styles.sendBtn}
                onClick={sendMessage}
                disabled={!draft.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noChat}>
            <MessageSquare size={48} className={styles.noChatIcon} />
            <p>Выберите контакт, чтобы начать общение</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Строка контакта ───────────────────────────────────────
function ContactRow({
  contact, active, unread, onClick,
}: {
  contact: ChatContact;
  active: boolean;
  unread: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.contactBtn} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      <div className={styles.contactAvatar} style={{ background: contact.color }}>
        {contact.name[0]}
      </div>
      <div className={styles.contactInfo}>
        <span className={styles.contactName}>{contact.name}</span>
        <span className={styles.contactSub}>{contact.sub}</span>
      </div>
      {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
    </button>
  );
}
