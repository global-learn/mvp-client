import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, ArrowLeft, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { authApi } from '@entities/user/api/authApi';
import { getApiErrorMessage } from '@shared/api/apiError';
import { toast } from '@shared/lib/toast';

export function CompleteRegistrationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const linkValid = Boolean(token && email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.completeRegistration(token, email, password);
      toast.success('Регистрация завершена. Войдите с новым паролем.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Ссылка-приглашение недействительна или устарела'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] subtle-dot-grid flex items-center justify-center px-6 relative overflow-hidden antialiased">
      <Link
        to="/login"
        className="fixed top-6 left-8 z-20 flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Ко входу
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-[420px] bg-white border border-slate-200/80 rounded-2xl shadow-[0_8px_48px_rgba(0,0,0,0.08)] p-10"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/30">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-[25px] font-bold tracking-tight text-slate-900">Global Learn</span>
        </div>

        {!linkValid ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-[-0.035em] mb-2">
              Некорректная ссылка
            </h1>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              В ссылке-приглашении нет токена или email. Обратитесь к администратору за новым приглашением.
            </p>
            <Link
              to="/login"
              className="inline-block mt-6 py-3 px-6 bg-blue-600 text-white text-[14px] font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/25"
            >
              Ко входу
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-[26px] font-extrabold text-slate-900 tracking-[-0.035em] leading-tight">
                Завершение регистрации
              </h1>
              <p className="text-[14px] text-slate-500 mt-2">
                Придумайте пароль для аккаунта<br /><b>{email}</b>
              </p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[13.5px] text-red-600 font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={e => { void handleSubmit(e); }} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[13px] font-semibold text-slate-700">Пароль</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="px-3.5 py-2.5 text-[14px] border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-300 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-[13px] font-semibold text-slate-700">Повторите пароль</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="px-3.5 py-2.5 text-[14px] border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-300 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 py-3 bg-blue-600 text-white text-[14px] font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? 'Сохраняем...' : 'Завершить регистрацию'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
