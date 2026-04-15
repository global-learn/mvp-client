import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/ui/Sidebar';
import styles from './AppLayout.module.css';

// В React Router v6 layout-компоненты используют <Outlet />
// вместо {children}. Outlet рендерит текущий вложенный маршрут.
//
// В роутере (app/router/index.tsx) все страницы вложены в этот Layout:
//   <Route element={<AppLayout />}>
//     <Route path="/dashboard" element={<DashboardPage />} />
//     ...
//   </Route>

export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
