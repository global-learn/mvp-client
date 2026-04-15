import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from './types';

// ================================================================
// AUTH CONTEXT — cookie-based авторизация (mock до подключения бэкенда)
// ================================================================
//
// Архитектура (когда появится бэкенд):
//   login()  → POST /auth/login  → бэкенд ставит access + refresh cookies
//   logout() → POST /auth/logout → бэкенд очищает cookies
//   При 401  → axios interceptor  → POST /auth/refresh → новый access token
//
// Пока бэкенда нет — имитируем через sessionStorage.
// Чтобы подключить бэкенд: замени тело login() и logout(),
// а инициализацию useEffect — на GET /auth/me.
//
// Два хука:
//   useAuth() — для LoginPage и публичных компонентов. user может быть null.
//   useUser() — только внутри защищённых маршрутов. user гарантированно не null.

interface MockCredential {
  password: string;
  user: User;
}

const MOCK_CREDENTIALS: Record<string, MockCredential> = {
  'admin@test.com': {
    password: 'admin',
    user: { id: 'user-admin', name: 'Алексей', email: 'admin@test.com', role: 'admin' },
  },
  'user@test.com': {
    password: 'user',
    user: { id: 'user-emp', name: 'Мария', email: 'user@test.com', role: 'employee' },
  },
};

const SESSION_KEY = 'gl_auth_user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Восстановить сессию при перезагрузке страницы.
  // TODO: заменить на GET /auth/me (бэкенд вернёт юзера если cookie валидна)
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
    // TODO: заменить на реальный запрос:
    // await api.post('/auth/login', { email, password });
    // const { data } = await api.get<User>('/auth/me');
    // setUser(data);

    const credential = MOCK_CREDENTIALS[email.toLowerCase()];
    if (!credential || credential.password !== password) {
      throw new Error('Invalid credentials');
    }
    await new Promise<void>(resolve => setTimeout(resolve, 300)); // имитация задержки
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(credential.user));
    setUser(credential.user);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    // TODO: заменить на реальный запрос:
    // await api.post('/auth/logout');

    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// useAuth — для компонентов где user может быть null (LoginPage, ProtectedRoute)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth должен вызываться внутри <UserProvider>');
  return context;
}

// useUser — только внутри защищённых маршрутов, где user гарантированно не null.
// CoursesContext, Sidebar и все страницы используют этот хук.
export function useUser() {
  const { user, ...rest } = useAuth();
  if (!user) throw new Error('useUser требует авторизованного пользователя');
  return { user, ...rest };
}
