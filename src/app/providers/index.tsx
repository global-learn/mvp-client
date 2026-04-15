import { BrowserRouter } from 'react-router-dom';
import { type ReactNode } from 'react';
import { UserProvider } from '@entities/user/model/UserContext';
import { CoursesProvider } from '@entities/course/model/CoursesContext';

// ================================================================
// ПОРЯДОК ПРОВАЙДЕРОВ ВАЖЕН
// ================================================================
//
//   BrowserRouter
//   └── UserProvider          ← должен быть ВЫШЕ CoursesProvider
//       └── CoursesProvider   ← внутри вызывает useUser()
//           └── children      ← всё приложение
//
// Правило: если провайдер A использует данные провайдера B,
// то B должен оборачивать A (стоять выше в дереве).
//
// BrowserRouter — самый внешний, т.к. Link, Navigate, useNavigate
// нужны в любой части приложения, включая сами провайдеры.

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <BrowserRouter>
      <UserProvider>
        <CoursesProvider>{children}</CoursesProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
