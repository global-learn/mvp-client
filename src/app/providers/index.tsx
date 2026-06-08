import { BrowserRouter } from 'react-router-dom';
import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { UserProvider } from '@entities/user/model/UserContext';
import { toast } from '@shared/lib/toast';

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
        queryCache: new QueryCache({
          onError: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const status = (error as { response?: { status?: number } }).response?.status;
              // 401 — not authenticated; axios interceptor handles redirect to /login
              if (status === 401) return;
              toast.apiError(error, 'Ошибка загрузки данных');
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime:    5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UserProvider>{children}</UserProvider>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors closeButton duration={4000} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
    </QueryClientProvider>
  );
}
