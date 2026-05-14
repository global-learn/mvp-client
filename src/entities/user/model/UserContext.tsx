import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, UserAvatar } from './types';

// ================================================================
// AUTH CONTEXT — sessionStorage-based авторизация (mock до бэкенда)
// ================================================================
//
// Доступные тестовые аккаунты:
//   admin@test.com    / admin  → Администратор (Деп. маркетинга, Отдел разработки)
//   depthead@test.com / test   → Руководитель департамента (Деп. маркетинга)
//   divhead@test.com  / test   → Руководитель отдела (Отдел разработки)
//   senior@test.com   / test   → Старший менеджер (Отдел разработки)
//   user@test.com     / user   → Менеджер (Деп. продаж, Отдел продаж)
//   service@test.com  / test   → Менеджер, Отдел сервиса (доступ к клиентам)

const MOCK_CREDENTIALS: Record<string, { password: string; user: User }> = {

  'admin@test.com': {
    password: 'admin',
    user: {
      id: 'user-admin',
      email: 'admin@test.com',
      fullname: 'Ислам Гадиляев',
      type: 'EMPLOYEE',
      avatar: { id: 'sys-blue', name: 'Синий', isSystem: true, bgColor: '#4299e1' },
      employee: {
        id: 'emp-admin',
        department: { id: 'dept-marketing', name: 'Департамент маркетинга' },
        division:   { id: 'div-dev', name: 'Отдел разработки', departmentId: 'dept-marketing' },
        position:   { id: 'pos-dev1', name: 'Lead Developer' },
        role:       { id: 'role-admin', name: 'admin' },
        birthDate: '1990-05-15',
        employmentDate: '2020-01-01',
      },
    },
  },

  'depthead@test.com': {
    password: 'test',
    user: {
      id: 'user-depthead',
      email: 'depthead@test.com',
      fullname: 'Дмитрий Козлов',
      type: 'EMPLOYEE',
      employee: {
        id: 'emp-5',
        department: { id: 'dept-marketing', name: 'Департамент маркетинга' },
        division:   { id: 'div-dev', name: 'Отдел разработки', departmentId: 'dept-marketing' },
        position:   { id: 'pos-dev1', name: 'Lead Developer' },
        role:       { id: 'role-depthead', name: 'department_head' },
        birthDate: '1993-09-12',
        employmentDate: '2021-03-20',
      },
    },
  },

  'divhead@test.com': {
    password: 'test',
    user: {
      id: 'user-divhead',
      email: 'divhead@test.com',
      fullname: 'Иван Петров',
      type: 'EMPLOYEE',
      employee: {
        id: 'emp-divhead',
        department: { id: 'dept-marketing', name: 'Департамент маркетинга' },
        division:   { id: 'div-dev', name: 'Отдел разработки', departmentId: 'dept-marketing' },
        position:   { id: 'pos-dev2', name: 'Разработчик' },
        role:       { id: 'role-divhead', name: 'division_head' },
        birthDate: '1994-03-22',
        employmentDate: '2021-07-01',
      },
    },
  },

  'senior@test.com': {
    password: 'test',
    user: {
      id: 'user-senior',
      email: 'senior@test.com',
      fullname: 'Анна Серова',
      type: 'EMPLOYEE',
      employee: {
        id: 'emp-6',
        department: { id: 'dept-marketing', name: 'Департамент маркетинга' },
        division:   { id: 'div-dev', name: 'Отдел разработки', departmentId: 'dept-marketing' },
        position:   { id: 'pos-dev2', name: 'Разработчик' },
        role:       { id: 'role-senior', name: 'senior_manager' },
        birthDate: '1997-01-30',
        employmentDate: '2023-02-10',
      },
    },
  },

  'user@test.com': {
    password: 'user',
    user: {
      id: 'user-emp',
      email: 'user@test.com',
      fullname: 'Мария Иванова',
      type: 'EMPLOYEE',
      employee: {
        id: 'emp-2',
        department: { id: 'dept-sales', name: 'Департамент продаж' },
        division:   { id: 'div-sales', name: 'Отдел продаж', departmentId: 'dept-sales' },
        position:   { id: 'pos-s2', name: 'Менеджер по продажам' },
        role:       { id: 'role-mgr', name: 'manager' },
        birthDate: '1995-08-22',
        employmentDate: '2022-06-01',
      },
    },
  },

  'service@test.com': {
    password: 'test',
    user: {
      id: 'user-service',
      email: 'service@test.com',
      fullname: 'Виктор Кузнецов',
      type: 'EMPLOYEE',
      employee: {
        id: 'emp-service',
        department: { id: 'dept-sales', name: 'Департамент продаж' },
        division:   { id: 'div-service', name: 'Отдел сервиса', departmentId: 'dept-sales', isService: true },
        position:   { id: 'pos-sv2', name: 'Специалист сервиса' },
        role:       { id: 'role-mgr2', name: 'manager' },
        birthDate: '1992-11-08',
        employmentDate: '2021-05-15',
      },
    },
  },

  'client@test.com': {
    password: 'client',
    user: {
      id: 'user-client',
      email: 'client@test.com',
      fullname: 'Алексей Громов',
      type: 'CLIENT',
    },
  },
};

const SESSION_KEY        = 'gl_auth_user';
const PENDING_REG_KEY    = 'gl_pending_reg';
const REGISTERED_KEY     = 'gl_registered_users';
const INVITE_TOKENS_KEY  = 'gl_invite_tokens';

