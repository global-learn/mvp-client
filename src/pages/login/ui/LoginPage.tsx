import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@entities/user/model/UserContext';
import styles from './Login.module.css';

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Если уже авторизован — редиректим на дашборд
  if (!isLoading && isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  if (isLoading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <GraduationCap size={28} />
          <span>GlobalLearn</span>
        </div>

        <h1 className={styles.title}>Вход в систему</h1>
        <p className={styles.subtitle}>Портал обучения сотрудников</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={e => { void handleSubmit(e); }}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@company.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {/* Подсказка для разработки — удали перед продакшном */}
        <div className={styles.hint}>
          <p className={styles.hintItem}>
            <span className={styles.hintRole}>Администратор:</span> admin@test.com / admin
          </p>
          <p className={styles.hintItem}>
            <span className={styles.hintRole}>Сотрудник:</span> user@test.com / user
          </p>
        </div>
      </div>
    </div>
  );
}
