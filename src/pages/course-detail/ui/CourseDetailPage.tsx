import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, CheckCircle2, ChevronDown, ChevronUp, BookOpen, ClipboardList } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin } from '@entities/user/model/types';
import type { Course, StepItem, LessonContent, TestContent } from '@entities/course/model/types';
import { getAllItems, COURSE_TYPE_LABELS } from '@entities/course/model/types';
import { AssignCourseModal } from '@features/assign-course/ui/AssignCourseModal';
import styles from './CourseDetail.module.css';

// ─────────────────────────────────────────────────────────
// Рендер текста урока: простой Markdown → HTML-like
// ─────────────────────────────────────────────────────────
function LessonText({ content }: { content: string }) {
  const html = useMemo(() => {
    let s = content
      // code blocks
      .replace(/```[\w]*\n([\s\S]*?)```/g, (_m, code: string) =>
        `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
      // inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // list items
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // double newline → paragraph break (skip inside pre)
      .replace(/\n\n/g, '<br/><br/>');
    return s;
  }, [content]);
  return (
    <div
      className={styles.lessonContent}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Плеер урока
// ─────────────────────────────────────────────────────────
function LessonViewer({
  item, isDone, onComplete,
}: {
  item: LessonContent;
  isDone: boolean;
  onComplete: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  const handleDone = async () => {
    setPending(true);
    await onComplete();
    setPending(false);
  };

  return (
    <>
      <span className={styles.contentTypeBadge}>Урок</span>
      <LessonText content={item.content} />
      <div style={{ marginTop: '1.75rem' }}>
        {isDone ? (
          <div className={styles.doneBanner}>
            <CheckCircle2 size={16} /> Урок пройден
          </div>
        ) : (
          <button className={styles.markDoneBtn} onClick={() => void handleDone()} disabled={pending}>
            {pending ? 'Сохраняем...' : '✓ Отметить как пройденный'}
          </button>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Плеер теста
// ─────────────────────────────────────────────────────────
type TestState = 'answering' | 'passed' | 'failed';

function TestPlayer({
  item, isDone, onComplete,
}: {
  item: TestContent;
  isDone: boolean;
  onComplete: () => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, setState] = useState<TestState>(isDone ? 'passed' : 'answering');
  const [score, setScore] = useState(0);
  const [pending, setPending] = useState(false);

  const allAnswered = item.questions.every(q => answers[q.id]);

  const handleSubmit = async () => {
    let correct = 0;
    item.questions.forEach(q => {
      const chosen = q.options.find(o => o.id === answers[q.id]);
      if (chosen?.isCorrect) correct++;
    });
    const pct = Math.round((correct / item.questions.length) * 100);
    setScore(pct);

    if (pct >= item.passingPercent) {
      setState('passed');
      if (!isDone) {
        setPending(true);
        await onComplete();
        setPending(false);
      }
    } else {
      setState('failed');
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setState('answering');
  };

  if (isDone && state !== 'passed') {
    setState('passed');
  }

  return (
    <>
      <span className={styles.contentTypeBadge}>Тест · минимум {item.passingPercent}% правильных</span>

      {item.questions.map((q, qi) => {
        const isSubmitted = state !== 'answering';
        return (
          <div key={q.id} className={styles.testQuestion}>
            <p className={styles.testQuestionText}>{qi + 1}. {q.question}</p>
            <div className={styles.testOptions}>
              {q.options.map(opt => {
                const selected = answers[q.id] === opt.id;
                let cls = styles.testOption;
                if (isSubmitted) {
                  if (opt.isCorrect) cls += ' ' + styles.optionCorrect;
                  else if (selected && !opt.isCorrect) cls += ' ' + styles.optionWrong;
                } else if (selected) {
                  cls += ' ' + styles.optionSelected;
                }
                return (
                  <button
                    key={opt.id}
                    className={cls}
                    disabled={isSubmitted}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                  >
                    <input
                      type="radio"
                      readOnly
                      checked={selected}
                      style={{ pointerEvents: 'none' }}
                    />
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {state === 'answering' && (
        <button
          className={styles.testSubmitBtn}
          disabled={!allAnswered || pending}
          onClick={() => void handleSubmit()}
        >
          {pending ? 'Проверяем...' : 'Отправить ответы'}
        </button>
      )}

      {state === 'passed' && (
        <div className={`${styles.testResult} ${styles.testResultPass}`}>
          ✓ Тест пройден{score > 0 ? ` — ${score}%` : ''}!
        </div>
      )}

      {state === 'failed' && (
        <div className={`${styles.testResult} ${styles.testResultFail}`}>
          ✗ Не пройден — {score}% (нужно {item.passingPercent}%). Попробуйте ещё раз.
          <button className={styles.retryBtn} onClick={handleRetry}>Попробовать снова</button>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Основная страница
// ─────────────────────────────────────────────────────────
export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { courses, getEnrollment, enroll, markItemComplete, isLoading } = useCourses();
  const { user } = useUser();

  const [assignOpen, setAssignOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [enrollPending, setEnrollPending] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['m1-1', 'm2-1', 'm3-1', 'm4-1']));

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;

  const course = courses.find(c => c.id === id);
  if (!course) {
    return (
      <div className={styles.notFound}>
        <p className={styles.notFoundText}>Курс не найден</p>
        <Link to="/courses" className={styles.backLink}>← Все курсы</Link>
      </div>
    );
  }

  const enrollment = getEnrollment(course.id);
  const isEnrolled   = !!enrollment;
  const isCompleted  = enrollment?.status === 'completed';
  const completedSet = new Set(enrollment?.completedItems ?? []);
  const allItems     = getAllItems(course);

  // ── Навигация по дереву ──────────────────────────────────
  const firstUndone = allItems.find(item => !completedSet.has(item.id));
  const activeItemId = selectedItemId ?? firstUndone?.id ?? allItems[0]?.id ?? null;
  const activeItem   = allItems.find(i => i.id === activeItemId) ?? null;

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  };

  // ── Запись на курс ───────────────────────────────────────
  const handleEnroll = async () => {
    setEnrollPending(true);
    await enroll(course.id);
    setEnrollPending(false);
    setPlayerOpen(true);
  };

  // ── Завершение элемента ───────────────────────────────────
  const handleItemComplete = async (itemId: string) => {
    await markItemComplete(course.id, itemId);
    // Автоматически переходим к следующему непройденному
    const idx = allItems.findIndex(i => i.id === itemId);
    const next = allItems.slice(idx + 1).find(i => !completedSet.has(i.id) && i.id !== itemId);
    if (next) setSelectedItemId(next.id);
  };

  const pageClass = playerOpen && isEnrolled ? styles.pageWide : styles.page;

  return (
    <div className={pageClass}>
      <Link to="/courses" className={styles.backLink}>← Все курсы</Link>

      {/* Шапка */}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{course.title}</h1>
        {isAdmin(user) && (
          <button className={styles.assignBtn} onClick={() => setAssignOpen(true)}>
            Назначить сотрудникам
          </button>
        )}
      </div>

      <div className={styles.metaRow}>
        <span className={styles.meta}>{course.lessonsCount} уроков · Добавлен {course.createdAt}</span>
        <span className={styles.courseTypeBadge}>{COURSE_TYPE_LABELS[course.courseType]}</span>
      </div>

      {/* Описание */}
      <div className={styles.descriptionCard}>
        <h2 className={styles.descriptionTitle}>О курсе</h2>
        <p className={styles.descriptionText}>{course.description}</p>
      </div>

      {/* Прогресс */}
      {isEnrolled && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>
              Пройдено {completedSet.size} из {allItems.length} элементов
            </span>
            <span className={styles.progressValue}>{enrollment?.progress ?? 0}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${enrollment?.progress ?? 0}%` }} />
          </div>
        </div>
      )}

      {/* Кнопки действия */}
      {!isEnrolled && (
        <button
          className={styles.startBtn}
          onClick={() => void handleEnroll()}
          disabled={enrollPending}
        >
          <Play size={18} />
          {enrollPending ? 'Записываем...' : 'Записаться на курс'}
        </button>
      )}

      {isEnrolled && isCompleted && !playerOpen && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div className={styles.completedBanner}>
            <CheckCircle2 size={18} /> Курс завершён!
          </div>
          <button className={styles.startBtn} style={{ margin: 0 }} onClick={() => setPlayerOpen(true)}>
            Повторить материал
          </button>
        </div>
      )}

      {isEnrolled && !isCompleted && !playerOpen && (
        <button className={styles.startBtn} onClick={() => setPlayerOpen(true)}>
          <Play size={18} />
          {completedSet.size === 0 ? 'Начать курс' : 'Продолжить курс'}
        </button>
      )}

      {/* Плеер */}
      {isEnrolled && playerOpen && course.modules && course.modules.length > 0 && (
        <div className={styles.player}>
          {/* Дерево модулей */}
          <nav className={styles.tree}>
            <div className={styles.treeTitle}>Содержание курса</div>
            {course.modules.map(mod => {
              const isOpen = expandedModules.has(mod.id);
              return (
                <div key={mod.id} className={styles.treeModule}>
                  <button className={styles.treeModuleBtn} onClick={() => toggleModule(mod.id)}>
                    {mod.title}
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {isOpen && (
                    <div className={styles.treeSteps}>
                      {mod.steps.map(step => (
                        <div key={step.id}>
                          <div className={styles.treeStep}>{step.title}</div>
                          {step.items.map(item => {
                            const done = completedSet.has(item.id);
                            const active = item.id === activeItemId;
                            const cls = [
                              styles.treeItem,
                              active ? styles.treeItemActive : '',
                              done && !active ? styles.treeItemDone : '',
                            ].filter(Boolean).join(' ');
                            return (
                              <button
                                key={item.id}
                                className={cls}
                                onClick={() => setSelectedItemId(item.id)}
                              >
                                <span className={styles.treeItemIcon}>
                                  {done
                                    ? <CheckCircle2 size={13} />
                                    : item.type === 'lesson'
                                      ? <BookOpen size={13} />
                                      : <ClipboardList size={13} />}
                                </span>
                                <span className={styles.treeItemLabel}>{item.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Контентная панель */}
          <div className={styles.contentPane}>
            {activeItem ? (
              <>
                <h2 className={styles.contentTitle}>{activeItem.title}</h2>
                {activeItem.type === 'lesson' ? (
                  <LessonViewer
                    key={activeItem.id}
                    item={activeItem as LessonContent}
                    isDone={completedSet.has(activeItem.id)}
                    onComplete={() => handleItemComplete(activeItem.id)}
                  />
                ) : (
                  <TestPlayer
                    key={activeItem.id}
                    item={activeItem as TestContent}
                    isDone={completedSet.has(activeItem.id)}
                    onComplete={() => handleItemComplete(activeItem.id)}
                  />
                )}
              </>
            ) : (
              <div className={styles.noItemSelected}>
                <CheckCircle2 size={40} style={{ color: '#38a169' }} />
                <p>Все материалы пройдены!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {assignOpen && (
        <AssignCourseModal
          courseId={course.id}
          courseTitle={course.title}
          onClose={() => setAssignOpen(false)}
        />
      )}
    </div>
  );
}

// Вспомогательная типизация для Course с modules
type _CourseWithModules = Course & { modules: NonNullable<Course['modules']> };
void (null as unknown as _CourseWithModules);