export interface InviteRecord {
  email: string;
  fullname: string | null;
  expiresAt: string;
}

// Вспомогательные функции для работы с хранилищем pending/registered пользователей
function getPendingRegs(): Record<string, { fullname: string; email: string; password: string }> {
  try { return JSON.parse(sessionStorage.getItem(PENDING_REG_KEY) ?? '{}') as Record<string, { fullname: string; email: string; password: string }>; }
  catch { return {}; }
}
type RegisteredUser = { fullname: string; password: string; type?: 'EMPLOYEE' | 'CLIENT' };
function getRegisteredUsers(): Record<string, RegisteredUser> {
  try { return JSON.parse(sessionStorage.getItem(REGISTERED_KEY) ?? '{}') as Record<string, RegisteredUser>; }
  catch { return {}; }
}
function getInviteTokensStore(): Record<string, InviteRecord> {
  try { return JSON.parse(sessionStorage.getItem(INVITE_TOKENS_KEY) ?? '{}') as Record<string, InviteRecord>; }
  catch { return {}; }
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (avatar: UserAvatar | undefined) => void;
  /** Регистрация: создаёт pending-запись и возвращает токен для письма */
  register: (fullname: string, email: string, password: string) => Promise<string>;
  /** Подтверждение email по токену. Возвращает true при успехе */
  verifyEmail: (token: string) => boolean;
  /** Создаёт invite-токен (mock "отправить письмо"). Возвращает токен. */
  createInviteToken: (email: string, fullname: string | null, expiresAt: string) => string;
  /** Возвращает данные invite по токену, или null если не найден / истёк */
  getInviteData: (token: string) => InviteRecord | null;
  /** Завершает регистрацию по invite-токену. Возвращает true при успехе. */
  completeInvite: (token: string, fullname: string, password: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try { setUser(JSON.parse(stored) as User); }
      catch { sessionStorage.removeItem(SESSION_KEY); }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const normalized = email.toLowerCase();
    let mockCred = MOCK_CREDENTIALS[normalized];

    // Также проверяем пользователей, прошедших верификацию email
    if (!mockCred) {
      const registered = getRegisteredUsers();
      const reg = registered[normalized];
      if (reg && reg.password === password) {
        const syntheticUser: User = {
          id: `user-${normalized.replace(/[@.]/g, '-')}`,
          email: normalized,
          fullname: reg.fullname,
          type: reg.type ?? 'EMPLOYEE',
        };
        await new Promise<void>(r => setTimeout(r, 300));
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(syntheticUser));
        setUser(syntheticUser);
        return;
      }
    }

    if (!mockCred || mockCred.password !== password) {
      throw new Error('Invalid credentials');
    }
    await new Promise<void>(r => setTimeout(r, 300));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(mockCred.user));
    setUser(mockCred.user);
  }, []);

  const register = useCallback(async (fullname: string, email: string, password: string): Promise<string> => {
    await new Promise<void>(r => setTimeout(r, 400));
    const normalized = email.toLowerCase();

    if (MOCK_CREDENTIALS[normalized]) throw new Error('Email уже используется');
    const registered = getRegisteredUsers();
    if (registered[normalized]) throw new Error('Email уже используется');

    const token = `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pending = getPendingRegs();
    pending[token] = { fullname, email: normalized, password };
    sessionStorage.setItem(PENDING_REG_KEY, JSON.stringify(pending));
    return token;
  }, []);

  const verifyEmail = useCallback((token: string): boolean => {
    const pending = getPendingRegs();
    const reg = pending[token];
    if (!reg) return false;

    // Переносим в подтверждённые
    const registered = getRegisteredUsers();
    registered[reg.email] = { fullname: reg.fullname, password: reg.password };
    sessionStorage.setItem(REGISTERED_KEY, JSON.stringify(registered));

    // Удаляем из pending
    delete pending[token];
    sessionStorage.setItem(PENDING_REG_KEY, JSON.stringify(pending));
    return true;
  }, []);

  const createInviteToken = useCallback((
    email: string,
    fullname: string | null,
    expiresAt: string,
  ): string => {
    const token = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const store = getInviteTokensStore();
    store[token] = { email: email.toLowerCase(), fullname, expiresAt };
    sessionStorage.setItem(INVITE_TOKENS_KEY, JSON.stringify(store));
    return token;
  }, []);

  const getInviteData = useCallback((token: string): InviteRecord | null => {
    const store = getInviteTokensStore();
    return store[token] ?? null;
  }, []);

  const completeInvite = useCallback((token: string, fullname: string, password: string): boolean => {
    const store = getInviteTokensStore();
    const record = store[token];
    if (!record) return false;
    if (new Date(record.expiresAt) < new Date()) return false;

    const registered = getRegisteredUsers();
    registered[record.email] = { fullname, password, type: 'CLIENT' };
    sessionStorage.setItem(REGISTERED_KEY, JSON.stringify(registered));

    delete store[token];
    sessionStorage.setItem(INVITE_TOKENS_KEY, JSON.stringify(store));
    return true;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const updateAvatar = useCallback((avatar: UserAvatar | undefined) => {
    setUser(prev => {
      if (!prev) return null;
      const updated: User = { ...prev, avatar };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, login, logout, updateAvatar, register, verifyEmail, createInviteToken, getInviteData, completeInvite }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth должен вызываться внутри <UserProvider>');
  return context;
}

export function useUser() {
  const { user, ...rest } = useAuth();
  if (!user) throw new Error('useUser требует авторизованного пользователя');
  return { user, ...rest };
}
