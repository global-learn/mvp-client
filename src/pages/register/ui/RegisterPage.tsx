import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@entities/user/model/UserContext';
import styles from './Register.module.css';

type Step = 'form' | 'sent';

export function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]           = useState<Step>('form');
  const [fullname, setFullname]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');

  if (!isLoading && isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }
  if (isLoading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 4) {
      setError('Пароль должен быть не менее 4 символов');
      return;
    }

    setSubmitting(true);
    try {
      const token = await register(fullname.trim(), email.trim(), password);
      setVerifyToken(token);
      setStep('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Шаг 2: письмо «отправлено» ── */
  if (step === 'sent') {
    const verifyUrl = `/verify-email?token=${verifyToken}`;
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <GraduationCap size={28} />
            <span>GlobalLearn</span>
          </div>

          <div className={styles.sentIcon}>
            <Mail size={40} />
          </div>

          <h1 className={styles.title}>Проверьте почту</h1>
          <p className={styles.subtitle}>
            Мы отправили письмо на <strong>{email}</strong>.<br />
            Перейдите по ссылке в письме, чтобы завершить регистрацию.
          </p>

          {/* В демо-режиме показываем ссылку прямо здесь */}
          <div className={styles.demoBox}>
            <p className={styles.demoLabel}>🔧 Демо-режим — ссылка из письма:</p>
            <Link to={verifyUrl} className={styles.demoLink}>
              Подтвердить email →
            </Link>
          </div>

          <p className={styles.backHint}>
            <Link to="/login" className={styles.link}>← Вернуться ко входу</Link>
          </p>
        </div>
      </div>
    );
  }

  /* ── Шаг 1: форма ── */
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <GraduationCap size={28} />
          <span>GlobalLearn</span>
        </div>

        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.subtitle}>Создайте аккаунт для доступа к платформе</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={e => { void handleSubmit(e); }}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="fullname">Полное имя</label>
            <input
              id="fullname"
              type="text"
              className={styles.input}
              value={fullname}
              onChange={e => setFullname(e.target.value)}
              placeholder="Иван Иванов"
              required
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
              placeholder="you@example.com"
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

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Регистрируем...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className={styles.loginHint}>
          Уже есть аккаунт?{' '}
          <Link to="/login" className={styles.link}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
