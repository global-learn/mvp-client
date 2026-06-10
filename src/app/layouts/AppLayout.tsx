import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/ui/Sidebar';
import { CoursesProvider } from '@entities/course/model/CoursesContext';
import { OnboardingProvider } from '@entities/onboarding/model/OnboardingContext';
import { NotificationProvider } from '@entities/notification/model/NotificationContext';
import { OnboardingGate } from './OnboardingGate';
import styles from './AppLayout.module.css';

export function AppLayout() {
  return (
    <CoursesProvider>
      <OnboardingProvider>
        <NotificationProvider>
          <div className={styles.layout}>
            <Sidebar />
            <div className={`${styles.contentArea} subtle-dot-grid`}>
              <main className={styles.main}>
                <OnboardingGate>
                  <Outlet />
                </OnboardingGate>
              </main>
            </div>
          </div>
        </NotificationProvider>
      </OnboardingProvider>
    </CoursesProvider>
  );
}
