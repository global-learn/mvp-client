import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from './types';

// ================================================================
// ЧТО ТАКОЕ REACT CONTEXT?
// ================================================================
// Проблема: данные нужны в компонентах глубоко в дереве.
//
// БЕЗ Context (prop drilling):
//   App → Page → Widget → Feature → Button (user пробрасывается через каждый!)
//
// С Context:
//   App (UserProvider) → ... → Button вызывает useUser() и сразу получает данные.
//   Промежуточные компоненты не знают о user вообще.
//
// Когда использовать Context:
//   ✓ Данные нужны много где: текущий пользователь, тема, язык
//   ✓ Данные меняются редко
//   ✗ Часто меняющиеся данные (лучше локальный state или React Query)

// Моковые пользователи — для демонстрации ролей пока нет бэкенда
const MOCK_USERS: User[] = [
  { id: 'user-admin', name: 'Алексей', role: 'admin' },
  { id: 'user-emp', name: 'Мария', role: 'employee' },
];

interface UserContextValue {
  user: User;
  switchUser: () => void; // только для демо — переключение между ролями
}

// ШАГ 1: createContext — создаём "контейнер".
// undefined как дефолтное значение — проверяем его в хуке useUser.
const UserContext = createContext<UserContextValue | undefined>(undefined);

// ШАГ 2: Provider — компонент который "поставляет" данные всем потомкам.
// children — всё дерево которое мы оборачиваем.
export function UserProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const user = MOCK_USERS[index];

  const switchUser = () => setIndex(prev => (prev + 1) % MOCK_USERS.length);

  return (
    <UserContext.Provider value={{ user, switchUser }}>
      {children}
    </UserContext.Provider>
  );
}

// ШАГ 3: Кастомный хук — единственный способ читать контекст.
// ПРАВИЛО: всегда оборачивай useContext в свой хук. Почему:
//   а) Проверяет что провайдер подключён (ошибка с понятным текстом)
//   б) Если изменится логика — меняешь только здесь, не во всех компонентах
//   в) В компоненте: const { user } = useUser() — лаконично и понятно
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser должен вызываться внутри <UserProvider>');
  }
  return context;
}
