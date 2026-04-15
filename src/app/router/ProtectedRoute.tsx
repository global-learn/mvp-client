import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@entities/user/model/UserContext';

// ProtectedRoute — "охранник" для закрытых маршрутов.
// Работает как AppLayout: рендерит Outlet (вложенные маршруты) если авторизован,
// иначе редиректит на /login.
//
// isLoading — ждём пока восстановится сессия (sessionStorage → будущие cookies).
// Без этого при перезагрузке был бы мгновенный редирект на /login до восстановления сессии.

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
