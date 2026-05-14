import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth, type InviteRecord } from '@entities/user/model/UserContext';
import styles from './CompleteRegistration.module.css';

// ================================================================
// CompleteRegistrationPage — /complete-registration?token=xxx
// Страница завершения регистрации по приглашению (invite-link).
// Не отображается в меню — доступна только по прямой ссылке.
// ================================================================

export function CompleteRegistrationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getInviteData, completeInvite } = useAuth();

  const token = searchParams.get('token') ?? '';

  // Состояние валидации токена
  const [invite, setInvite]         = useState<InviteRecord | null>(null);
  const [tokenError, setTokenError] = useState<string>('');
  const [tokenChecked, setTokenChecked] = useState(false);

  // Поля формы
  const [fullname, setFullname]     = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Статус отправки
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [success, setSuccess]       = useState(false);

  // Проверяем токен один раз при монтировании
  useEffect(() => {
    if (!token) {
      setTokenError('Ссылка недействительна: токен не указан.');
      setTokenChecked(true);
      return;
    }
    const data = getInviteData(token);
    if (!data) {
      setTokenError('Ссылка недействительна или уже была использована.');
      setTokenChecked(true);
      return;
    }
    if (new Date(data.expiresAt) < new Date()) {
      setTokenError('Срок действия ссылки истёк. Обратитесь к администратору за новой.');
      setTokenChecked(true);
      return;
    }
    setInvite(data);
    if (data.fullname) setFullname(data.fullname);
    setTokenChecked(true);
  }, [token, getInviteData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullname.trim()) { setFormError('Введите имя'); return; }
    if (password.length < 6) { setFormError('Пароль должен содержать не менее 6 символов'); return; }
    if (password !== confirm) { setFormError('Пароли не совпадают'); return; }

    setSubmitting(true);
    await new Promise<void>(r => setTimeout(r, 400)); // имитация запроса

    const ok = completeInvite(token, fullname.trim(), password);
    if (!ok) {
      setFormError('Не удалось завершить регистрацию. Попробуйте ещё раз.');
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => navigate('/login', { state: { registeredEmail: invite?.email } }), 2500);
  };

  // ── Загрузка ──
  if (!tokenChecked) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <GraduationCap size={22} className={styles.logoIcon} />
            <span className={styles.logoText}>GlobalLearn</span>
          </div>
          <p className={styles.loading}>Проверяем ссылку...</p>
        </div>
      </div>
    );
  }

  // ── Недействительный токен ──
  if (tokenError) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <GraduationCap size={22} className={styles.logoIcon} />
            <span className={styles.logoText}>GlobalLearn</span>
          </div>
          <div className={styles.errorState}>
            <AlertCircle size={36} className={styles.errorIcon} />
            <h1 className={styles.errorTitle}>Ссылка недействительна</h1>
            <p className={styles.errorText}>{tokenError}</p>
            <Link to="/login" className={styles.backLink}>← Войти в систему</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Успешная регистрация ──
  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <GraduationCap size={22} className={styles.logoIcon} />
            <span className={styles.logoText}>GlobalLearn</span>
          </div>
          <div className={styles.successState}>
            <CheckCircle2 size={40} className={styles.successIcon} />
            <h1 className={styles.successTitle}>Регистрация завершена!</h1>
            <p className={styles.successText}>
              Аккаунт создан. Сейчас вы будете перенаправлены на страницу входа.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Основная форма ──
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <GraduationCap size={22} className={styles.logoIcon} />
          <span className={styles.logoText}>GlobalLearn</span>
        </div>

        <h1 className={styles.title}>Завершение регистрации</h1>

        {invite && (
          <div className={styles.inviteBanner}>
            <span className={styles.inviteBannerLabel}>Приглашение для</span>
            <span className={styles.inviteBannerEmail}>{invite.email}</span>
          </div>
        )}

        {formError && <div className={styles.error}>{formError}</div>}

        <form className={styles.form} onSubmit={e => { void handleSubmit(e); }}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="fullname">Полное имя</label>
            <input
              id="fullname"
              type="text"
              className={styles.input}
              value={fullname}
              onChange={e => setFullname(e.target.value)}
              placeholder="Иван Петров"
              required
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Придумайте пароль</label>
            <div className={styles.passwordWrap}>
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className={styles.input}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Не менее 6 символов"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm">Повторите пароль</label>
            <div className={styles.passwordWrap}>
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                className={styles.input}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirm(v => !v)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirm && password !== confirm && (
              <span className={styles.fieldError}>Пароли не совпадают</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting || !fullname.trim() || password.length < 6 || password !== confirm}
          >
            {submitting ? 'Сохраняем...' : 'Завершить регистрацию'}
          </button>
        </form>

        <p className={styles.loginHint}>
          Уже есть аккаунт? <Link to="/login" className={styles.loginLink}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
