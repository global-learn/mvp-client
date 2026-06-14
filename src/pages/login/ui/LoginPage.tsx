import {useState, useEffect} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {GraduationCap, ArrowLeft} from 'lucide-react';
import {motion} from 'motion/react';
import {useAuth} from '@entities/user/model/UserContext';
import {getApiStatus, getApiErrorMessage} from '@shared/api/apiError';

export function LoginPage() {
  const {login, isLoading, isAuthenticated} = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mouse, setMouse] = useState({x: -9999, y: -9999});

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({x: e.clientX, y: e.clientY});
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  if (!isLoading && isAuthenticated) {
    navigate('/dashboard', {replace: true});
    return null;
  }

  if (isLoading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard', {replace: true});
    } catch (err) {
      if (getApiStatus(err) === 401) {
        setError('Неверный email или пароль');
      } else {
        setError(getApiErrorMessage(err, 'Ошибка входа. Попробуйте позже'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f8fafc] subtle-dot-grid flex items-center justify-center px-6 relative overflow-hidden antialiased"
    >
      {/* Cursor spotlight */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: `radial-gradient(500px circle at ${mouse.x}px ${mouse.y}px, rgba(0,113,227,0.055), transparent 50%)`,
        }}
      />

      {/* Back to landing */}
      <Link
        to="/"
        className="fixed top-6 left-8 z-20 flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        На главную
      </Link>

      {/* Card */}
      <motion.div
        initial={{opacity: 0, y: 24}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.65, ease: [0.16, 1, 0.3, 1]}}
        className="relative z-20 w-full max-w-[420px] bg-white border border-slate-200/80 rounded-2xl shadow-[0_8px_48px_rgba(0,0,0,0.08)] p-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/30">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-[25px] font-bold tracking-tight text-slate-900">Global Learn</span>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-[26px] font-extrabold text-slate-900 tracking-[-0.035em] leading-tight">
            Вход в систему
          </h1>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{opacity: 0, y: -4}}
            animate={{opacity: 1, y: 0}}
            className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[13.5px] text-red-600 font-medium text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={e => { void handleSubmit(e); }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[13px] font-semibold text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@company.com"
              required
              autoComplete="email"
              className="px-3.5 py-2.5 text-[14px] border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-300 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-[13px] font-semibold text-slate-700">Пароль</label>
              <Link to="/forgot-password" className="text-[12.5px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Забыли пароль?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="px-3.5 py-2.5 text-[14px] border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-300 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 py-3 bg-blue-600 text-white text-[14px] font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? 'Входим...' : 'Войти'}
          </button>
        </form>

      </motion.div>
    </div>
  );
}
