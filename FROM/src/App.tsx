import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  Play, 
  Search, 
  Clock, 
  ChevronDown, 
  LogIn, 
  GraduationCap, 
  X, 
  Building2, 
  PhoneCall, 
  Menu, 
  Check,
  Shield,
  HelpCircle,
  Users,
  Award,
  BookOpen,
  TrendingUp,
  FileText,
  Terminal,
  Layers,
  Sparkles,
  MessageSquare
} from 'lucide-react';

// Shared Components
import OnboardingStepCard from './components/OnboardingStepCard';
import OnboardingTimeline from './components/OnboardingTimeline';
import ManagerChat from './components/ManagerChat';

// Types & Data
import { OnboardingTrack, ChatMessage } from './types';
import { onboardingTracks, getManagerStepResponse, getQuickQuestionResponse } from './data/onboardingData';
import { sound } from './utils/audio';

// Interfaces for original landing page compatibility
interface Course {
  id: string;
  title: string;
  category: 'all' | 'sales' | 'logistics' | 'tech' | 'soft';
  categoryLabel: string;
  duration: string;
  lessonsCount: number;
  rating: number;
  level: string;
  isRequired: boolean;
  label?: string;
  description: string;
}

interface Department {
  id: string;
  name: string;
  head: string;
  score: number;
  completedPercent: number;
  learningPath: string[];
  activeUsers: number;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function App() {
  // Mobile menu control
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dashboard Interactive Tab
  const [activePromoTab, setActivePromoTab] = useState<'progress' | 'departments' | 'statistics'>('progress');
  
  // Course Search & Filtering State
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sales' | 'logistics' | 'tech' | 'soft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Quiz State
  const [currentQuizStep, setCurrentQuizStep] = useState<'initial' | 'answered-correct' | 'answered-incorrect'>('initial');
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);

  // Department Matrix State
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('dept-1');

  // FAQ Accordion states
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  // --- CORE STATE FOR ONBOARDING WORKSPACE ---
  // Start on 'onboarding' for user testing experience, but let them toggle easily
  const [currentTab, setCurrentTab] = useState<'onboarding' | 'landing'>('onboarding');

  const [tracksState, setTracksState] = useState<OnboardingTrack[]>(() => {
    return JSON.parse(JSON.stringify(onboardingTracks));
  });

  const [selectedTrackId, setSelectedTrackId] = useState<string>('track-sales');

  const [activeStepIndices, setActiveStepIndices] = useState<Record<string, number>>({
    'track-sales': 0,
    'track-logistics': 0,
    'track-it': 0
  });

