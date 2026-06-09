import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { User, UserAvatar, EmployeeRole } from './types';
import { authApi } from '../api/authApi';
import { fileApi } from '@shared/api/fileApi';
import { queryKeys } from '@shared/lib/query/queryKeys';

// Maps backend role string (e.g. "admin", "Admin", "department_head") → EmployeeRole
function parseRole(raw: string): EmployeeRole {
  const normalized = raw.toLowerCase().replace(/\s+/g, '_') as EmployeeRole;
  const valid: EmployeeRole[] = ['admin', 'department_head', 'division_head', 'senior_manager', 'manager'];
  return valid.includes(normalized) ? normalized : 'manager';
}

async function fetchCurrentUser(): Promise<User> {
  const profile = await authApi.myProfile();

  const roleName = parseRole(profile.role.name);
  const emp = profile.employee;

  if (!emp) {
    return {
      id:       profile.id,
      email:    profile.email,
      fullname: null,
      type:     'EMPLOYEE',
    };
  }

  let avatar: UserAvatar | undefined;
  if (emp.avatarId) {
    try {
      const url = await fileApi.getUrl(emp.avatarId);
      avatar = { id: emp.avatarId, name: 'photo', isSystem: false, url };
    } catch {
      // ignore — avatar will be missing on load, but that's acceptable
    }
  }

  return {
    id:       profile.id,
    email:    profile.email,
    fullname: emp.fullname,
    type:     'EMPLOYEE',
    avatar,
    employee: {
      id:             emp.id,
      department:     { id: emp.division.department.id, name: emp.division.department.name },
      division:       { id: emp.division.id, name: emp.division.name, departmentId: emp.division.department.id },
      position:       emp.position ? { id: emp.position.id, name: emp.position.name } : undefined,
      role:           { id: roleName, name: roleName },
      biography:      emp.biography,
      employmentDate: emp.employmentDate,
    },
  };
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (avatar: UserAvatar | undefined) => void;
  /** @deprecated Admin registers employees — stub for old mock pages */
  register: (fullname: string, email: string, password: string) => Promise<string>;
  /** @deprecated Part of mock flow — stub for old mock pages */
  verifyEmail: (token: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn:  fetchCurrentUser,
    retry:    false,
    staleTime: 5 * 60_000,
  });

  const user = data ?? null;

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    await authApi.login(email, password);
    await queryClient.refetchQueries({ queryKey: queryKeys.auth.me });
  }, [queryClient]);

  const logout = useCallback(async (): Promise<void> => {
    try { await authApi.logout(); } catch { /* ignore — clear local state regardless */ }
    navigate('/login', { replace: true });
    queryClient.clear();
  }, [queryClient, navigate]);

  const updateAvatar = useCallback((avatar: UserAvatar | undefined) => {
    queryClient.setQueryData<User | null>(queryKeys.auth.me, prev =>
      prev ? { ...prev, avatar } : null,
    );
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        updateAvatar,
        register: async (_fullname: string, _email: string, _password: string): Promise<string> => {
          throw new Error('Регистрация выполняется администратором');
        },
        verifyEmail: (_token: string): boolean => false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth должен вызываться внутри <UserProvider>');
  return ctx;
}

export function useUser() {
  const { user, ...rest } = useAuth();
  if (!user) throw new Error('useUser требует авторизованного пользователя');
  return { user, ...rest };
}
