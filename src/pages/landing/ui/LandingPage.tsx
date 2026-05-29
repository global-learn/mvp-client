import {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {motion, AnimatePresence, useScroll, useTransform} from 'motion/react';
import {
  GraduationCap,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  LogIn,
  Check,
  Play,
  Award,
  BookOpen,
} from 'lucide-react';
import {useAuth} from '@entities/user/model/UserContext';

/* reusable fade-up on scroll */
function FadeUp({children, delay = 0, className = ''}: {
  children: React.ReactNode;
  delay?: number;
  className?: string
}) {
  return (
    <motion.div
      initial={{opacity: 0, y: 36}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: false, margin: '-80px'}}
      transition={{duration: 0.65, delay, ease: [0.16, 1, 0.3, 1]}}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage() {
  const {isAuthenticated, isLoading} = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'courses' | 'track' | 'stats'>('courses');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mouse, setMouse] = useState({x: -9999, y: -9999});
  const {scrollY} = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -70]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({x: e.clientX, y: e.clientY});
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  if (!isLoading && isAuthenticated) {
    navigate('/dashboard', {replace: true});
    return null;
  }

  return (
    <div
      className="bg-[#f8fafc] text-slate-900 antialiased overflow-x-hidden subtle-dot-grid"
    >
      {/* ── CURSOR SPOTLIGHT ── */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: `radial-gradient(500px circle at ${mouse.x}px ${mouse.y}px, rgba(0,113,227,0.055), transparent 50%)`,
        }}
      />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div
              className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/30">
              <GraduationCap className="w-4 h-4"/>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-slate-900">Global Learn</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Возможности</a>
            <a href="#roles" className="hover:text-slate-900 transition-colors">Роли</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <LogIn className="w-3.5 h-3.5"/> Войти
            </Link>
            <Link to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold !text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-600/25">
              Начать <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════ SECTION 1 — HERO ══════════════════════════════════════ */}
      <section className="min-h-screen flex items-center justify-center text-center px-8 pt-16">
        <motion.div style={{y: heroY}} className="w-full max-w-4xl mx-auto">
          <motion.div
            initial={{opacity: 0, y: 24}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.7, ease: [0.16, 1, 0.3, 1]}}
            className="flex flex-col items-center gap-8"
          >
            <h1
              className="font-extrabold text-slate-900 text-[clamp(52px,7vw,88px)] leading-[1.1] tracking-[-0.045em] mx-auto">
              Обучение команды,{' '}
              <span className="text-blue-600">которое</span>{' '}
              даёт результат
            </h1>

            <p className="text-slate-500 text-[clamp(16px,1.6vw,20px)] leading-[1.7] max-w-2xl mx-auto">
              Курсы, треки развития, онбординг и контроль успеваемости — полный цикл корпоративного обучения в одной
              системе.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/login"
                    className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 !text-white font-semibold text-[14px] rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                Войти в систему <ArrowRight className="w-4 h-4"/>
              </Link>
              <a href="#demo"
                 className="inline-flex items-center gap-2 px-8 py-4 text-[14px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-900 rounded-xl transition-all shadow-sm">
                Посмотреть демо
              </a>
            </div>

            <div className="w-full flex items-center justify-center gap-12 pt-8 border-t border-slate-200/80">
              {[
                {val: '5', label: 'ролей доступа'},
                {val: 'Авто', label: 'сертификаты'},
                {val: '100%', label: 'онлайн'},
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-[24px] font-extrabold text-slate-900 tracking-tight leading-none">{s.val}</span>
                  <span className="text-[12px] text-slate-400 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════ SECTION 2 — DEMO CARD ══════════════════════════════════════ */}
      <section id="demo" className="min-h-screen flex items-center px-8 py-24">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-12">
          <FadeUp className="text-center">
            <div className="flex flex-col items-center gap-3">
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-widest">
                Интерфейс платформы
              </p>
              <h2 className="font-extrabold text-slate-900 text-[clamp(28px,3vw,40px)] tracking-[-0.03em]">
                Кабинет сотрудника
              </h2>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div
              className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_48px_rgba(0,0,0,0.08)] overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-200"/>
                    <span className="w-3 h-3 rounded-full bg-slate-200"/>
                    <span className="w-3 h-3 rounded-full bg-slate-200"/>
                  </div>
                  <div
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200/60 shadow-xs">
              <span className="w-3 h-3 rounded-sm bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-[6px] font-black">G</span>
              </span>
                    <span className="text-[11px] text-slate-400 font-medium">globallearn.app / dashboard</span>
                  </div>
                </div>
                <div className="flex items-center bg-white p-1 rounded-xl border border-slate-100 shadow-xs gap-0.5">
                  {(['courses', 'track', 'stats'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                            className="relative px-3 py-1.5 text-[12px] rounded-lg cursor-pointer select-none">
                <span
                  className={`relative z-10 font-medium ${activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}>
                  {tab === 'courses' && 'Мои курсы'}
                  {tab === 'track' && 'Трек'}
                  {tab === 'stats' && 'Статистика'}
                </span>
                      {activeTab === tab && (
                        <motion.div layoutId="demoTab" className="absolute inset-0 bg-slate-100 rounded-lg z-0"
                                    transition={{type: 'spring', stiffness: 500, damping: 35}}/>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 min-h-[300px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {activeTab === 'courses' && (
                    <motion.div key="c" initial={{opacity: 0, y: 4}} animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -4}} transition={{duration: 0.16}}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 p-5 border border-blue-100 bg-blue-50/40 rounded-xl">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <p className="text-[11px] text-blue-600 font-semibold uppercase tracking-widest mb-1">В
                                процессе</p>
                              <h4 className="text-[15px] font-semibold text-slate-900 leading-snug">Корпоративные
                                стандарты и ценности</h4>
                            </div>
                            <span
                              className="text-[11px] text-slate-400 font-medium shrink-0 mt-0.5 bg-white px-2 py-1 rounded-lg border border-slate-100">Модуль 3 / 4</span>
                          </div>
                          <div className="w-full bg-blue-100 h-1.5 rounded-full mb-2">
                            <div className="bg-blue-600 h-full rounded-full w-[75%]"/>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[11px] text-slate-400">Прогресс</span>
                            <span className="text-[11px] font-bold text-blue-600">75%</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl bg-white">
                            <div
                              className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 text-slate-500"/>
                            </div>
                            <div>
                              <p className="text-[12px] font-medium text-slate-600 leading-snug">Инфобезопасность</p>
                              <p className="text-[10px] text-slate-300 mt-0.5">Завершён</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 border border-dashed border-slate-100 rounded-xl">
                            <div
                              className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                              <Play className="w-3 h-3 text-slate-300"/>
                            </div>
                            <div>
                              <p className="text-[12px] font-medium text-slate-300 leading-snug">Управление
                                проектами</p>
                              <p className="text-[10px] text-slate-200 mt-0.5">Не начат</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {activeTab === 'track' && (
                    <motion.div key="t" initial={{opacity: 0, y: 4}} animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -4}} transition={{duration: 0.16}}>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mb-1">Трек
                            обучения</p>
                          <h4 className="text-[16px] font-semibold text-slate-900">Развитие менеджера</h4>
                        </div>
                        <p className="text-[22px] font-bold text-slate-900 leading-none">2 <span
                          className="text-[14px] text-slate-300 font-normal">/ 4</span></p>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          {t: 'Введение в компанию', s: 'done'},
                          {t: 'Управление командой', s: 'done'},
                          {t: 'Аналитика и KPI', s: 'active'},
                          {t: 'Стратегическое мышление', s: 'locked'},
                        ].map((step, i) => (
                          <div key={i}
                               className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${step.s === 'active' ? 'border-blue-100 bg-blue-50/50' : step.s === 'done' ? 'border-slate-100 bg-white' : 'border-dashed border-slate-100'}`}>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 ${step.s === 'done' ? 'bg-slate-900 text-white border-slate-900' : step.s === 'active' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-300 border-slate-200'}`}>
                              {step.s === 'done' ? '✓' : i + 1}
                            </div>
                            <span
                              className={`text-[13.5px] flex-1 ${step.s === 'locked' ? 'text-slate-300' : step.s === 'active' ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{step.t}</span>
                            {step.s === 'active' && <span
                              className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">сейчас</span>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {activeTab === 'stats' && (
                    <motion.div key="s" initial={{opacity: 0, y: 4}} animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -4}} transition={{duration: 0.16}}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        {[
                          {l: 'Завершено', v: '12', sub: 'курсов'},
                          {l: 'Сертификатов', v: '12', sub: 'получено'},
                          {l: 'В процессе', v: '3', sub: 'курса'},
                          {l: 'Ср. прогресс', v: '87%', sub: 'по всем'},
                        ].map((s, i) => (
                          <div key={i} className="p-4 border border-slate-100 rounded-xl bg-white">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-2">{s.l}</p>
                            <p
                              className="text-[26px] font-extrabold text-slate-900 leading-none tracking-tight">{s.v}</p>
                            <p className="text-[11px] text-slate-300 mt-1">{s.sub}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-end gap-1.5 h-14 p-4 border border-slate-100 rounded-xl bg-white">
                        {[30, 50, 42, 68, 80, 92, 75, 100].map((v, i) => (
                          <div key={i} className="flex-1 bg-slate-100 rounded overflow-hidden h-full relative">
                            <div className="absolute bottom-0 inset-x-0 bg-blue-600/25 rounded"
                                 style={{height: `${v}%`}}/>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center justify-between pt-5 mt-6 border-t border-slate-50">
            <span className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
              Синхронизировано
            </span>
                  <Link to="/login"
                        className="flex items-center gap-1 text-[11.5px] font-medium text-slate-400 hover:text-blue-600 transition-colors">
                    Открыть в системе <ChevronRight className="w-3.5 h-3.5"/>
                  </Link>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 3 — FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="min-h-screen flex items-center border-t border-slate-200 px-8 py-24">
        <div className="max-w-6xl mx-auto w-full">
          <FadeUp className="mb-16">
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-widest mb-4">Возможности</p>
            <h2 className="font-extrabold text-slate-900 tracking-tight"
                style={{fontSize: 'clamp(32px, 3.5vw, 48px)', letterSpacing: '-0.035em'}}>
              Что умеет платформа
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                num: '01',
                title: 'Курсы',
                desc: 'Модули, уроки в Markdown, тесты с порогом прохождения. Автоматические сертификаты.'
              },
              {
                num: '02',
                title: 'Треки',
                desc: 'Упорядоченные программы развития. Каждый следующий курс — после завершения предыдущего.'
              },
              {
                num: '03',
                title: 'Онбординг',
                desc: 'Шаги адаптации: задачи, документы, встречи, курсы. Встроенный чат с куратором.'
              },
              {
                num: '04',
                title: 'Контроль',
                desc: 'Статистика по отделам и сотрудникам. Просмотр по курсу или по человеку.'
              },
            ].map((f, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div
                  className="p-8 border border-slate-200 rounded-2xl bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300 h-full">
                  <p className="text-[11px] font-bold text-slate-200 tracking-widest mb-5 uppercase">{f.num}</p>
                  <h4 className="text-[17px] font-semibold text-slate-900 mb-3">{f.title}</h4>
                  <p className="text-[13.5px] text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 4 — ROLES
      ══════════════════════════════════════ */}
      <section id="roles" className="min-h-screen flex items-center border-t border-slate-200 px-8 py-24">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <FadeUp className="lg:col-span-4">
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-widest mb-4">Роли и права</p>
            <h2 className="font-extrabold text-slate-900 tracking-tight leading-tight mb-5"
                style={{fontSize: 'clamp(32px, 3.5vw, 48px)', letterSpacing: '-0.035em'}}>
              Каждый видит только своё
            </h2>
            <p className="text-[16px] text-slate-400 leading-relaxed">
              Пять ролей с разграниченным доступом. От администратора до клиента — каждый работает в своей зоне.
            </p>
          </FadeUp>

          <div className="lg:col-span-8 divide-y divide-slate-100">
            {[
              {
                role: 'Администратор',
                desc: 'Полный доступ: курсы, клиенты, статистика, компания',
                badge: 'Полный доступ'
              },
              {
                role: 'Руководитель департамента',
                desc: 'Создаёт курсы, видит статистику своего департамента',
                badge: null
              },
              {role: 'Руководитель отдела', desc: 'Управляет обучением внутри своего отдела', badge: null},
              {role: 'Старший менеджер', desc: 'Назначает курсы, отслеживает прогресс подчинённых', badge: null},
              {role: 'Клиент', desc: 'Видит только клиентские курсы — по инвайту', badge: 'Внешний'},
            ].map((r, i) => (
              <FadeUp key={i} delay={i * 0.06}>
                <div className="flex items-center justify-between py-6 gap-8">
                  <div className="flex items-center gap-5">
                    <span
                      className="text-[13px] font-bold text-slate-200 tabular-nums w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-[15px] font-semibold text-slate-800">{r.role}</p>
                      <p className="text-[13px] text-slate-400 mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                  {r.badge && <span
                    className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">{r.badge}</span>}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 5 — FAQ
      ══════════════════════════════════════ */}
      <section id="faq" className="min-h-screen flex items-center border-t border-slate-200 px-8 py-24">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16">
          <FadeUp className="lg:col-span-4">
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-widest mb-4">FAQ</p>
            <h2 className="font-extrabold text-slate-900 tracking-tight"
                style={{fontSize: 'clamp(32px, 3.5vw, 48px)', letterSpacing: '-0.035em'}}>
              Частые вопросы
            </h2>
          </FadeUp>

          <div className="lg:col-span-8 divide-y divide-slate-100">
            {[
              {
                q: 'Как получить доступ?',
                a: 'Администратор создаёт аккаунт и отправляет данные на корпоративный email. Клиенты — по инвайт-ссылке от менеджера.'
              },
              {
                q: 'Как работают треки обучения?',
                a: 'Трек — последовательность курсов. Каждый следующий открывается только после завершения предыдущего. По завершении трека выдаётся диплом.'
              },
              {
                q: 'Как выдаются сертификаты и дипломы?',
                a: 'Автоматически при 100% прохождении курса. Диплом за трек — после всех курсов. Всё доступно в профиле.'
              },
              {
                q: 'Что видит руководитель в контроле?',
                a: 'Зависит от роли. Администратор — всех. Руководитель департамента — свой департамент. Руководитель отдела — свой отдел.'
              },
            ].map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <FadeUp key={i} delay={i * 0.07}>
                  <div>
                    <button onClick={() => setOpenFaq(isOpen ? null : i)}
                            className="w-full py-6 text-left flex items-start justify-between gap-8 cursor-pointer select-none group">
                      <span
                        className="text-[15.5px] font-medium text-slate-800 group-hover:text-slate-900 transition-colors leading-snug">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 mt-1 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}/>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-250 ${isOpen ? 'max-h-60 pb-6' : 'max-h-0'}`}>
                      <p className="text-[14.5px] text-slate-400 leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 6 — CTA (ХАОС)
      ══════════════════════════════════════ */}
      <section
        className="min-h-screen relative overflow-hidden bg-slate-950 subtle-dot-grid-dark flex items-center justify-center">

        {/* ── разбросанные элементы ── */}

        {/* Карточка курса — слева сверху */}
        <motion.div
          initial={{opacity: 0, x: -40, rotate: -10}}
          whileInView={{opacity: 1, x: 0, rotate: -8}}
          viewport={{once: false}}
          transition={{duration: 0.9, ease: [0.16, 1, 0.3, 1]}}
          className="absolute top-16 left-8 lg:left-20 w-56 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-blue-600/30 flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-blue-400"/>
            </div>
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">Курс</span>
          </div>
          <p className="text-[12px] font-semibold text-white/60 leading-snug mb-3">Корпоративные стандарты и
            ценности</p>
          <div className="w-full bg-white/10 h-1 rounded-full">
            <div className="bg-blue-500/60 h-full rounded-full w-[72%]"/>
          </div>
          <p className="text-[10px] text-white/30 mt-1.5 text-right">72%</p>
        </motion.div>

        {/* Сертификат — справа сверху */}
        <motion.div
          initial={{opacity: 0, x: 40, rotate: 8}}
          whileInView={{opacity: 1, x: 0, rotate: 6}}
          viewport={{once: false}}
          transition={{duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1]}}
          className="absolute top-20 right-8 lg:right-24 w-48 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-400/60"/>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">Сертификат</span>
          </div>
          <p className="text-[11px] text-white/50 leading-snug">Алексей Воронов</p>
          <p className="text-[10px] text-white/30 mt-0.5">успешно прошёл курс</p>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[9px] text-white/25">28.05.2026</span>
            <span className="text-[9px] font-bold text-blue-400/50">✓ Выдан</span>
          </div>
        </motion.div>

        {/* Статистика — слева снизу */}
        <motion.div
          initial={{opacity: 0, x: -40, rotate: 14}}
          whileInView={{opacity: 1, x: 0, rotate: 12}}
          viewport={{once: false}}
          transition={{duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1]}}
          className="absolute bottom-28 left-8 lg:left-16 w-44"
        >
          <div className="grid grid-cols-2 gap-2">
            {[
              {l: 'Курсов', v: '24'},
              {l: 'Команда', v: '48'},
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl border border-white/10 bg-white/5">
                <p className="text-[20px] font-extrabold text-white/50 leading-none">{s.v}</p>
                <p className="text-[9px] text-white/25 mt-1 uppercase tracking-wide">{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Шаг онбординга — справа снизу */}
        <motion.div
          initial={{opacity: 0, x: 40, rotate: -12}}
          whileInView={{opacity: 1, x: 0, rotate: -9}}
          viewport={{once: false}}
          transition={{duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1]}}
          className="absolute bottom-24 right-8 lg:right-20 w-52 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2.5">Онбординг · Шаг 2</p>
          {['Читать регламент', 'Встреча с ментором', 'Пройти тест'].map((t, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${i < 2 ? 'border-white/20 bg-white/10' : 'border-white/10'}`}>
                {i < 2 && <Check className="w-2 h-2 text-white/40"/>}
              </div>
              <span className={`text-[11px] ${i < 2 ? 'text-white/35 line-through' : 'text-white/55'}`}>{t}</span>
            </div>
          ))}
        </motion.div>

        {/* Мини-трек — сверху по центру, далеко */}
        <motion.div
          initial={{opacity: 0, y: -20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: false}}
          transition={{duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1]}}
          className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
        >
          {['Введение', 'Практика', 'Итог'].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium ${i === 0 ? 'border-blue-500/30 text-blue-400/60 bg-blue-500/10' : 'border-white/10 text-white/25'}`}>{s}</div>
              {i < 2 && <div className="w-4 h-px bg-white/10"/>}
            </div>
          ))}
        </motion.div>

        {/* ── основной CTA текст ── */}
        <FadeUp className="relative z-10 text-center px-8 max-w-3xl">
          <div className="flex flex-col items-center gap-6">

            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Готовы начать?
            </p>

            <h2 className="font-extrabold text-white text-[clamp(42px,5.5vw,68px)] leading-[1.1] tracking-[-0.04em]">
              Начните сегодня!
            </h2>

            <p className="text-[16px] text-slate-400 max-w-md mx-auto leading-relaxed">
              Войдите с корпоративным аккаунтом и откройте полный доступ.
            </p>

            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 !text-white font-semibold text-[15px] rounded-xl hover:bg-blue-500 transition-all duration-150 shadow-2xl shadow-blue-600/30"
              >
                Войти в систему <ArrowRight className="w-4 h-4"/>
              </Link>
            </div>

          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 subtle-dot-grid-dark border-t border-white/5">
        <div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-white"/>
            </div>
            <span className="text-[13px] font-semibold text-slate-400">Global Learn</span>
          </div>
          <div className="flex items-center gap-6 text-[12.5px] text-slate-600">
            <a href="#features" className="hover:text-slate-300 transition-colors">Возможности</a>
            <a href="#faq" className="hover:text-slate-300 transition-colors">FAQ</a>
            <Link to="/login" className="hover:text-slate-300 transition-colors">Войти</Link>
          </div>
          <span className="text-[11.5px] text-slate-700">© {new Date().getFullYear()} Global Learn</span>
        </div>
      </footer>

    </div>
  );
}