  const [messagesByTrack, setMessagesByTrack] = useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    onboardingTracks.forEach(t => {
      initial[t.id] = [
        {
          id: `welcome-${t.id}`,
          sender: 'manager',
          text: t.manager.introMessage,
          timestamp: '16:44'
        }
      ];
    });
    return initial;
  });

  const [typingByTrack, setTypingByTrack] = useState<Record<string, boolean>>({
    'track-sales': false,
    'track-logistics': false,
    'track-it': false
  });

  // --- HANDLERS FOR ONBOARDING WORKSPACE ---
  const handleToggleTask = (taskId: string) => {
    setTracksState(prev => prev.map(track => {
      if (track.id !== selectedTrackId) return track;
      return {
        ...track,
        steps: track.steps.map(step => {
          const hasTask = step.tasks.some(t => t.id === taskId);
          if (!hasTask) return step;
          return {
            ...step,
            tasks: step.tasks.map(task => {
              if (task.id !== taskId) return task;
              return { ...task, completed: !task.completed };
            })
          };
        })
      };
    }));
  };

  const handleSubmitReport = (reportText: string) => {
    const currentTrack = tracksState.find(t => t.id === selectedTrackId)!;
    const currentStepIndex = activeStepIndices[selectedTrackId];
    const currentStep = currentTrack.steps[currentStepIndex];

    const updatedTracks = tracksState.map(track => {
      if (track.id !== selectedTrackId) return track;
      return {
        ...track,
        steps: track.steps.map((step, idx) => {
          if (idx !== currentStepIndex) return step;
          return {
            ...step,
            isCompleted: true,
            userFeedback: reportText,
            completedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          };
        })
      };
    });

    setTracksState(updatedTracks);

    const allCompleted = currentStepIndex === currentTrack.steps.length - 1;
    if (allCompleted) {
      sound.playFinalSuccess();
    } else {
      sound.playStepSuccess();
    }

    const nowStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `report-msg-${Date.now()}`,
      sender: 'user',
      text: `📤 Отправил отчет по шагу "${currentStep.title}":\n\n"${reportText}"`,
      timestamp: nowStr
    };
    
    const sysMsg: ChatMessage = {
      id: `system-msg-${Date.now()}`,
      sender: 'system',
      text: `Система Джи Эм Трейд: Ваш отчет зарегистрирован в 1С кадрах и отправлен куратору на согласование.`,
      timestamp: nowStr
    };

    setMessagesByTrack(prev => ({
      ...prev,
      [selectedTrackId]: [...(prev[selectedTrackId] || []), userMsg, sysMsg]
    }));

    setTypingByTrack(prev => ({ ...prev, [selectedTrackId]: true }));

    setTimeout(() => {
      const respText = getManagerStepResponse(selectedTrackId, currentStepIndex, reportText);
      const managerMsg: ChatMessage = {
        id: `manager-resp-${Date.now()}`,
        sender: 'manager',
        text: respText,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      };

      setMessagesByTrack(prev => ({
        ...prev,
        [selectedTrackId]: [...(prev[selectedTrackId] || []), managerMsg]
      }));

      setTypingByTrack(prev => ({ ...prev, [selectedTrackId]: false }));

      // Advance to next step focus
      if (!allCompleted) {
        setActiveStepIndices(prev => ({
          ...prev,
          [selectedTrackId]: currentStepIndex + 1
        }));
      }
    }, 2000);
  };

  const handleUserSendMessage = (text: string) => {
    const nowStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: nowStr
    };

    setMessagesByTrack(prev => ({
      ...prev,
      [selectedTrackId]: [...(prev[selectedTrackId] || []), userMsg]
    }));

    setTypingByTrack(prev => ({ ...prev, [selectedTrackId]: true }));

    setTimeout(() => {
      let managerRespText = '';
      const lower = text.toLowerCase();
      
      if (lower.includes('привет') || lower.includes('здравствуй') || lower.includes('добрый день')) {
        managerRespText = `Привет! Мы очень рады видеть тебя в команде. Подскажи, есть ли какие-то сложности со сдачей текущего шага онбординга? Дай знать!`;
      } else if (lower.includes('ошибка') || lower.includes('не получается') || lower.includes('проблем')) {
        managerRespText = `Понял тебя. На каком этапе споткнулся? Попробуй перепроверить чек-лист шага, прочитать регламентный раздел. Если проблема техническая — напиши подробнее, я помогу исправить.`;
      } else if (lower.includes('созвон') || lower.includes('обсудит') || lower.includes('зум') || lower.includes('встреч')) {
        managerRespText = `Да, отличная мысль! Давай как только ты отправишь отчеты по текущему шагу, мы запланируем 15-минутный звонок в Zoom и пройдемся по твоим результатам. Хорошо?`;
      } else if (lower.includes('когда') || lower.includes('срок') || lower.includes('дедлайн')) {
        managerRespText = `Ориентировочный срок на освоение всего трека из 4 шагов — около недели. Торопиться не нужно, нам важно качество разбора каждой темы. Проходи в комфортном темпе!`;
      } else {
        const mgr = onboardingTracks.find(t => t.id === selectedTrackId)!.manager;
        managerRespText = `Спасибо за сообщение! Я ознакомился. Твоя вовлеченность в адаптацию очень важна для эффективности коммерческой и логистической деятельности Джи Эм Трейд. Постарайся завершить все чек-листы шага, и мы обсудим детали.`;
      }

      const managerMsg: ChatMessage = {
        id: `manager-resp-${Date.now()}`,
        sender: 'manager',
        text: managerRespText,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      };

      setMessagesByTrack(prev => ({
        ...prev,
        [selectedTrackId]: [...(prev[selectedTrackId] || []), managerMsg]
      }));

      setTypingByTrack(prev => ({ ...prev, [selectedTrackId]: false }));
    }, 1500);
  };

  const handleUserQuickQuestion = (question: string) => {
    const nowStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-msg-qq-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: nowStr
    };

    setMessagesByTrack(prev => ({
      ...prev,
      [selectedTrackId]: [...(prev[selectedTrackId] || []), userMsg]
    }));

    setTypingByTrack(prev => ({ ...prev, [selectedTrackId]: true }));

    setTimeout(() => {
      const respText = getQuickQuestionResponse(tracksState.find(t => t.id === selectedTrackId)!.manager.name, question);
      const managerMsg: ChatMessage = {
        id: `manager-resp-${Date.now()}`,
        sender: 'manager',
        text: respText,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      };

      setMessagesByTrack(prev => ({
        ...prev,
        [selectedTrackId]: [...(prev[selectedTrackId] || []), managerMsg]
      }));

      setTypingByTrack(prev => ({ ...prev, [selectedTrackId]: false }));
    }, 1200);
  };

  const activeTrack = tracksState.find(t => t.id === selectedTrackId)!;
  const activeStepIndex = activeStepIndices[selectedTrackId];
  const activeStep = activeTrack.steps[activeStepIndex];

  // --- COMPATIBILITY DATASET FOR ORIGINAL LANDING VIEW ---
  const departments: Department[] = [
    {
      id: 'dept-1',
      name: 'Коммерческий департамент',
      head: 'Алексей Воронов',
      score: 4.88,
      completedPercent: 92,
      learningPath: ['Переговоры B2B уровня Enterprise', 'Управление воронкой в CRM', 'Энергетический менеджмент в продажах'],
      activeUsers: 45
    },
    {
      id: 'dept-2',
      name: 'Логистика и внешнеэкономическая деятельность (ВЭД)',
      head: 'Елена Ковальчук',
      score: 4.75,
      completedPercent: 88,
      learningPath: ['Инкотермс 2020: практические кейсы', 'Таможенное декларирование', 'Оптимизация мультимодальных цепочек'],
      activeUsers: 34
    },
    {
      id: 'dept-3',
      name: 'IT-инфраструктура и разработка',
      head: 'Дмитрий Резник',
      score: 4.96,
      completedPercent: 95,
      learningPath: ['Корпоративная безопасность систем', 'Управление релизами и CI/CD', 'Архитектурные паттерны микросервисов'],
      activeUsers: 28
    },
    {
      id: 'dept-4',
      name: 'HR & Корпоративная культура',
      head: 'Мария Тарасова',
      score: 4.81,
      completedPercent: 91,
      learningPath: ['Адаптация (Onboarding) сотрудников', 'Культура обратной связи', 'Методы оценки эффективности'],
      activeUsers: 15
    },
  ];

  const courses: Course[] = [
    {
      id: 'course-1',
      title: 'Введение в стандарты ООО «Джи Эм Трейд»',
      category: 'soft',
      categoryLabel: 'Onboarding & Культура',
      duration: '4 часа',
      lessonsCount: 6,
      rating: 4.9,
      level: 'Обязательный',
      isRequired: true,
      label: 'Базовый',
      description: 'Изучение внутренних регламентов, структуры компании Джи Эм Трейд, её ключевых ценностей и стандартов конфиденциальности.'
    },
    {
      id: 'course-2',
      title: 'ВЭД и логистические хабы Евразии',
      category: 'logistics',
      categoryLabel: 'Логистика & ВЭД',
      duration: '18 часов',
      lessonsCount: 12,
      rating: 4.8,
      level: 'Продвинутый',
      isRequired: false,
      label: 'Поставки',
      description: 'Практические аспекты оптимизации цепочек поставок через таможенные союзы, включая разбор частых нештатных ситуаций.'
    },
    {
      id: 'course-3',
      title: 'Экспортная дипломатия: B2B сегмент',
      category: 'sales',
      categoryLabel: 'Коммерция',
      duration: '24 часа',
      lessonsCount: 16,
      rating: 4.9,
      level: 'Мастер',
      isRequired: true,
      label: 'Важный',
      description: 'Методики ведения жестких международных переговоров, особенности заключения контрактов с крупными зарубежными сетями.'
    },
    {
      id: 'course-4',
      title: 'Информационная защита корпоративных данных',
      category: 'tech',
      categoryLabel: 'IT & Безопасность',
      duration: '8 часов',
      lessonsCount: 8,
      rating: 4.95,
      level: 'Все уровни',
      isRequired: true,
      label: 'Безопасность',
      description: 'Правила работы со служебной информацией, распознавание продвинутого фишинга и защита персональных данных клиентов компании.'
    },
    {
      id: 'course-5',
      title: 'Архитектура Tableau: аналитика в реальном времени',
      category: 'tech',
      categoryLabel: 'Аналитика',
      duration: '32 часа',
      lessonsCount: 20,
      rating: 4.7,
      level: 'Профессионал',
      isRequired: false,
      label: 'Данные',
      description: 'Глубокое изучение сквозной аналитики и создания автоматических дашбордов для контроля KPI отделов в ООО «Джи Эм Трейд».'
    },
    {
      id: 'course-6',
      title: 'Управление стрессом в кросс-функциональных командах',
      category: 'soft',
      categoryLabel: 'Эффективность',
      duration: '12 часов',
      lessonsCount: 8,
      rating: 4.6,
      level: 'Базовый',
      isRequired: false,
      description: 'Повышение эмоционального интеллекта, предотвращение выгорания у руководителей и решение внутренних споров.'
    },
    {
      id: 'course-7',
      title: 'Инкотермс 2020: сложные кейсы поставок',
      category: 'logistics',
      categoryLabel: 'Логистика & ВЭД',
      duration: '14 часов',
      lessonsCount: 10,
      rating: 4.92,
      level: 'Продвинутый',
      isRequired: true,
      label: 'Регламент',
      description: 'Детальная проработка разделения рисков между продавцом и покупателем в условиях изменения евразийских маршрутов.'
    },
    {
      id: 'course-8',
      title: 'B2B маркетинг и позиционирование бренда',
      category: 'sales',
      categoryLabel: 'Коммерция & Продажи',
      duration: '20 часов',
      lessonsCount: 14,
      rating: 4.84,
      level: 'Мастер',
      isRequired: false,
      description: 'Разработка коммерческих предложений высокой конверсии для оптовых клиентов индустриального рынка.'
    }
  ];

  const faqItems: FAQItem[] = [
    {
      question: 'Как получить доступ к обучающим материалам?',
      answer: 'Каждому официально оформленному сотруднику ООО «Джи Эм Трейд» корпоративный аккаунт создаётся автоматически. Данные отправляются сотруднику на его рабочую почту в домене gmtrade.ru.'
    },
    {
      question: 'Можно ли проходить курсы на мобильных устройствах?',
      answer: 'Да, интерфейс разработан по стандартам адаптивности. Вы можете проходить лекции и тестирования с планшетов и смартфонов, прогресс синхронизируется в реальном времени.'
    },
    {
      question: 'Как учитываются результаты обучения при аттестации?',
      answer: 'Результаты прохождения обязательных регламентных курсов синхронизируются с кадровой системой. На основе этих баллов формируется квалификационный паспорт специалиста.'
    },
    {
      question: 'Куда обращаться при возникновении вопросов в процессе обучения?',
      answer: 'Служба технической и методологической поддержки работает в рабочие часы компании. Вы можете отправить запрос на email support@gmtrade.ru.'
    }
  ];

  const selectedDepartment = departments.find(d => d.id === selectedDepartmentId) || departments[0];

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleQuizAnswerSubmit = (optionId: string, isCorrect: boolean) => {
    setSelectedQuizOption(optionId);
    if (isCorrect) {
      setCurrentQuizStep('answered-correct');
    } else {
      setCurrentQuizStep('answered-incorrect');
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuizStep('initial');
    setSelectedQuizOption(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-600 selection:text-white antialiased overflow-x-hidden relative subtle-dot-grid">
      
      {/* PREMIUM WHITE LIGHT HEADER */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60 py-3.5 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <a href="#" className="flex items-center gap-2.5 shrink-0 group" id="brand-logo">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white transition-all shadow-sm">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[13px] font-bold tracking-tight text-slate-900 leading-tight">
                Global Learn
              </span>
              <span className="text-[8px] tracking-wider text-slate-500 font-bold uppercase leading-none mt-0.5">
                Портал Обучения Джи Эм Трейд
              </span>
            </div>
          </a>

          {/* Symmetrical & Clean Navigation Controls for Tab Switch */}
          <div className="hidden md:flex items-center gap-7 lg:gap-9" id="desktop-nav-links">
            <button
              onClick={() => { sound.playClick(); setCurrentTab('landing'); }}
              className={`text-[13px] font-semibold transition-all py-1 cursor-pointer outline-none relative select-none ${
                currentTab === 'landing' 
                  ? 'text-blue-600 font-extrabold border-b-2 border-blue-600 pb-1.5' 
                  : 'text-slate-650 hover:text-blue-650'
              }`}
            >
              Главный портал
            </button>
            <button
              onClick={() => { sound.playClick(); setCurrentTab('onboarding'); }}
              className={`text-[13px] font-semibold transition-all py-1 cursor-pointer outline-none flex items-center gap-1.5 relative select-none ${
                currentTab === 'onboarding' 
                  ? 'text-blue-600 font-extrabold border-b-2 border-blue-600 pb-1.5' 
                  : 'text-slate-650 hover:text-blue-650'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>Мой Онбординг (Рабочая среда)</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0">
            {currentTab === 'landing' ? (
              <button 
                onClick={() => { sound.playClick(); setCurrentTab('onboarding'); }}
                className="px-4 py-2 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Начать онбординг</span>
              </button>
            ) : (
              <button 
                onClick={() => { sound.playClick(); setCurrentTab('landing'); }}
                className="px-4 py-2 text-[12px] font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Выйти из среды</span>
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-1.5 text-slate-600 hover:text-blue-600 transition"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-[100%] left-0 right-0 z-50 bg-white border-b border-slate-200 p-6 flex flex-col gap-4 md:hidden shadow-lg"
            >
              <div className="flex flex-col gap-3.5 text-left">
                <button
                  onClick={() => { sound.playClick(); setCurrentTab('landing'); setMobileMenuOpen(false); }}
                  className={`py-2 text-[13px] font-bold border-b border-slate-100 text-left cursor-pointer ${currentTab === 'landing' ? 'text-blue-600' : 'text-slate-700'}`}
                >
                  Главный портал
                </button>
                <button
                  onClick={() => { sound.playClick(); setCurrentTab('onboarding'); setMobileMenuOpen(false); }}
                  className={`py-2 text-[13px] font-bold border-b border-slate-100 text-left flex items-center gap-2 cursor-pointer ${currentTab === 'onboarding' ? 'text-blue-600' : 'text-slate-700'}`}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Мой онбординг (Рабочая среда)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: INTERACTIVE STEP-BY-STEP ONBOARDING WORKSPACE */}
        {currentTab === 'onboarding' && (
          <motion.div
            key="onboarding-viewport"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left"
          >
            {/* Premium Workspace Header Dashboard */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs relative overflow-hidden">
              {/* Radial gradient background highlights */}
              <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-4 max-w-2xl text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-850 border border-blue-100 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                    Рабочая среда стажёра Джи Эм Трейд
                  </span>
                  
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200/60 px-3 py-1 rounded-full text-[11px] font-bold">
                    ID: {activeTrack.id === 'track-sales' ? 'GMT-7392-SALES' : 'GMT-4820-SYS'}
                  </span>
                </div>

                <div className="space-y-2">
                  <h1 className="tracking-tight font-extrabold text-slate-900 text-2xl sm:text-3xl lg:text-[28px] leading-tight">
                    Индивидуальная программа адаптации
                  </h1>
                  <p className="text-slate-500 text-[13px] leading-relaxed">
                    Онбординг назначается сотруднику <span className="font-semibold text-slate-700">единожды после регистрации</span> для глубокого погружения в бизнес-процессы компании. Прохождение всех шагов обязательно для активации рабочего аккаунта.
                  </p>
                </div>

                {/* Symmetrical Mini KPIs */}
                <div className="pt-2 flex flex-wrap items-center gap-6 text-[12px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-450 font-medium">Ваш департамент:</span>
                    <span className="font-extrabold text-slate-800">{activeTrack.title}</span>
                  </div>
                  <div className="w-[1px] h-3.5 bg-slate-200 hidden sm:block" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-450 font-medium">Тип программы:</span>
                    <span className="font-extrabold text-blue-600">Обязательный регламент</span>
                  </div>
                </div>
              </div>

              {/* High-Craft Curator Widget (Combats bad UX of squeezing onto side column) */}
              <div className="flex items-center gap-4 bg-slate-50/80 border border-slate-200/80 p-4.5 rounded-2xl min-w-[310px] shadow-2xs hover:border-slate-350 hover:shadow-xs transition-all text-left relative group shrink-0">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-[15px] font-extrabold shadow-sm shrink-0 transition-transform group-hover:scale-105 duration-300"
                  style={{ background: activeTrack.manager.avatarGradient }}
                >
                  {activeTrack.manager.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider">
                    Закрепленный куратор
                  </span>
                  <h4 className="font-bold text-[14px] text-slate-800 leading-tight">
                    {activeTrack.manager.name}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-semibold leading-tight">
                    {activeTrack.manager.role}
                  </p>
                </div>

                {/* Return to Portal shortcut link */}
                <button
                  onClick={() => { sound.playClick(); setCurrentTab('landing'); }}
                  className="absolute -top-3.5 right-4 px-2.5 py-1 bg-white border border-slate-250 hover:border-slate-350 text-[10px] font-bold text-slate-650 rounded-lg hover:text-slate-850 cursor-pointer select-none transition shadow-2xs flex items-center gap-0.5"
                  title="Вернуться на главный образовательный портал"
                >
                  <span>На главную</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Tri-pane / Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (3 spans): Navigation timeline & Completed steps history */}
              <div className="lg:col-span-3 space-y-6">
                <OnboardingTimeline 
                  steps={activeTrack.steps}
                  activeStepIndex={activeStepIndex}
                  onStepClick={(index) => {
                    setActiveStepIndices(prev => ({
                      ...prev,
                      [selectedTrackId]: index
                    }));
                  }}
                />

                {/* Historical steps completed overview */}
                <div className="space-y-3.5 text-left bg-white border border-slate-250 p-5 rounded-2xl shadow-xs">
                  <h4 className="text-[12px] uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
                    История аттестации
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {activeTrack.steps.map((step, idx) => {
                      if (!step.isCompleted) return null;
                      return (
                        <div 
                          key={step.id}
                          className="p-3 bg-slate-50/50 border border-slate-200/80 rounded-xl flex items-center justify-between text-[11.5px] shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 font-extrabold flex items-center justify-center shrink-0 border border-emerald-100 text-[10.5px]">
                              {idx + 1}
                            </span>
                            <span className="text-slate-800 font-semibold truncate">{step.title}</span>
                          </div>
                          <span className="text-[9.5px] bg-emerald-100/85 text-emerald-700 font-bold px-2 py-0.5 rounded-md shrink-0">Одобрено</span>
                        </div>
                      );
                    })}
                    {activeTrack.steps.filter(s => s.isCompleted).length === 0 && (
                      <div className="p-4 bg-slate-50/40 border border-dashed border-slate-200/80 rounded-xl text-center text-slate-400 text-[11.5px] font-medium italic">
                        Вы пока не завершили ни одного шага в этом треке. Начните с первого чек-листа программы выше!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Column (5 spans): Workspace card */}
              <div className="lg:col-span-5 space-y-6">
                <OnboardingStepCard 
                  step={activeStep}
                  stepIndex={activeStepIndex}
                  totalSteps={activeTrack.steps.length}
                  isLocked={activeStepIndex > 0 && !activeTrack.steps[activeStepIndex - 1].isCompleted}
                  onToggleTask={handleToggleTask}
                  onSubmitReport={handleSubmitReport}
                />
              </div>

              {/* Right Column (4 spans): Chat Panel */}
              <div className="lg:col-span-4 sticky top-24">
                <ManagerChat 
                  manager={activeTrack.manager}
                  messages={messagesByTrack[selectedTrackId] || []}
                  isTyping={typingByTrack[selectedTrackId] || false}
                  onSendMessage={handleUserSendMessage}
                  onQuickQuestion={handleUserQuickQuestion}
                />
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW 2: ORIGINAL COMPATIBILITY LANDING PAGE */}
        {currentTab === 'landing' && (
          <motion.div
            key="landing-viewport"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            
            {/* TRAINEE FLOATING PROMOTION BANNER */}
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-600 border border-blue-700/30 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 animate-pulse text-white">
                    <Sparkles className="w-5 h-5 font-bold text-blue-200" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-extrabold tracking-tight">Вам назначен онбординг-трек!</h4>
                    <p className="text-[12px] text-white/80 leading-relaxed mt-0.5">
                      Куратор <strong>Алексей Воронов</strong> ожидает ваших отчетов по шагам в рабочем кабинете адаптации.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => { sound.playClick(); setCurrentTab('onboarding'); }}
                  className="px-5 py-2.5 bg-white text-blue-700 hover:bg-slate-50 font-bold text-[12px] rounded-xl flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  <span>Начать прохождение шагов</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </motion.div>
            </div>

            <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-24">

              {/* HERO SECTION */}
              <section id="home" className="pt-4 pb-8 relative">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center text-left">
                  
                  {/* Left Narrative Column */}
                  <div className="lg:col-span-6 flex flex-col justify-between py-1">
                    <div>
                      <div className="mb-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span className="text-[10.5px] uppercase tracking-wider font-bold">
                          Образовательный портал компании
                        </span>
                      </div>

                      <h1 className="tracking-tight font-extrabold text-slate-900 text-3xl sm:text-4xl lg:text-[40px] leading-[1.15] mb-6">
                        Профессиональное развитие сотрудников «Джи Эм Трейд»
                      </h1>

                      <p className="text-slate-650 text-[14.5px] sm:text-[15.5px] leading-relaxed mb-8 max-w-xl">
                        Единая корпоративная образовательная среда ООО «Джи Эм Трейд». Развивайте специализированные компетенции в международной логистике, комплаенс-контроле ВЭД, B2B переговорах и аналитике Tableau.
                      </p>

                      <div className="flex flex-wrap gap-3.5">
                        <a 
                          href="#courses-section"
                          className="px-6 py-3 bg-blue-600 text-white font-semibold text-[13px] rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <span>Перейти к каталогу</span>
                          <ArrowRight className="w-4 h-4" />
                        </a>

                        <button 
                          onClick={() => { sound.playClick(); setCurrentTab('onboarding'); }}
                          className="px-6 py-3 bg-white text-slate-700 font-semibold text-[13px] rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        >
                          <span>Мой Онбординг Dashboard</span>
                        </button>
                      </div>
                    </div>

                    {/* Symmetrical & Structured Metrics */}
                    <div className="mt-12 pt-8 border-t border-slate-200 w-full grid grid-cols-3 gap-6">
                      {[
                        { value: '8 программ', meta: 'Отраслевые треки' },
                        { value: 'Автоматика', meta: 'Синхронизация по API' },
                        { value: '92%', meta: 'Успешное сдачу квалификаций' }
                      ].map((stat, idx) => (
                        <div key={idx} className="flex flex-col">
                          <span className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">{stat.value}</span>
                          <span className="text-[11.5px] text-slate-500 mt-1.5 font-medium leading-tight">{stat.meta}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Interactive Cabinet Card (Demo interface) */}
                  <div className="lg:col-span-6 w-full" id="hero-interactive-dashboard">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-left">
                      
                      {/* Header Container */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 block"></span>
                          <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Кабинет сотрудника (демо)</span>
                        </div>
                        
                        {/* Premium Navigation Switcher */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                          {(['progress', 'departments', 'statistics'] as const).map((tab) => {
                            const isActive = activePromoTab === tab;
                            return (
                              <button
                                key={tab}
                                onClick={() => setActivePromoTab(tab)}
                                className="relative px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer select-none"
                              >
                                <span className={`relative z-10 ${isActive ? 'text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
                                  {tab === 'progress' && 'Мой статус'}
                                  {tab === 'departments' && 'Кабинет'}
                                  {tab === 'statistics' && 'Активность'}
                                </span>
                                {isActive && (
                                  <motion.div
                                    layoutId="activeHeroTab"
                                    className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/40 z-0"
                                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Secure Height Body Frame */}
                      <div className="p-6 h-[290px] flex flex-col justify-between overflow-y-auto bg-white">
                        
                        <AnimatePresence mode="wait">
                          {activePromoTab === 'progress' && (
                            <motion.div 
                              key="progress"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="space-y-4"
                            >
                              <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/20 border border-blue-100/70 rounded-xl">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <span className="text-[9.5px] tracking-wide text-blue-600 uppercase font-bold">Обучение на согласовании</span>
                                    <h4 className="text-[13px] font-bold text-slate-800 mt-0.5 leading-snug">Логистические коридоры и таможенное право ЕАЭС</h4>
                                  </div>
                                  <span className="text-[10px] bg-blue-100/80 text-blue-700 px-2.5 py-0.5 rounded-lg font-bold shrink-0">
                                    Модуль 3 из 4
                                  </span>
                                </div>
                                
                                <div className="mt-4">
                                  <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
                                    <span>Прогресс прохождения требований</span>
                                    <span className="text-blue-600 font-bold">75%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full rounded-full w-[75%]" />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[12px]">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-slate-700 text-[12px]">Тема 1. География транспортных хабов РФ</span>
                                  </div>
                                  <span className="text-[11px] text-slate-444 font-medium">Сдано</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[12px] hover:border-slate-300 transition-all cursor-pointer group">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4.5 h-4.5 rounded-full border border-slate-300 bg-white flex items-center justify-center shrink-0 group-hover:border-blue-500" />
                                    <span className="text-[12px] text-slate-700 font-medium group-hover:text-blue-600 transition-colors">Тема 2. Классификация Инкотермс 2020</span>
                                  </div>
                                  <Play className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {activePromoTab === 'departments' && (
                            <motion.div 
                              key="departments"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="space-y-3"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Структура академических кафедр</span>
                                <span className="text-[11.5px] font-semibold text-blue-600">4 службы</span>
                              </div>

                              <div className="space-y-2">
                                {[
                                  { pos: '1', name: 'IT-инфраструктура и разработка', score: '4.96 / 5.0', percent: '95%' },
                                  { pos: '2', name: 'Коммерческий департамент', score: '4.88 / 5.0', percent: '92%' },
                                  { pos: '3', name: 'Логистика и ВЭД право', score: '4.75 / 5.0', percent: '88%' }
                                ].map((lead, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-slate-450 w-4 h-4 text-center">{lead.pos}.</span>
                                      <span className="text-[12px] font-medium text-slate-750 truncate max-w-[210px]">{lead.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="text-[12px] text-slate-800 font-semibold">{lead.score}</span>
                                      <span className="text-[11.5px] text-emerald-600 font-bold">{lead.percent}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {activePromoTab === 'statistics' && (
                            <motion.div 
                              key="statistics"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="space-y-3.5"
                            >
                              <div className="flex justify-between items-center pb-1">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Общая активность холдинга</span>
                                <span className="text-[11px] text-slate-400">Текущий квартал</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3.5">
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                  <span className="text-[9.5px] text-slate-450 uppercase font-bold block">Суммарно пройдено</span>
                                  <p className="text-[16px] font-extrabold text-slate-850 mt-1">1,824 часов</p>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                  <span className="text-[9.5px] text-slate-450 uppercase font-bold block">Средний балл отделов</span>
                                  <p className="text-[16px] font-extrabold text-slate-850 mt-1">4.85 / 5.0</p>
                                </div>
                              </div>

                              {/* Symmetrical bar blocks */}
                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-end justify-between h-14 pt-2 gap-2 select-none">
                                {[45, 65, 52, 70, 85, 95, 76, 100].map((val, i) => (
                                  <div key={i} className="flex-1 bg-slate-200/50 h-full rounded relative group cursor-pointer">
                                    <div 
                                      style={{ height: `${val}%` }}
                                      className="absolute inset-x-0 bottom-0 bg-blue-600 rounded-xs transition-all group-hover:bg-blue-500" 
                                    />
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Stable Bottom Bar sync detail */}
                        <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between text-[11.5px] text-slate-500 select-none shrink-0" id="sb-sync-line">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                            Автоматическая выгрузка в 1С:ЗУП
                          </span>
                          <a href="#courses-section" className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-0.5">
                            <span>Спецификации</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* ACADEMY REGULATIONS */}
              <section id="academy-standards" className="pt-2 text-left relative focus:outline-none scroll-mt-20">
                <div className="border-b border-slate-200 pb-5 mb-8">
                  <span className="text-[10px] uppercase text-blue-600 font-bold tracking-wider">Органы контроля квалификаций</span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">Регламенты и стандарты процесса обучения</h2>
                  <p className="text-slate-500 mt-2 text-[13.5px] leading-relaxed max-w-2xl">
                    Свод правил, фиксирующих порядок прохождения аттестации и критерии верификации знаний сотрудников ООО «Джи Эм Трейд».
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Верификация квалификаций', desc: 'Автоматизированная регулярная выгрузка сводных отчетов по пройденным программам во внутренний контур 1С:ЗУП.' },
                    { title: 'Комплаенс-контроль', desc: 'Обязательное ознакомление каждого нового сотрудника со стандартами внутренней политики информационной безопасности.' },
                    { title: 'Специфика ВЭД и логистики', desc: 'Практические кейсы по разделению рисков Инкотермс 2020 на реальных транспортных потоках компании.' },
                    { title: 'Координация кураторами', desc: 'Методологическое курирование спорных результатов тестирования и регулярная обратная связь руководителей.' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white border border-slate-200/80 p-5 rounded-xl flex flex-col justify-between transition-all hover:border-slate-350 min-h-[160px] shadow-xs">
                      <div className="space-y-2.5">
                        <span className="text-[8.5px] text-blue-700 uppercase font-black tracking-widest bg-blue-50 px-2 py-0.5 rounded">Внутренний стандарт</span>
                        <h4 className="text-[13.5px] font-bold text-slate-900 leading-snug pt-1">{item.title}</h4>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-normal">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* INTERACTIVE QUIZ SECTION / PRACTICUM */}
              <section className="py-2 text-left">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  
                  <div className="lg:col-span-5 space-y-4 lg:py-6">
                    <span className="text-[10px] tracking-wide uppercase text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded-lg inline-block">
                      Интерактивный практикум
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      Оцените уровень контроля на примере простого теста
                    </h2>
                    <p className="text-slate-555 text-[13.5px] leading-relaxed">
                      Почувствуйте механику проверки знаний корпоративной LMS-платформы на базе реального методического задания для сотрудников коммерческой службы.
                    </p>
                    
                    <div className="pt-4 space-y-2.5 text-[12px] text-slate-500 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Мгновенный аргументированный разбор вариантов</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Формирование персонального квалификационного KPI</span>
                      </div>
                    </div>
                  </div>

                  {/* Quiz card wrapper */}
                  <div className="lg:col-span-7 bg-white border border-slate-250/70 rounded-xl p-6 sm:p-8 shadow-sm">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5 gap-4">
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 font-black block tracking-wider">Учебный практикум</span>
                        <h4 className="text-[12.5px] font-bold text-slate-800 uppercase tracking-tight mt-0.5">Кейс: Коридоры поставок ЕАЭС</h4>
                      </div>
                      <div className="text-[10.5px] text-blue-700 bg-blue-50 px-3 py-1 rounded-lg font-bold min-w-[110px] text-center shrink-0">
                        Аттестационный тест
                      </div>
                    </div>

                    {/* Secure Height Frame */}
                    <div className="min-h-[290px] flex flex-col justify-between">
                      <AnimatePresence mode="wait">
                        {currentQuizStep === 'initial' && (
                          <motion.div 
                            key="initial"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                          >
                            <p className="text-[13.5px] sm:text-[14px] font-semibold leading-relaxed text-slate-800">
                              Какова основная цель оптимизации сквозных коммерческих регламентов логистики в ООО «Джи Эм Трейд»?
                            </p>

                            <div className="space-y-2">
                              {[
                                { 
                                  id: 'A', 
                                  text: 'Системное снижение издержек Евразийского коридора на 14% при безукоризненной верификации регламента ВЭД', 
                                  correct: true 
                                },
                                { 
                                  id: 'B', 
                                  text: 'Номинальное заполнение карточек поставок для прохождения формальных проверок системы', 
                                  correct: false 
                                },
                                { 
                                  id: 'C', 
                                  text: 'Приостановка работы операторами союза ровно по расписанию без анализа фактической оборачиваемости', 
                                  correct: false 
                                }
                              ].map((opt, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleQuizAnswerSubmit(opt.id, opt.correct)}
                                  className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-[12px] sm:text-[12.5px] text-slate-700 hover:text-slate-950 transition duration-150 focus:outline-none flex items-start gap-3 cursor-pointer group select-none"
                                >
                                  <span className="w-5.5 h-5.5 rounded-md bg-white text-[10.5px] font-bold flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white border border-slate-200 shrink-0 transition-colors">
                                    {opt.id}
                                  </span>
                                  <span className="leading-snug">{opt.text}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {currentQuizStep === 'answered-correct' && (
                          <motion.div 
                            key="correct"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4 text-center py-6 flex flex-col justify-center items-center h-full my-auto"
                          >
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mb-1">
                              <Check className="w-5 h-5 font-bold" />
                            </div>
                            <h4 className="text-[14px] font-bold text-slate-900">Вы выбрали абсолютно верный ответ!</h4>
                            <p className="text-[12px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                              Снижение временных и логистических издержек напрямую увеличивает оборачиваемость капитала. Строгое соответствие таможенному законодательству исключает регуляторные риски холдинга.
                            </p>
                            <div className="pt-2">
                              <button
                                onClick={handleResetQuiz}
                                className="px-4 py-2 bg-slate-900 text-white font-semibold text-[11px] rounded-lg hover:bg-slate-800 transition cursor-pointer font-bold"
                              >
                                Пройти тест повторно
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {currentQuizStep === 'answered-incorrect' && (
                          <motion.div 
                            key="incorrect"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4 text-center py-6 flex flex-col justify-center items-center h-full my-auto"
                          >
                            <div className="w-10 h-10 bg-rose-50 text-rose-700 border border-rose-200 rounded-full flex items-center justify-center mb-1">
                              <X className="w-5 h-5" />
                            </div>
                            <h4 className="text-[14px] font-bold text-slate-900">Неверное направление</h4>
                            <p className="text-[12px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                              Формальное выполнение процессов не даёт превосходства перед ключевыми скоростными и финансовыми параметрами поставок в ООО «Джи Эм Трейд».
                            </p>
                            <div className="pt-2">
                              <button
                                onClick={handleResetQuiz}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold text-[11px] rounded-lg hover:bg-blue-700 transition cursor-pointer font-bold"
                              >
                                Попробовать ещё раз
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-[10.5px] text-slate-450 font-semibold select-none">
                        <span>Материалы сертифицированы кураторами</span>
                        <span>Раздел комплаенс-логистики</span>
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* COURSES CATALOGUE */}
              <section className="py-2 scroll-mt-20 text-left" id="courses-section">
                
                <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-200 pb-6 mb-8 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Корпоративный каталог учебных треков</span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Каталог учебных программ</h2>
                    <p className="text-slate-500 text-[13px] leading-relaxed max-w-xl">
                      Специализированные учебные курсы. Пройдите вводный ознакомительный онбординг или выберите элективную квалификационную специализацию.
                    </p>
                  </div>

                  {/* Symmetrical Search Tool */}
                  <div className="relative w-full lg:w-[350px]">
                    <input
                      type="text"
                      placeholder="Поиск по названию или описанию..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2.5 pl-10 bg-white border border-slate-250 focus:border-blue-500 rounded-xl text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none transition shadow-xs"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-3 text-[9px] text-blue-600 hover:text-blue-700 font-bold tracking-widest cursor-pointer"
                      >
                        ОЧИСТИТЬ
                      </button>
                    )}
                  </div>
                </div>

                {/* Clean Light Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {[
                    { id: 'all', title: 'Все программы' },
                    { id: 'soft', title: 'Onboarding и культура' },
                    { id: 'logistics', title: 'Логистика и ВЭД-контроль' },
                    { id: 'sales', title: 'B2B переговоры и продажи' },
                    { id: 'tech', title: 'ИТ-системы и аналитика Tableau' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border select-none ${
                        selectedCategory === cat.id 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-350'
                      }`}
                    >
                      {cat.title}
                    </button>
                  ))}
                </div>

                {/* Course Grid */}
                {filteredCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                      <div 
                        key={course.id} 
                        className="bg-white border border-slate-200 hover:border-slate-350 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-150 shadow-xs relative h-full"
                      >
                        <div className="p-5 flex flex-col justify-between flex-grow gap-4">
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center bg-slate-50 p-1.5 px-2.5 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-blue-750 font-extrabold uppercase tracking-widest">
                                {course.categoryLabel}
                              </span>
                              <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{course.duration}</span>
                              </div>
                            </div>

                            <h4 className="text-[14px] font-bold text-slate-950 leading-snug line-clamp-2 min-h-[40px]">
                              {course.title}
                            </h4>

                            <p className="text-[12px] text-slate-500 leading-relaxed font-normal line-clamp-3 min-h-[54px]">
                              {course.description}
                            </p>
                          </div>

                          {/* Metadata indicators */}
                          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px]">
                            <div>
                              <span className="text-[8px] text-slate-400 block uppercase font-bold">Сложность</span>
                              <span className="font-semibold text-slate-700">{course.level}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 block uppercase font-bold">Объем курса</span>
                              <span className="font-semibold text-slate-700">{course.lessonsCount} разделов</span>
                            </div>
                          </div>
                        </div>

                        {/* Card footer */}
                        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-[11.5px]">
                          <div className="flex items-center gap-1 font-semibold text-slate-600">
                            <span className="text-amber-500 font-bold text-[12px]">★</span>
                            <span>{course.rating}</span>
                          </div>

                          <button 
                            onClick={() => { sound.playClick(); setCurrentTab('onboarding'); }}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-semibold border border-blue-100 transition flex items-center gap-0.5 cursor-pointer select-none"
                          >
                            <span>Перейти в workspace</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Required tag badge */}
                        {course.isRequired && (
                          <div className="absolute top-3 right-3 select-none">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 text-[8px] font-extrabold uppercase tracking-wide rounded">
                              Обязательный
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-500 font-semibold text-[13px]">Курсы по заданным критериям фильтрации не найдены.</p>
                    <button 
                      onClick={() => { sound.playClick(); setSelectedCategory('all'); setSearchQuery(''); }}
                      className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11.5px] font-bold hover:bg-blue-600 hover:text-white transition cursor-pointer select-none"
                    >
                      Очистить фильтры
                    </button>
                  </div>
                )}

              </section>

              {/* ORGANIZATIONAL DEPARTMENT MATRIX */}
              <section className="py-2 scroll-mt-20 text-left" id="departments-section">
                
                <div className="border-b border-slate-200 pb-5 mb-10">
                  <span className="text-[10px] uppercase text-slate-450 font-bold tracking-wider">Организационный профиль холдинга</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-955 tracking-tight">Кафедры корпоративного роста</h2>
                  <p className="text-slate-500 mt-2 text-[13.5px] leading-relaxed max-w-2xl">
                    Индивидуальные образовательные требования и квалификационные нормативы специализированных сервисных служб ООО «Джи Эм Трейд».
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* List Selector buttons on Left Column */}
                  <div className="lg:col-span-5 space-y-2.5">
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => setSelectedDepartmentId(dept.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                          selectedDepartmentId === dept.id
                            ? 'bg-white border-blue-600 shadow-xs'
                            : 'bg-white/50 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <div className="flex gap-3.5 items-center">
                          <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center border transition-colors ${
                            selectedDepartmentId === dept.id 
                              ? 'bg-blue-50 border-blue-100 text-blue-700' 
                              : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:text-slate-600'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">Группа службы</span>
                            <h4 className={`text-[12.5px] font-bold transition leading-snug ${
                              selectedDepartmentId === dept.id ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'
                            }`}>
                              {dept.name}
                            </h4>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          selectedDepartmentId === dept.id ? 'text-blue-600 translate-x-1' : 'text-slate-400 font-bold'
                        }`} />
                      </button>
                    ))}
                  </div>

                  {/* Path details visual card on Right */}
                  <div className="lg:col-span-12 xl:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-left relative overflow-hidden flex flex-col justify-between min-h-[385px] shadow-xs">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
                        <div>
                          <span className="text-[8.5px] text-slate-400 uppercase font-black tracking-wider">Кафедральная программа и спецификация</span>
                          <h3 className="text-[15px] font-bold text-slate-900 mt-0.5 leading-snug">{selectedDepartment.name}</h3>
                        </div>
                        <div className="flex gap-2 self-start sm:self-auto select-none">
                          <div className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-center min-w-[70px]">
                            <span className="text-[7.5px] text-slate-400 block font-bold uppercase tracking-wide">Общий балл</span>
                            <span className="text-[12.5px] font-bold text-blue-600">{selectedDepartment.score}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-center min-w-[70px]">
                            <span className="text-[7.5px] text-slate-400 block font-bold uppercase tracking-wide">Прогресс</span>
                            <span className="text-[12.5px] font-bold text-emerald-600">{selectedDepartment.completedPercent}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4 text-[11.5px] border-b border-slate-100 pb-4">
                          <div>
                            <span className="text-slate-400 block font-semibold leading-relaxed">Штат на обучении</span>
                            <p className="font-bold text-slate-800 mt-0.5">{selectedDepartment.activeUsers} коллег</p>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold leading-relaxed">Ответственный куратор</span>
                            <p className="font-bold text-slate-800 mt-0.5">{selectedDepartment.head}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[9px] text-slate-400 block mb-2 font-black uppercase tracking-wider">Регламентная последовательность разделов</span>
                          {selectedDepartment.learningPath.map((pathItem, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-150 rounded-lg text-[12px] shadow-2xs">
                              <div className="w-5.2 h-5.2 rounded bg-white flex items-center justify-center text-[10.5px] font-bold text-slate-600 border border-slate-200 shrink-0 select-none">
                                {idx + 1}
                              </div>
                              <span className="text-slate-800 font-medium truncate pr-4">{pathItem}</span>
                              <div className="ml-auto flex items-center gap-1 text-[9px] text-emerald-600 font-bold uppercase shrink-0 select-none">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Раздел {idx + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>

                    {/* Bottom static action wrapper */}
                    <div className="pt-5 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <span className="text-[10px] text-slate-400 font-medium">Безопасность данных: корпоративный контур</span>
                      <button 
                        onClick={() => { sound.playClick(); setCurrentTab('onboarding'); }}
                        className="px-4 py-2 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white rounded-lg text-[11.5px] font-bold hover:shadow-xs transition-all text-center w-full sm:w-auto cursor-pointer"
                      >
                        Зайти в Кабинет Онбординга
                      </button>
                    </div>

                  </div>

                </div>

              </section>

              {/* SUPPORT / FAQ SECTION */}
              <section id="support-section" className="py-2 scroll-mt-20 text-left">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
                  
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] uppercase text-slate-450 font-bold tracking-wider">Справочная служба образования</span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                      Частые вопросы и поддержка
                    </h3>
                    <p className="text-slate-555 text-[13.5px] leading-relaxed max-w-sm">
                      Ответы на организационные и методологические вопросы сотрудников. При необходимости отправьте обращение техническому координатору.
                    </p>

                    <div className="space-y-4 pt-6 border-t border-slate-200 max-w-sm text-[12px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-slate-550" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900">Рассмотрение обращений</h5>
                          <p className="text-slate-450 text-[11px] mt-0.5 font-medium">Регламентный лимит: до 15 минут в р.ч.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <PhoneCall className="w-4 h-4 text-slate-550" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900">Служба координации ВЭД</h5>
                          <p className="text-slate-450 text-[11px] mt-0.5 font-medium">support@gmtrade.ru • Вн. тел. 1404</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accordions */}
                  <div className="lg:col-span-7 space-y-2.5">
                    {faqItems.map((item, index) => {
                      const isOpen = openFAQIndex === index;
                      return (
                        <div 
                          key={index} 
                          className="bg-white border border-slate-200 hover:border-slate-350 rounded-xl overflow-hidden transition-all shadow-2xs"
                        >
                          <button
                            onClick={() => toggleFAQ(index)}
                            className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-slate-800 text-[13.5px] hover:bg-slate-50/50 transition focus:outline-none select-none"
                          >
                            <span className="leading-snug">{item.question}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'transform rotate-180 text-blue-600' : ''}`} />
                          </button>
                          
                          <div 
                            className={`transition-all duration-200 ease-in-out overflow-hidden ${
                              isOpen ? 'max-h-[220px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="px-5 py-4 text-[12.5px] text-slate-500 leading-relaxed bg-slate-50/10">
                              {item.answer}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

              </section>

              {/* INDIVIDUAL STAFF LOGIN */}
              <section id="login-section" className="py-2 scroll-mt-20 text-left">
                
                <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3.5px] bg-blue-600" />

                  <div className="text-center mb-6">
                    <h3 className="text-[15.5px] font-bold text-slate-900">Индивидуальный вход</h3>
                    <p className="text-[11.5px] text-slate-450 mt-1.5 leading-relaxed font-semibold">
                      Используйте рабочую учетную запись в домене gmtrade.ru для верификации пройденных регламентов.
                    </p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); sound.playClick(); setCurrentTab('onboarding'); }} className="space-y-4">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Рабочий e-mail</label>
                      <input
                        type="email"
                        required
                        placeholder="name@gmtrade.ru"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5">
                        <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">Пароль учетной записи</label>
                        <a href="#support-section" onClick={() => setOpenFAQIndex(3)} className="text-[9.5px] text-blue-600 font-semibold hover:underline uppercase">Служба поддержки</a>
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1 pb-2 text-[11px] text-slate-500 select-none">
                      <input type="checkbox" id="remember-me" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
                      <label htmlFor="remember-me" className="cursor-pointer select-none">Запомнить сессию на рабочем ПК</label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-bold rounded-lg transition overflow-hidden shadow-xs cursor-pointer text-center"
                    >
                      Авторизоваться
                    </button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[9px] text-slate-450 font-semibold uppercase tracking-wider select-none">
                    Единый стандарт безопасности ООО «Джи Эм Трейд»
                  </div>

                </div>

              </section>

            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SWISS ELEVATED MINIMAL FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Column 1 - Enterprise Info */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2 select-none">
                <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="text-[13px] font-bold text-slate-900 tracking-tight">Global Learn</span>
              </div>
              
              <p className="text-[12px] text-slate-500 leading-relaxed font-normal">
                ООО «Джи Эм Трейд» — сертифицированный поставщик и дистрибьютор технологичного промышленного электрооборудования, систем КИПиА и средств автоматизации на территории Евразийского союза.
              </p>

              <div className="pt-2 text-[10px] text-slate-400 leading-relaxed font-medium">
                <p className="font-bold text-[8.5px] text-slate-500 uppercase tracking-widest mb-0.5">Официальные реквизиты компании</p>
                <p>ОГРН: 1184325010950</p>
                <p>ИНН: 7724490124 • КПП: 772401001</p>
              </div>
            </div>

            {/* Column 2 - Links */}
            <div className="md:col-span-3 space-y-2.5">
              <p className="font-bold uppercase text-[8.5px] tracking-wider text-slate-400 mb-1">Направления адаптации</p>
              <ul className="space-y-1.5 text-[11.5px] text-slate-500 font-medium">
                <li><button onClick={() => { sound.playClick(); setSelectedTrackId('track-sales'); setCurrentTab('onboarding'); }} className="hover:text-blue-600 transition text-left cursor-pointer">Коммерческий департамент</button></li>
                <li><button onClick={() => { sound.playClick(); setSelectedTrackId('track-logistics'); setCurrentTab('onboarding'); }} className="hover:text-blue-600 transition text-left cursor-pointer">Логистика и таможенный ВЭД</button></li>
                <li><button onClick={() => { sound.playClick(); setSelectedTrackId('track-it'); setCurrentTab('onboarding'); }} className="hover:text-blue-600 transition text-left cursor-pointer">IT-инфраструктура и DevOps</button></li>
              </ul>
            </div>

            {/* Column 3 - Directory */}
            <div className="md:col-span-2 space-y-2.5">
              <p className="font-bold uppercase text-[8.5px] tracking-wider text-slate-400 mb-1">Разделы портала</p>
              <ul className="space-y-1.5 text-[11.5px] text-slate-500 font-medium">
                <li><button onClick={() => { sound.playClick(); setCurrentTab('landing'); }} className="hover:text-blue-600 transition text-left cursor-pointer">Главная</button></li>
                <li><button onClick={() => { sound.playClick(); setCurrentTab('onboarding'); }} className="hover:text-blue-600 transition text-left cursor-pointer">Интерактивный онбординг</button></li>
                <li><a href="#academy-standards" className="hover:text-blue-600 transition">Регламенты</a></li>
                <li><a href="#support-section" className="hover:text-blue-600 transition">Справочная служба</a></li>
              </ul>
            </div>

            {/* Column 4 - Security */}
            <div className="md:col-span-2 space-y-2.5">
              <p className="font-bold uppercase text-[8.5px] tracking-wider text-slate-400 mb-1">Информационная безопасность</p>
              <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                <span className="block italic text-slate-450">• Конфиденциальный контур</span>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5 font-normal">
                  Лекции, квалификационные тесты и бизнес-симуляции ВЭД защищены коммерческой тайной предприятия.
                </p>
              </div>
            </div>

          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-444 font-medium tracking-wide">
            <span className="normal-case">
              © {new Date().getFullYear()} Global Learn. ООО «Джи Эм Трейд». Все права защищены.
            </span>
            <div className="flex gap-4">
              <a href="#support-section" className="hover:text-blue-600 transition">Порядок конфиденциальности</a>
              <span>•</span>
              <a href="#support-section" className="hover:text-blue-600 transition">Внутренний регламент холдинга</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
