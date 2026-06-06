import { BrowserRouter } from 'react-router-dom';
import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { UserProvider } from '@entities/user/model/UserContext';

// ================================================================
// ПОРЯДОК ПРОВАЙДЕРОВ
// ================================================================
//
//   QueryClientProvider — server-state кэш для всего приложения
//     └── BrowserRouter   — Link, Navigate, useNavigate
//           └── UserProvider (AuthContext)
//                 └── children → AppRouter
//                       ├── /login → LoginPage (публичный)
//                       └── ProtectedRoute → AppLayout → страницы

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,            // 30s — данные считаются свежими
            gcTime:    5 * 60_000,        // 5 мин — держать в памяти после ухода
            retry: 1,                     // одна повторная попытка
            refetchOnWindowFocus: false,  // не дёргать API при возврате таба
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UserProvider>{children}</UserProvider>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
    </QueryClientProvider>
  );
}
