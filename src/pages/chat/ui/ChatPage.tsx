import { useEffect, useRef, useState } from 'react';
import { Search, MessageSquare, Send, ChevronLeft } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { canManageClients, displayName } from '@entities/user/model/types';
import { ALL_EMPLOYEES } from '@pages/company/ui/CompanyPage';
import styles from './Chat.module.css';

// ── Типы ─────────────────────────────────────────────────────────

interface ChatContact {
  id: string;
  name: string;
  sub: string;
  type: 'employee' | 'client';
  initials: string;
  color: string;
  lastMessage?: string;
  unread?: number;
}

interface Message {
  id: string;
  senderId: string;  // 'me' | contactId
  text: string;
  time: string;
}

// ── Палитра цветов для аватаров ───────────────────────────────────
const COLORS = [
  '#4299e1','#48bb78','#ed8936','#9f7aea','#f56565',
  '#38b2ac','#667eea','#e91e63','#00bcd4','#ff9800',
];
function avatarColor(id: string): string {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Mock-данные ───────────────────────────────────────────────────
const CLIENT_CONTACTS: ChatContact[] = [
  { id: 'cl-1', name: 'Иван Соколов',        sub: 'ТехноСтрой',  type: 'client', color: avatarColor('cl-1'), initials: 'ИС', lastMessage: 'Когда будет следующий модуль?', unread: 2 },
  { id: 'cl-2', name: 'Анна Фёдорова',       sub: 'ТехноСтрой',  type: 'client', color: avatarColor('cl-2'), initials: 'АФ', lastMessage: 'Спасибо за помощь!' },
  { id: 'cl-4', name: 'Марина Белова',        sub: 'МедиаГрупп',  type: 'client', color: avatarColor('cl-4'), initials: 'МБ' },
  { id: 'cl-5', name: 'Александр Новиков',    sub: 'АгроПрайм',   type: 'client', color: avatarColor('cl-5'), initials: 'АН' },
  { id: 'cl-6', name: 'Елена Попова',         sub: 'АгроПрайм',   type: 'client', color: avatarColor('cl-6'), initials: 'ЕП' },
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
    { id: 'c3', senderId: 'cl-1',   text: 'Когда будет следующий модуль?',        time: '09:15' },
    { id: 'c4', senderId: 'cl-1',   text: 'И ещё — тест не засчитался, помогите', time: '09:16' },
  ],
};

// ── Компонент ─────────────────────────────────────────────────────
export function ChatPage() {
  const { user } = useUser();
  const myName      = displayName(user);
  const showClients = canManageClients(user);

  const empContacts: ChatContact[] = ALL_EMPLOYEES
    .filter(e => e.id !== user.employee?.id)
    .map(e => ({
      id: e.id,
      name: e.fullname ?? e.email,
      sub: e.position.name,
      type: 'employee' as const,
      initials: getInitials(e.fullname ?? e.email),
      color: avatarColor(e.id),
    }));

  const [search, setSearch]         = useState('');
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [messages, setMessages]     = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [draft, setDraft]           = useState('');
  const [unread, setUnread]         = useState<Record<string, number>>({ 'cl-1': 2 });
  const [mobileShowChat, setMobileShowChat] = useState(false);
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
    setMobileShowChat(true);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <div className={styles.page}>
      {/* ── Sidebar контактов ── */}
      <aside className={`${styles.sidebar} ${mobileShowChat ? styles.sidebarHidden : ''}`}>
        {/* Шапка */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <MessageSquare size={18} />
            <span>Чат</span>
            {totalUnread > 0 && <span className={styles.totalUnreadBadge}>{totalUnread}</span>}
          </div>
          <div className={styles.searchBox}>
            <Search size={13} />
            <input
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Список контактов */}
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

          {/* Клиенты */}
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

          {empFiltered.length === 0 && clientFiltered.length === 0 && (
            <div className={styles.emptySearch}>Ничего не найдено</div>
          )}
        </div>
      </aside>

      {/* ── Область переписки ── */}
      <div className={`${styles.chatArea} ${!mobileShowChat ? styles.chatHidden : ''}`}>
        {activeContact ? (
          <>
            {/* Заголовок чата */}
            <div className={styles.chatHeader}>
              <button className={styles.backBtn} onClick={() => setMobileShowChat(false)}>
                <ChevronLeft size={20} />
              </button>
              <div className={styles.chatHeaderAvatar} style={{ background: activeContact.color }}>
                {activeContact.initials}
              </div>
              <div className={styles.chatHeaderInfo}>
                <div className={styles.chatHeaderName}>{activeContact.name}</div>
                <div className={styles.chatHeaderSub}>{activeContact.sub}</div>
              </div>
            </div>

            {/* Сообщения */}
            <div className={styles.messages}>
              {thread.length === 0 && (
                <div className={styles.emptyThread}>
                  Начните переписку с {activeContact.name}
                </div>
              )}
              {thread.map((msg, idx) => {
                const isOwn = msg.senderId === 'me';
                const prevMsg = idx > 0 ? thread[idx - 1] : null;
                const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;
                return (
                  <div key={msg.id} className={`${styles.msgGroup} ${isOwn ? styles.ownGroup : ''}`}>
                    {!isOwn && showSender && (
                      <div className={styles.msgAvatarWrap} style={{ background: activeContact.color }}>
                        {activeContact.initials}
                      </div>
                    )}
                    {isOwn && showSender && (
                      <div className={styles.msgAvatarWrap} style={{ background: '#4299e1' }}>
                        {getInitials(myName)}
                      </div>
                    )}
                    {!showSender && <div className={styles.msgAvatarSpacer} />}
                    <div className={styles.msgBubbleWrap}>
                      <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
                        {msg.text}
                      </div>
                      <div className={`${styles.msgTime} ${isOwn ? styles.msgTimeOwn : ''}`}>{msg.time}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Поле ввода */}
            <div className={styles.inputRow}>
              <textarea
                className={styles.textInput}
                rows={1}
                placeholder="Написать сообщение..."
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className={styles.sendBtn}
                onClick={sendMessage}
                disabled={!draft.trim()}
                title="Отправить (Enter)"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noChat}>
            <div className={styles.noChatIcon}>
              <MessageSquare size={40} />
            </div>
            <p className={styles.noChatTitle}>Выберите чат</p>
            <p className={styles.noChatSub}>Выберите контакт из списка, чтобы начать общение</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Строка контакта ───────────────────────────────────────────────
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
      className={`${styles.contactBtn} ${active ? styles.contactBtnActive : ''}`}
      onClick={onClick}
    >
      <div className={styles.contactAvatar} style={{ background: contact.color }}>
        {contact.initials}
        {unread > 0 && <span className={styles.unreadDot} />}
      </div>
      <div className={styles.contactBody}>
        <div className={styles.contactTop}>
          <span className={styles.contactName}>{contact.name}</span>
          {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
        </div>
        <div className={styles.contactBottom}>
          <span className={styles.contactSub}>
            {contact.lastMessage ?? contact.sub}
          </span>
        </div>
      </div>
    </button>
  );
}
