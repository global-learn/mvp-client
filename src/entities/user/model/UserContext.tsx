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
// AUTH CONTEXT — cookie-based авторизация (mock до подключения бэкенда)
// ================================================================
//
// Архитектура (когда появится бэкенд):
//   login()        → POST /auth/login  → бэкенд ставит access + refresh cookies
//   logout()       → POST /auth/logout → бэкенд очищает cookies
//   updateAvatar() → PATCH /users/me/avatar { avatarId }
//   При 401        → axios interceptor  → POST /auth/refresh → новый access token
//
// Два хука:
//   useAuth() — для LoginPage и публичных компонентов. user может быть null.
//   useUser() — только внутри защищённых маршрутов. user гарантированно не null.

const MOCK_CREDENTIALS: Record<string, { password: string; user: User }> = {
  'admin@test.com': {
    password: 'admin',
    user: {
      id: 'user-admin',
      email: 'admin@test.com',
      fullname: 'Алексей Петров',
      type: 'EMPLOYEE',
      avatar: { id: 'sys-blue', name: 'Синий', isSystem: true, bgColor: '#4299e1' },
      employee: {
        id: 'emp-admin',
        department: { id: 'dept-1', name: 'IT отдел' },
        role: { id: 'role-admin', name: 'admin' },
        birthDate: '1990-05-15',
        employmentDate: '2020-01-01',
      },
    },
  },
  // DepartmentHead — управляет своим отделом (может назначать курсы всем в отделе, создавать курсы)
  'head@test.com': {
    password: 'head',
    user: {
      id: 'user-head',
      email: 'head@test.com',
      fullname: 'Дмитрий Козлов',
      type: 'EMPLOYEE',
      avatar: { id: 'sys-green', name: 'Зелёный', isSystem: true, bgColor: '#48bb78' },
      employee: {
        id: 'emp-head',
        department: { id: 'dept-1', name: 'IT отдел' },
        role: { id: 'role-depthead', name: 'departmentHead' },
        birthDate: '1988-03-22',
        employmentDate: '2019-06-01',
      },
    },
  },
  // SeniorManager — может назначать курсы только менеджерам своего отдела
  'senior@test.com': {
    password: 'senior',
    user: {
      id: 'user-senior',
      email: 'senior@test.com',
      fullname: 'Наталья Орлова',
      type: 'EMPLOYEE',
      avatar: { id: 'sys-purple', name: 'Фиолетовый', isSystem: true, bgColor: '#9f7aea' },
      employee: {
        id: 'emp-senior',
        department: { id: 'dept-2', name: 'Продажи' },
        role: { id: 'role-senior', name: 'seniorManager' },
        birthDate: '1992-07-10',
        employmentDate: '2021-01-15',
      },
    },
  },
  'user@test.com': {
    password: 'user',
    user: {
      id: 'user-emp',
      email: 'user@test.com',
      fullname: 'Мария Иванова',
      type: 'CLIENT',
      client: {
        id: 'emp-2',
        company: 'a'
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
      try {
        setUser(JSON.parse(stored) as User);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    // TODO: await api.post('/auth/login', { email, password });
    //       const { data } = await api.get<User>('/auth/me');
    const credential = MOCK_CREDENTIALS[email.toLowerCase()];
    if (!credential || credential.password !== password) {
      throw new Error('Invalid credentials');
    }
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(credential.user));
    setUser(credential.user);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    // TODO: await api.post('/auth/logout');
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const updateAvatar = useCallback((avatar: UserAvatar | undefined) => {
    // TODO: await api.patch('/users/me/avatar', { avatarId: avatar?.id });
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

// useAuth — для LoginPage и ProtectedRoute (user может быть null)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth должен вызываться внутри <UserProvider>');
  return context;
}

// useUser — только внутри защищённых маршрутов, user гарантированно не null
export function useUser() {
  const { user, ...rest } = useAuth();
  if (!user) throw new Error('useUser требует авторизованного пользователя');
  return { user, ...rest };
}
