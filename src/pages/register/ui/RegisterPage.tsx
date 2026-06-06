import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@entities/user/model/UserContext';
import styles from './Register.module.css';

export function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [fullname, setFullname] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }
  if (isLoading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullname.trim()) return setError('Введите полное имя');
    if (!email.trim()) return setError('Введите email');
    if (password !== confirm) return setError('Пароли не совпадают');
    if (password.length < 4) return setError('Пароль должен быть не менее 4 символов');

    setSubmitting(true);
    try {
      const token = await register(fullname.trim(), email.trim(), password);
      navigate(`/verify-email?token=${encodeURIComponent(token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <GraduationCap size={22} className={styles.logoIcon} />
          <span className={styles.logoText}>GlobalLearn</span>
        </div>

        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.subtitle}>Создайте аккаунт сотрудника GlobalLearn</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={e => { void handleSubmit(e); }}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-fullname">Полное имя</label>
            <input
              id="reg-fullname"
              type="text"
              className={styles.input}
              value={fullname}
              onChange={e => setFullname(e.target.value)}
              placeholder="Иван Иванов"
              required
              autoFocus
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.ru"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-password">Пароль</label>
            <input
              id="reg-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 4 символа"
              required
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-confirm">Повторите пароль</label>
            <input
              id="reg-confirm"
              type="password"
              className={styles.input}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Создаём аккаунт...' : 'Создать аккаунт'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" className={styles.link}>← Уже есть аккаунт? Войти</Link>
        </p>
      </div>
    </div>
  );
}
