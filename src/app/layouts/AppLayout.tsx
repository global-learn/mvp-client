import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/ui/Sidebar';
import { CoursesProvider } from '@entities/course/model/CoursesContext';
import { OnboardingProvider } from '@entities/onboarding/model/OnboardingContext';
import styles from './AppLayout.module.css';

export function AppLayout() {
  return (
    <CoursesProvider>
      <OnboardingProvider>
        <div className={styles.layout}>
          <Sidebar />
          <div className={styles.contentArea}>
            <main className={styles.main}>
              <Outlet />
            </main>
          </div>
        </div>
      </OnboardingProvider>
    </CoursesProvider>
  );
}
