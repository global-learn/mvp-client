import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/ui/Sidebar';
import { CoursesProvider } from '@entities/course/model/CoursesContext';
import { OnboardingProvider } from '@entities/onboarding/model/OnboardingContext';
import { LearningPathProvider } from '@entities/learning-path/model/LearningPathContext';
import styles from './AppLayout.module.css';

export function AppLayout() {
  return (
    <CoursesProvider>
      <OnboardingProvider>
        <LearningPathProvider>
          <div className={styles.layout}>
            <Sidebar />
            <div className={`${styles.contentArea} subtle-dot-grid`}>
              <main className={styles.main}>
                <Outlet />
              </main>
            </div>
          </div>
        </LearningPathProvider>
      </OnboardingProvider>
    </CoursesProvider>
  );
}
