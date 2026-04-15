import { BrowserRouter } from 'react-router-dom';
import { type ReactNode } from 'react';
import { UserProvider } from '@entities/user/model/UserContext';

// ================================================================
// ПОРЯДОК ПРОВАЙДЕРОВ
// ================================================================
//
//   BrowserRouter  — самый внешний (Link, Navigate, useNavigate нужны везде)
//   └── UserProvider (AuthContext)
//         └── children → AppRouter
//               ├── /login → LoginPage (публичный)
//               └── ProtectedRoute
//                     └── AppLayout
//                           └── CoursesProvider  ← только для авторизованных
//                                 └── страницы
//
// CoursesProvider перенесён в AppLayout — загружать данные курсов
// нужно только после успешной авторизации.

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <BrowserRouter>
      <UserProvider>{children}</UserProvider>
    </BrowserRouter>
  );
}
