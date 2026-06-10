import { type ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { useOnboarding } from '@entities/onboarding/model/OnboardingContext';
import styles from './OnboardingGate.module.css';

interface Props { children: ReactNode }

export function OnboardingGate({ children }: Props) {
  const { myAssignments, isLoading } = useOnboarding();
  const { pathname } = useLocation();

  const hasActiveOnboarding = !isLoading && myAssignments.some(a => a.status === 'in_progress');
  const onOnboardingPage    = pathname === '/onboarding' || pathname.startsWith('/onboarding/');

  if (hasActiveOnboarding && !onOnboardingPage) {
    return (
      <div className={styles.gate}>
        <div className={styles.card}>
          <ClipboardList size={40} className={styles.icon} />
          <h1 className={styles.title}>Сначала завершите онбординг</h1>
          <p className={styles.text}>
            Вам назначен план вступления в должность. Пожалуйста, пройдите все его шаги —
            после этого вы получите полный доступ к платформе.
          </p>
          <Link to="/onboarding" className={styles.btn}>
            Перейти к онбордингу
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
