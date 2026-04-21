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
// AUTH CONTEXT — cookie-based авторизация (mock до бэкенда)
// ================================================================
//
// Доступные тестовые аккаунты:
//   admin@test.com    / admin  → Администратор (IT, Разработка)
//   depthead@test.com / test   → Руководитель отдела (IT, Разработка)
//   senior@test.com   / test   → Старший менеджер (IT, Разработка)
//   user@test.com     / user   → Менеджер (Продажи)
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
        department: { id: 'dept-1', name: 'IT департамент' },
        division:   { id: 'div-1', name: 'Отдел разработки', departmentId: 'dept-1' },
        position:   { id: 'pos-1', name: 'Lead Developer' },
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
        department: { id: 'dept-1', name: 'IT департамент' },
        division:   { id: 'div-1', name: 'Отдел разработки', departmentId: 'dept-1' },
        position:   { id: 'pos-2', name: 'Developer' },
        role:       { id: 'role-depthead', name: 'dept_head' },
        birthDate: '1993-09-12',
        employmentDate: '2021-03-20',
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
        department: { id: 'dept-1', name: 'IT департамент' },
        division:   { id: 'div-1', name: 'Отдел разработки', departmentId: 'dept-1' },
        position:   { id: 'pos-2', name: 'Developer' },
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
        department: { id: 'dept-2', name: 'Департамент продаж' },
        division:   { id: 'div-3', name: 'Отдел продаж', departmentId: 'dept-2' },
        position:   { id: 'pos-4', name: 'Менеджер по продажам' },
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
        department: { id: 'dept-2', name: 'Департамент продаж' },
        division:   { id: 'div-4', name: 'Отдел сервиса', departmentId: 'dept-2', isService: true },
        position:   { id: 'pos-5', name: 'Специалист сервиса' },
        role:       { id: 'role-mgr2', name: 'manager' },
        birthDate: '1992-11-08',
        employmentDate: '2021-05-15',
      },
    },
  },
};

const SESSION_KEY = 'gl_auth_user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (avatar: UserAvatar | undefined) => void;
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
    const credential = MOCK_CREDENTIALS[email.toLowerCase()];
    if (!credential || credential.password !== password) {
      throw new Error('Invalid credentials');
    }
    await new Promise<void>(r => setTimeout(r, 300));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(credential.user));
    setUser(credential.user);
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
      value={{ user, isAuthenticated: user !== null, isLoading, login, logout, updateAvatar }}
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
