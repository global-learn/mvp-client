import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@entities/user/model/UserContext';
import styles from './Register.module.css';

export function RegisterPage() {
  const { completeInvite, getInviteData, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') ?? '';
  const inviteData = token ? getInviteData(token) : null;

  const [step, setStep]         = useState<'form' | 'done'>('form');
  const [fullname, setFullname] = useState(inviteData?.fullname ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }
  if (isLoading) return null;

  // ── Нет токена или токен неизвестен ──────────────────────────────
  if (!token || !inviteData) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <GraduationCap size={22} className={styles.logoIcon} />
            <span className={styles.logoText}>GlobalLearn</span>
          </div>
          <h1 className={styles.title}>Ссылка недействительна</h1>
          <p className={styles.subtitle}>
            Приглашение не найдено или истёк срок действия ссылки.
            Обратитесь к администратору.
          </p>
          <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/login" className={styles.link}>← Вернуться ко входу</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Токен истёк ───────────────────────────────────────────────────
  if (new Date(inviteData.expiresAt) < new Date()) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <GraduationCap size={22} className={styles.logoIcon} />
            <span className={styles.logoText}>GlobalLearn</span>
          </div>
          <h1 className={styles.title}>Ссылка истекла</h1>
          <p className={styles.subtitle}>
            Срок действия приглашения истёк. Обратитесь к администратору для повторного приглашения.
          </p>
          <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/login" className={styles.link}>← Вернуться ко входу</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Успешно завершено ─────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <GraduationCap size={22} className={styles.logoIcon} />
            <span className={styles.logoText}>GlobalLearn</span>
          </div>
          <div className={styles.sentIcon}>
            <CheckCircle2 size={40} />
          </div>
          <h1 className={styles.title}>Добро пожаловать!</h1>
          <p className={styles.subtitle}>
            Ваш аккаунт успешно создан. Теперь вы можете войти в систему.
          </p>
          <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/login" className={styles.link}>Войти в систему →</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Форма завершения регистрации ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullname.trim()) {
      setError('Введите полное имя');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 4) {
      setError('Пароль должен быть не менее 4 символов');
      return;
    }
    setSubmitting(true);
    await new Promise<void>(r => setTimeout(r, 300));
    const ok = completeInvite(token, fullname.trim(), password);
    if (!ok) {
      setError('Не удалось завершить регистрацию. Обратитесь к администратору.');
      setSubmitting(false);
      return;
    }
    setStep('done');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <GraduationCap size={22} className={styles.logoIcon} />
          <span className={styles.logoText}>GlobalLearn</span>
        </div>

        <h1 className={styles.title}>Завершение регистрации</h1>
        <p className={styles.subtitle}>Вас пригласили в систему обучения GlobalLearn</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={e => { void handleSubmit(e); }}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className={`${styles.input} ${styles.inputReadonly}`}
              value={inviteData.email}
              readOnly
              disabled
              autoComplete="off"
            />
          </div>

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
              autoFocus={!inviteData.fullname}
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-password">Придумайте пароль</label>
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
            disabled={submitting || !fullname.trim()}
          >
            {submitting ? 'Создаём аккаунт...' : 'Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}
