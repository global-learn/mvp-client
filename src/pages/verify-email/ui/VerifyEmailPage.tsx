import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GraduationCap, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@entities/user/model/UserContext';
import styles from './VerifyEmail.module.css';

type Status = 'checking' | 'success' | 'invalid';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const token = searchParams.get('token') ?? '';
    // Небольшая задержка для реалистичности
    const t = setTimeout(() => {
      const ok = verifyEmail(token);
      setStatus(ok ? 'success' : 'invalid');
    }, 800);
    return () => clearTimeout(t);
  }, [searchParams, verifyEmail]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <GraduationCap size={28} />
          <span>GlobalLearn</span>
        </div>

        {status === 'checking' && (
          <>
            <div className={styles.iconWrap}>
              <Loader2 size={44} className={styles.spinner} />
            </div>
            <h1 className={styles.title}>Проверяем ссылку...</h1>
            <p className={styles.subtitle}>Подождите секунду</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.iconWrap}>
              <CheckCircle2 size={52} className={styles.iconSuccess} />
            </div>
            <h1 className={styles.title}>Email подтверждён! 🎉</h1>
            <p className={styles.subtitle}>
              Регистрация завершена. Теперь вы можете войти в систему.
            </p>
            <Link to="/login" className={styles.btn}>
              Войти в аккаунт →
            </Link>
          </>
        )}

        {status === 'invalid' && (
          <>
            <div className={styles.iconWrap}>
              <XCircle size={52} className={styles.iconError} />
            </div>
            <h1 className={styles.title}>Ссылка недействительна</h1>
            <p className={styles.subtitle}>
              Ссылка устарела или уже была использована.
              Зарегистрируйтесь повторно.
            </p>
            <div className={styles.links}>
              <Link to="/register" className={styles.btn}>
                Зарегистрироваться
              </Link>
              <Link to="/login" className={styles.ghost}>
                Войти
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
