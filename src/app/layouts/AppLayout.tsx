import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/ui/Sidebar';
import { CoursesProvider } from '@entities/course/model/CoursesContext';
import styles from './AppLayout.module.css';

// В React Router v6 layout-компоненты используют <Outlet />
// вместо {children}. Outlet рендерит текущий вложенный маршрут.
//
// CoursesProvider здесь, а не в глобальных Providers, потому что
// данные курсов нужны только авторизованным пользователям.
// Он монтируется после ProtectedRoute → user гарантированно не null.

export function AppLayout() {
  return (
    <CoursesProvider>
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </CoursesProvider>
  );
}
