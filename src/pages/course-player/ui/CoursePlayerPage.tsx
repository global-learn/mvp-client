import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, BookOpen, ClipboardList } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import type { Course, Step, StepItem, LessonContent, TestContent, TestQuestion } from '@entities/course/model/types';
import styles from './CoursePlayer.module.css';

// ================================================================
// CoursePlayerPage — /courses/:id/play?step=stepId
// Плеер для пошагового прохождения курса.
// Структура: Sidebar (модули/шаги) | Content (урок или тест)
// ================================================================

export function CoursePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { courses, getEnrollment, getCourseWithModules, completeStep, enroll } = useCourses();

  const [fullCourse, setFullCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const course = courses.find(c => c.id === id);
  const enrollment = course ? getEnrollment(course.id) : undefined;
  const completedStepIds = enrollment?.completedStepIds ?? [];

  // Загружаем модули
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCourseWithModules(id)
      .then(c => setFullCourse(c ?? null))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Плоский список всех шагов для навигации prev/next
  const allSteps = useMemo<Step[]>(
    () => (fullCourse?.modules ?? []).flatMap(m => m.steps),
    [fullCourse],
  );

  // Текущий шаг из URL-параметра; если нет — первый непройденный или первый
  const stepId = searchParams.get('step') ?? null;
  const currentStep = useMemo(() => {
    if (stepId) return allSteps.find(s => s.id === stepId) ?? null;
    const first = allSteps.find(s => !completedStepIds.includes(s.id));
    return first ?? allSteps[0] ?? null;
  }, [stepId, allSteps, completedStepIds]);

  const currentIdx = currentStep ? allSteps.indexOf(currentStep) : -1;
  const prevStep = currentIdx > 0 ? allSteps[currentIdx - 1] : null;
  const nextStep = currentIdx < allSteps.length - 1 ? allSteps[currentIdx + 1] : null;

  const goTo = (step: Step) => setSearchParams({ step: step.id });

  const handlePrev = () => { if (prevStep) goTo(prevStep); };
  const handleNext = () => { if (nextStep) goTo(nextStep); };

  const handleStepComplete = async (stepId: string) => {
    await completeStep(course!.id, stepId);
    if (nextStep) goTo(nextStep);
  };

  // Автозапись при входе в плеер без enrollment
  useEffect(() => {
    if (!loading && course && !enrollment) {
      void enroll(course.id);
    }
  }, [loading, course, enrollment]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className={styles.fullLoading}>Загрузка курса...</div>;
  if (!course || !fullCourse) return (
    <div className={styles.fullLoading}>
      Курс не найден. <Link to="/courses">← Все курсы</Link>
    </div>
  );

  const modules = fullCourse.modules ?? [];
  const totalSteps = allSteps.length || course.lessonsCount;
  const progress = totalSteps > 0 ? Math.round((completedStepIds.length / totalSteps) * 100) : 0;

  return (
    <div className={styles.playerPage}>
      {/* Шапка */}
      <header className={styles.header}>
        <Link to={`/courses/${course.id}`} className={styles.headerBack}>
          <ChevronLeft size={18} /> {course.title}
        </Link>
        <div className={styles.headerProgress}>
          <div className={styles.headerBar}>
            <div className={styles.headerFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.headerPercent}>{completedStepIds.length}/{totalSteps}</span>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Сайдбар */}
        <aside className={styles.sidebar}>
          {modules.map((mod, mi) => (
            <div key={mod.id} className={styles.sideModule}>
              <p className={styles.sideModuleTitle}>
                <span className={styles.sideModuleNum}>Модуль {mi + 1}</span>
                {mod.title}
              </p>
              {mod.steps.map((step, si) => {
                const done = completedStepIds.includes(step.id);
                const active = step.id === currentStep?.id;
                const item = step.items[0];
                const isTest = item?.type === 'test';
                return (
                  <button
                    key={step.id}
                    className={`${styles.sideStep} ${active ? styles.sideStepActive : ''} ${done ? styles.sideStepDone : ''}`}
                    onClick={() => goTo(step)}
                  >
                    <span className={styles.sideStepIcon}>
                      {done
                        ? <CheckCircle2 size={14} className={styles.iconDone} />
                        : isTest
                        ? <ClipboardList size={14} />
                        : <BookOpen size={14} />}
                    </span>
                    <span className={styles.sideStepLabel}>
                      {mi + 1}.{si + 1} {step.title}
                    </span>
                    {active && <span className={styles.sideStepArrow}>›</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Контент */}
        <main className={styles.content}>
          {currentStep ? (
            <StepPlayer
              step={currentStep}
              isCompleted={completedStepIds.includes(currentStep.id)}
              onComplete={handleStepComplete}
            />
          ) : (
            <div className={styles.emptyContent}>
              Выберите шаг из списка слева
            </div>
          )}

          {/* Навигация */}
          <div className={styles.nav}>
            <button
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={handlePrev}
              disabled={!prevStep}
            >
              <ChevronLeft size={16} /> Предыдущий
            </button>
            {enrollment?.status === 'completed' && !nextStep ? (
              <button
                className={`${styles.navBtn} ${styles.navFinish}`}
                onClick={() => void navigate(`/courses/${course.id}`)}
              >
                К странице курса ✓
              </button>
            ) : (
              <button
                className={`${styles.navBtn} ${styles.navNext}`}
                onClick={handleNext}
                disabled={!nextStep}
              >
                Следующий <ChevronRight size={16} />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ================================================================
// StepPlayer — рендерит один шаг (урок или тест)
// ================================================================

interface StepPlayerProps {
  step: Step;
  isCompleted: boolean;
  onComplete: (stepId: string) => Promise<void>;
}

function StepPlayer({ step, isCompleted, onComplete }: StepPlayerProps) {
  const [completing, setCompleting] = useState(false);

  const item = step.items[0];
  if (!item) return <div className={styles.emptyContent}>Содержание шага не найдено</div>;

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(step.id);
    setCompleting(false);
  };

  if (item.type === 'lesson') {
    return <LessonPlayer item={item} isCompleted={isCompleted} completing={completing} onComplete={handleComplete} />;
  }
  return <TestPlayer item={item} isCompleted={isCompleted} stepId={step.id} onComplete={handleComplete} />;
}

// ================================================================
// LessonPlayer — markdown-контент
// ================================================================

interface LessonPlayerProps {
  item: LessonContent;
  isCompleted: boolean;
  completing: boolean;
  onComplete: () => Promise<void>;
}

function LessonPlayer({ item, isCompleted, completing, onComplete }: LessonPlayerProps) {
  return (
    <div className={styles.lessonWrap}>
      <div className={styles.stepHeader}>
        <BookOpen size={20} className={styles.stepIcon} />
        <h1 className={styles.stepTitle}>{item.title}</h1>
      </div>

      <div className={styles.markdownBody}>
        <ReactMarkdown>{item.content}</ReactMarkdown>
      </div>

      <div className={styles.completeRow}>
        {isCompleted ? (
          <div className={styles.completedBadge}>
            <CheckCircle2 size={18} /> Урок пройден
          </div>
        ) : (
          <button
            className={styles.completeBtn}
            onClick={() => void onComplete()}
            disabled={completing}
          >
            {completing ? 'Сохраняем...' : 'Отметить пройденным'}
          </button>
        )}
      </div>
    </div>
  );
}

// ================================================================
// TestPlayer — вопросы с вариантами ответа
// ================================================================

type AnswerMap = Record<string, string>; // questionId → optionId

interface TestPlayerProps {
  item: TestContent;
  isCompleted: boolean;
  stepId: string;
  onComplete: () => Promise<void>;
}

function TestPlayer({ item, isCompleted, onComplete }: TestPlayerProps) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({}); // questionId → correct?

  const allAnswered = item.questions.every(q => q.id in answers);

  const handleSelect = (questionId: string, optionId: string) => {
    if (result) return; // после проверки не даём менять
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleCheck = () => {
    let correct = 0;
    const newChecked: Record<string, boolean> = {};
    for (const q of item.questions) {
      const selectedId = answers[q.id];
      const correctOption = q.options.find(o => o.isCorrect);
      const isRight = selectedId === correctOption?.id;
      newChecked[q.id] = isRight;
      if (isRight) correct++;
    }
    const score = Math.round((correct / item.questions.length) * 100);
    setChecked(newChecked);
    setResult({ score, passed: score >= item.passingPercent });
  };

  const handleRetry = () => {
    setAnswers({});
    setChecked({});
    setResult(null);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    await onComplete();
    setSubmitting(false);
  };

  return (
    <div className={styles.testWrap}>
      <div className={styles.stepHeader}>
        <ClipboardList size={20} className={styles.stepIcon} />
        <h1 className={styles.stepTitle}>{item.title}</h1>
      </div>
      <p className={styles.passingNote}>Для прохождения нужно {item.passingPercent}% правильных ответов</p>

      {isCompleted && (
        <div className={styles.alreadyPassed}>
          <CheckCircle2 size={18} /> Тест уже пройден
        </div>
      )}

      <div className={styles.questions}>
        {item.questions.map((q, qi) => (
          <QuestionBlock
            key={q.id}
            question={q}
            index={qi}
            selected={answers[q.id] ?? null}
            isCorrect={result ? (checked[q.id] ?? null) : null}
            onSelect={(optId) => handleSelect(q.id, optId)}
          />
        ))}
      </div>

      {!isCompleted && (
        <div className={styles.testActions}>
          {!result ? (
            <button
              className={styles.checkBtn}
              onClick={handleCheck}
              disabled={!allAnswered}
            >
              Проверить ответы
            </button>
          ) : (
            <div className={styles.resultBlock}>
              <div className={`${styles.resultBadge} ${result.passed ? styles.resultPass : styles.resultFail}`}>
                {result.passed
                  ? `✓ Тест пройден! ${result.score}%`
                  : `✗ Не пройден. ${result.score}% (нужно ${item.passingPercent}%)`}
              </div>
              <div className={styles.resultBtns}>
                {!result.passed && (
                  <button className={styles.retryBtn} onClick={handleRetry}>Попробовать снова</button>
                )}
                {result.passed && (
                  <button className={styles.completeBtn} onClick={() => void handleComplete()} disabled={submitting}>
                    {submitting ? 'Сохраняем...' : 'Продолжить →'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ================================================================
// QuestionBlock — один вопрос
// ================================================================

interface QuestionBlockProps {
  question: TestQuestion;
  index: number;
  selected: string | null;
  isCorrect: boolean | null; // null = ещё не проверяли
  onSelect: (optionId: string) => void;
}

function QuestionBlock({ question, index, selected, isCorrect, onSelect }: QuestionBlockProps) {
  return (
    <div className={`${styles.question} ${isCorrect === true ? styles.qCorrect : isCorrect === false ? styles.qWrong : ''}`}>
      <p className={styles.questionText}>
        <span className={styles.questionNum}>{index + 1}.</span> {question.question}
      </p>
      <div className={styles.options}>
        {question.options.map(opt => {
          const isSelected = selected === opt.id;
          const showCorrect = isCorrect !== null && opt.isCorrect;
          const showWrong = isCorrect === false && isSelected && !opt.isCorrect;
          return (
            <label
              key={opt.id}
              className={`${styles.option}
                ${isSelected ? styles.optSelected : ''}
                ${showCorrect ? styles.optCorrect : ''}
                ${showWrong ? styles.optWrong : ''}
              `}
            >
              <span className={styles.optRadio}>
                {isSelected
                  ? <Circle size={16} className={styles.radioFilled} />
                  : <Circle size={16} />}
              </span>
              <input
                type="radio"
                name={question.id}
                value={opt.id}
                checked={isSelected}
                onChange={() => onSelect(opt.id)}
                className={styles.hiddenInput}
              />
              {opt.text}
              {showCorrect && <span className={styles.optTag}>✓ правильный</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}
