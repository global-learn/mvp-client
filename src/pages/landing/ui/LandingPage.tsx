import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  LogIn,
  Award,
  Clock,
  MessageSquare,
  Play,
  Check,
  Users,
  Layers,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@entities/user/model/UserContext';

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'courses' | 'track' | 'stats'>('courses');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!isLoading && isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const features = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Курсы',
      desc: 'Модули, уроки, тесты с минимальным порогом. Прогресс-трекинг и автоматическая выдача сертификатов при 100% прохождении.',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      icon: <Layers className="w-5 h-5" />,
      title: 'Треки обучения',
      desc: 'Последовательные программы развития. Каждый курс открывается только после завершения предыдущего — от новичка до эксперта.',
      color: 'bg-violet-50 text-violet-600 border-violet-100',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5" />,
      title: 'Онбординг',
      desc: 'Система адаптации новых сотрудников с задачами, документами и встроенным чатом между сотрудником и куратором.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: 'Контроль',
      desc: 'Руководители видят статистику прогресса своей команды в реальном времени — по курсу или по сотруднику.',
      color: 'bg-orange-50 text-orange-600 border-orange-100',
    },
  ];

  const faqs = [
    {
      q: 'Как получить доступ к платформе?',
      a: 'Доступ предоставляется через корпоративный email. Администратор создаёт аккаунт — данные приходят на почту. Клиенты регистрируются по инвайт-ссылке от менеджера сервисного отдела.',
    },
    {
      q: 'Можно ли проходить курсы с телефона?',
      a: 'Да, интерфейс адаптирован для мобильных устройств. Прогресс синхронизируется в реальном времени — начните на компьютере, продолжите с телефона.',
    },
    {
      q: 'Как работают сертификаты и дипломы?',
      a: 'При 100% прохождении курса автоматически выдаётся сертификат. После завершения всего трека — диплом о треке. Все документы доступны в профиле и готовы к скачиванию.',
    },
    {
      q: 'Что видят руководители в контрольной панели?',
      a: 'Зависит от роли: администратор видит всех, руководитель департамента — только свой департамент, руководитель отдела — свой отдел. Просмотр по курсу и по сотруднику с фильтрами.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-x-hidden subtle-dot-grid">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60 py-3.5 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold tracking-tight text-slate-900 leading-tight">Global Learn</span>
              <span className="text-[8px] tracking-wider text-slate-400 font-bold uppercase leading-none mt-0.5">Корпоративная LMS</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Возможности</a>
            <a href="#how" className="hover:text-slate-900 transition-colors">Как работает</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              Войти
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs"
            >
              Начать
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col"
          >
            <div className="mb-5 inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Корпоративная платформа обучения</span>
            </div>

            <h1 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Обучайте команду{' '}
              <span className="text-blue-600">системно</span>{' '}
              и с результатом
            </h1>

            <p className="text-[15.5px] text-slate-500 leading-relaxed mb-8 max-w-[500px]">
              Курсы, треки развития, онбординг сотрудников и контроль успеваемости — полный цикл корпоративного обучения в одном месте.
            </p>

            <div className="flex flex-wrap gap-3 mb-12">
              <Link
                to="/login"
                className="px-6 py-3 bg-blue-600 text-white font-bold text-[13px] rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm"
              >
                Войти в систему
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="px-6 py-3 bg-white text-slate-700 font-semibold text-[13px] rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-xs"
              >
                Узнать больше
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200">
              {[
                { val: '5 ролей', label: 'Гибкие права доступа' },
                { val: 'Авто', label: 'Сертификаты и дипломы' },
                { val: '100%', label: 'Онлайн, без установки' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <span className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">{s.val}</span>
                  <span className="text-[11.5px] text-slate-500 font-medium leading-tight mt-1">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Demo card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6"
          >
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
              {/* Card header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Кабинет сотрудника (демо)</span>
                </div>
                {/* Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                  {(['courses', 'track', 'stats'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="relative px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer select-none"
                    >
                      <span className={`relative z-10 ${activeTab === tab ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}>
                        {tab === 'courses' && 'Мои курсы'}
                        {tab === 'track' && 'Трек'}
                        {tab === 'stats' && 'Прогресс'}
                      </span>
                      {activeTab === tab && (
                        <motion.div
                          layoutId="demoTab"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/40 z-0"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 h-[280px] flex flex-col justify-between overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeTab === 'courses' && (
                    <motion.div
                      key="courses"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      {/* Course 1 — in progress */}
                      <div className="p-3.5 bg-gradient-to-r from-blue-50/60 to-indigo-50/20 border border-blue-100/70 rounded-xl">
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div>
                            <span className="text-[9px] text-blue-600 uppercase font-bold tracking-wide block mb-0.5">В процессе</span>
                            <h4 className="text-[12.5px] font-bold text-slate-800 leading-snug">Корпоративные стандарты и ценности</h4>
                          </div>
                          <span className="text-[10px] bg-blue-100/80 text-blue-700 px-2 py-0.5 rounded-lg font-bold shrink-0">Модуль 3/4</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                          <span>Прогресс прохождения</span>
                          <span className="font-bold text-blue-600">75%</span>
                        </div>
                        <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full w-[75%]" />
                        </div>
                      </div>

                      {/* Course 2 — completed */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="text-[12px] text-slate-600 font-medium">Информационная безопасность</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold">Завершён</span>
                      </div>

                      {/* Course 3 — waiting */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border border-slate-300 bg-white flex items-center justify-center shrink-0">
                            <Play className="w-2.5 h-2.5 text-slate-300" />
                          </div>
                          <span className="text-[12px] text-slate-400 font-medium">Управление проектами</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Не начат</span>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'track' && (
                    <motion.div
                      key="track"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Трек: Развитие менеджера</span>
                        <span className="text-[11px] font-bold text-blue-600">2/4 курса</span>
                      </div>
                      {[
                        { title: 'Введение и стандарты компании', status: 'done' },
                        { title: 'Управление командой', status: 'done' },
                        { title: 'Аналитика и отчётность', status: 'active' },
                        { title: 'Лидерство и стратегическое мышление', status: 'locked' },
                      ].map((step, i) => (
                        <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border text-[12px] ${step.status === 'active' ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                          <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border ${step.status === 'done' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : step.status === 'active' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-300 border-slate-200'}`}>
                            {step.status === 'done' ? '✓' : i + 1}
                          </div>
                          <span className={`flex-1 ${step.status === 'locked' ? 'text-slate-350' : step.status === 'active' ? 'text-slate-800 font-semibold' : 'text-slate-600'}`}>{step.title}</span>
                          <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${step.status === 'done' ? 'text-emerald-700 bg-emerald-100' : step.status === 'active' ? 'text-blue-700 bg-blue-100' : 'text-slate-400 bg-slate-100'}`}>
                            {step.status === 'done' ? 'Готово' : step.status === 'active' ? 'Идёт' : 'Закрыт'}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'stats' && (
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Завершено курсов', val: '12', sub: '+3 за месяц', color: 'text-slate-900' },
                          { label: 'Сертификатов', val: '12', sub: 'Все получены', color: 'text-emerald-600' },
                          { label: 'В процессе', val: '3', sub: 'Средний: 68%', color: 'text-blue-600' },
                          { label: 'Средний прогресс', val: '87%', sub: 'Выше нормы', color: 'text-slate-900' },
                        ].map((s, i) => (
                          <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide block">{s.label}</span>
                            <p className={`text-[16px] font-extrabold mt-1 leading-none ${s.color}`}>{s.val}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-end justify-between h-12 gap-1.5 select-none">
                        {[35, 52, 45, 68, 80, 92, 75, 100].map((val, i) => (
                          <div key={i} className="flex-1 bg-slate-200/50 h-full rounded-sm relative">
                            <div style={{ height: `${val}%` }} className="absolute inset-x-0 bottom-0 bg-blue-600/70 rounded-xs" />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Синхронизация в реальном времени
                  </span>
                  <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-0.5">
                    Войти в кабинет <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-20">
          <div className="border-b border-slate-200 pb-8 mb-12">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-2">Возможности платформы</span>
            <h2 className="text-[30px] font-extrabold text-slate-900 tracking-tight">Всё для обучения команды</h2>
            <p className="text-slate-500 mt-2 text-[14px] leading-relaxed max-w-2xl">
              От создания курсов до контроля успеваемости — полный цикл корпоративного обучения в единой системе.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-xl p-5 flex flex-col gap-3.5 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${f.color}`}>
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-slate-900 mb-1">{f.title}</h4>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="max-w-6xl mx-auto px-6 sm:px-8 py-20">
        <div className="border-b border-slate-200 pb-8 mb-12">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-2">Как это работает</span>
          <h2 className="text-[30px] font-extrabold text-slate-900 tracking-tight">Три шага до результата</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              num: '01',
              icon: <BookOpen className="w-5 h-5" />,
              title: 'Создайте курс или трек',
              desc: 'Администраторы и руководители создают курсы с модулями, уроками и тестами. Настройте аудиторию, сложность и последовательность прохождения.',
              checks: ['Markdown-уроки и тесты', 'Настройка аудитории', 'Публикация и архивация'],
            },
            {
              num: '02',
              icon: <Users className="w-5 h-5" />,
              title: 'Назначьте сотрудникам',
              desc: 'Назначьте курсы напрямую — они сразу становятся доступны. Или сотрудники подают заявки самостоятельно с одобрением руководителя.',
              checks: ['Прямое назначение', 'Заявки с одобрением', 'Гибкая система ролей'],
            },
            {
              num: '03',
              icon: <Award className="w-5 h-5" />,
              title: 'Отслеживайте и награждайте',
              desc: 'Контрольная панель показывает успеваемость команды. Сертификаты и дипломы выдаются автоматически при завершении курса или трека.',
              checks: ['Статистика в реальном времени', 'Автосертификаты', 'Дипломы за треки'],
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {i < 2 && (
                <div className="hidden md:block absolute top-5 left-full w-full h-[1px] bg-slate-200 z-0 translate-x-4 -translate-y-0.5" style={{ width: 'calc(100% - 2rem)' }} />
              )}
              <div className="bg-white border border-slate-200 rounded-xl p-6 relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Шаг {step.num}</span>
                </div>
                <h4 className="text-[15px] font-bold text-slate-900 mb-2">{step.title}</h4>
                <p className="text-[12.5px] text-slate-500 leading-relaxed mb-4">{step.desc}</p>
                <div className="space-y-1.5">
                  {step.checks.map((c, j) => (
                    <div key={j} className="flex items-center gap-2 text-[12px] text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ROLES BANNER ── */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-3">Гибкая система ролей</span>
              <h2 className="text-[28px] font-extrabold tracking-tight leading-tight mb-4">
                Каждый видит только то,<br />что ему нужно
              </h2>
              <p className="text-slate-400 text-[14px] leading-relaxed max-w-md">
                Пять ролей с разными правами доступа. Администратор управляет всем, менеджер — только своими курсами. Клиенты видят только свои материалы.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { role: 'Администратор', desc: 'Полный доступ: курсы, клиенты, статистика, компания', color: 'border-blue-500/30 bg-blue-500/5' },
                { role: 'Рук. департамента', desc: 'Создаёт курсы, видит статистику своего департамента', color: 'border-violet-500/30 bg-violet-500/5' },
                { role: 'Рук. отдела', desc: 'Управляет обучением внутри своего отдела', color: 'border-emerald-500/30 bg-emerald-500/5' },
                { role: 'Старший менеджер', desc: 'Назначает курсы, видит прогресс подчинённых', color: 'border-orange-500/30 bg-orange-500/5' },
              ].map((r, i) => (
                <div key={i} className={`p-4 rounded-xl border ${r.color}`}>
                  <h5 className="text-[13px] font-bold text-white mb-1">{r.role}</h5>
                  <p className="text-[11.5px] text-slate-400 leading-snug">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-6xl mx-auto px-6 sm:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14">
          <div className="lg:col-span-5 space-y-5">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-2">FAQ</span>
              <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">Частые вопросы</h2>
              <p className="text-slate-500 mt-3 text-[14px] leading-relaxed max-w-sm">
                Ответы на популярные вопросы о платформе. Не нашли — напишите через встроенный чат.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-4">
              {[
                { icon: <Clock className="w-4 h-4" />, title: 'Поддержка', text: 'Встроенный чат с куратором внутри платформы' },
                { icon: <Shield className="w-4 h-4" />, title: 'Безопасность', text: 'Корпоративная авторизация, роли и права' },
                { icon: <Sparkles className="w-4 h-4" />, title: 'Автоматизация', text: 'Сертификаты и дипломы выдаются без участия HR' },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                    {c.icon}
                  </div>
                  <div>
                    <h5 className="text-[13px] font-bold text-slate-800">{c.title}</h5>
                    <p className="text-[12px] text-slate-500 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-2.5">
            {faqs.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden transition-all shadow-xs">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-slate-800 text-[13.5px] hover:bg-slate-50/50 transition focus:outline-none select-none cursor-pointer"
                  >
                    <span className="leading-snug">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>
                  <div className={`transition-all duration-200 overflow-hidden ${isOpen ? 'max-h-[200px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0'}`}>
                    <p className="px-5 py-4 text-[13px] text-slate-500 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-lg bg-slate-100 text-slate-500 shrink-0 mt-0.5 px-8 sm:px-12 py-14 text-center relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">Начните прямо сейчас</span>
            </div>

            <p className="text-white/70 text-[15px] leading-relaxed max-w-md mx-auto mb-8">
              Войдите с корпоративным аккаунтом и начните уже сегодня.
            </p>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-blue-700 font-bold text-[13px] rounded-xl hover:bg-slate-50 transition-all shadow-lg active:scale-[0.98]"
            >
              Войти в систему
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[13px] font-bold text-slate-900 tracking-tight">Global Learn</span>
              </div>
              <p className="text-[12.5px] text-slate-500 leading-relaxed max-w-xs">
                Корпоративная LMS для сотрудников и клиентов. Курсы, треки, онбординг и аналитика в едином пространстве.
              </p>
            </div>

            <div className="md:col-span-3 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Платформа</p>
              <ul className="space-y-2 text-[12.5px] text-slate-500">
                <li><a href="#features" className="hover:text-blue-600 transition-colors">Возможности</a></li>
                <li><a href="#how" className="hover:text-blue-600 transition-colors">Как работает</a></li>
                <li><a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Войти</p>
              <ul className="space-y-2 text-[12.5px] text-slate-500">
                <li><Link to="/login" className="hover:text-blue-600 transition-colors">Вход в систему</Link></li>
                <li><Link to="/register" className="hover:text-blue-600 transition-colors">Регистрация</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} Global Learn. Все права защищены.</span>
            <div className="flex gap-4">
              <a href="#faq" className="hover:text-blue-600 transition-colors">Поддержка</a>
              <a href="#features" className="hover:text-blue-600 transition-colors">О платформе</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
