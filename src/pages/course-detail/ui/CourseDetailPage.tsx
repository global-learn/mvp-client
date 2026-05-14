import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, CheckCircle2, ChevronDown, ChevronUp, BookOpen, ClipboardList, Clock, XCircle, Users, Building2, Target, UserCircle2 } from 'lucide-react';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, canControl, canAssignCourse } from '@entities/user/model/types';
import { MOCK_USER_INFO } from '@entities/course/api/courseApi';
import type { Course, StepItem, LessonContent, TestContent, EnrollmentRequest, Enrollment } from '@entities/course/model/types';
import { getAllItems, COURSE_TYPE_LABELS } from '@entities/course/model/types';
import { AssignCourseModal } from '@features/assign-course/ui/AssignCourseModal';
import { CompletionModal } from './CompletionModal';
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
// Панель статистики курса (для canControl-пользователей)
// ─────────────────────────────────────────────────────────
function CourseStatsPanel({ courseId, getCourseEnrollments }: {
  courseId: string;
  getCourseEnrollments: (id: string) => Promise<Enrollment[]>;
}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void getCourseEnrollments(courseId).then(data => {
      setEnrollments(data);
      setLoading(false);
    });
  }, [courseId, getCourseEnrollments]);

  const statusLabel: Record<string, { text: string; cls: string }> = {
    in_progress:      { text: 'В процессе',    cls: styles.statsBadgeProgress },
    completed:        { text: 'Завершён',       cls: styles.statsBadgeDone },
    pending_approval: { text: 'Ожидает',        cls: styles.statsBadgePending },
    not_enrolled:     { text: 'Не записан',     cls: styles.statsBadgeNone },
    rejected:         { text: 'Отклонён',       cls: styles.statsBadgeRejected },
  };

  const counts = {
    total:    enrollments.length,
    done:     enrollments.filter(e => e.status === 'completed').length,
    progress: enrollments.filter(e => e.status === 'in_progress').length,
    pending:  enrollments.filter(e => e.status === 'pending_approval').length,
  };

  return (
    <div className={styles.statsPanel}>
      <h3 className={styles.statsPanelTitle}>
        <Users size={16} /> Статистика прохождения
      </h3>

      {/* Итоги */}
      <div className={styles.statsCards}>
        <div className={styles.statsCard}>
          <div className={styles.statsCardNum}>{counts.total}</div>
          <div className={styles.statsCardLabel}>Записаны</div>
        </div>
        <div className={styles.statsCard}>
          <div className={`${styles.statsCardNum} ${styles.statsCardNumDone}`}>{counts.done}</div>
          <div className={styles.statsCardLabel}>Завершили</div>
        </div>
        <div className={styles.statsCard}>
          <div className={`${styles.statsCardNum} ${styles.statsCardNumProgress}`}>{counts.progress}</div>
          <div className={styles.statsCardLabel}>В процессе</div>
        </div>
        <div className={styles.statsCard}>
          <div className={`${styles.statsCardNum} ${styles.statsCardNumPending}`}>{counts.pending}</div>
          <div className={styles.statsCardLabel}>Ожидают</div>
        </div>
      </div>

      {/* Список */}
      {loading ? (
        <p className={styles.statsEmpty}>Загрузка...</p>
      ) : enrollments.length === 0 ? (
        <p className={styles.statsEmpty}>Никто ещё не записан на этот курс.</p>
      ) : (
        <div className={styles.statsTable}>
          {enrollments.map(e => {
            const info = MOCK_USER_INFO[e.userId];
            const name = info?.name ?? e.userId;
            const division = info?.division ?? '—';
            const badge = statusLabel[e.status] ?? { text: e.status, cls: '' };
            const enrollDate = e.enrolledAt
              ? new Date(e.enrolledAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—';
            const assignerInfo = e.assignedBy ? (MOCK_USER_INFO[e.assignedBy]?.name ?? e.assignedBy) : null;
            return (
              <div key={`${e.courseId}-${e.userId}`} className={styles.statsRow}>
                <div className={styles.statsAvatar}>{name[0]}</div>
                <div className={styles.statsInfo}>
                  <div className={styles.statsName}>{name}</div>
                  <div className={styles.statsMeta}>
                    {division}
                    {assignerInfo && <span className={styles.statsAssignedBy}> · Назначил: {assignerInfo}</span>}
                    <span className={styles.statsDate}> · {enrollDate}</span>
                  </div>
                </div>
                <div className={styles.statsRight}>
                  <span className={`${styles.statsBadge} ${badge.cls}`}>{badge.text}</span>
                  <div className={styles.statsProgressWrap}>
                    <div className={styles.statsProgressBar}>
                      <div className={styles.statsProgressFill} style={{ width: `${e.progress}%` }} />
                    </div>
                    <span className={styles.statsProgressPct}>{e.progress}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Основная страница
// ─────────────────────────────────────────────────────────
export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    courses, getEnrollment, enroll, requestEnrollment,
    getCourseRequests, approveEnrollmentRequest, rejectEnrollmentRequest,
    markItemComplete, certificates, isLoading, getCourseEnrollments,
  } = useCourses();
  const { user } = useUser();

  const [assignOpen, setAssignOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['m1-1', 'm2-1', 'm3-1', 'm4-1']));
  const [completionOpen, setCompletionOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<EnrollmentRequest[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const isController = canControl(user);

  // Загружаем заявки для менеджеров
  useEffect(() => {
    if (!isController || !id) return;
    void getCourseRequests(id).then(setPendingRequests);
  }, [isController, id, getCourseRequests]);

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
  const enrollStatus = enrollment?.status ?? 'not_enrolled';
  const isEnrolled   = enrollStatus === 'in_progress' || enrollStatus === 'completed';
  const isPending    = enrollStatus === 'pending_approval';
  const isRejected   = enrollStatus === 'rejected';
  const isCompleted  = enrollStatus === 'completed';
  const completedSet = new Set(enrollment?.completedItems ?? []);
  const allItems     = getAllItems(course);

  // Когда плеер открыт — скрываем шапку курса
  const isPlaying = playerOpen && isEnrolled;

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

  // ── Подача заявки (обычный пользователь) ─────────────────
  const handleRequestEnrollment = async () => {
    setActionPending(true);
    await requestEnrollment(course.id);
    setActionPending(false);
  };

  // ── Прямая запись (admin назначает себя напрямую) ─────────
  const handleEnrollDirect = async () => {
    setActionPending(true);
    await enroll(course.id);
    setActionPending(false);
    setPlayerOpen(true);
  };

  // ── Завершение элемента ───────────────────────────────────
  const handleItemComplete = async (itemId: string) => {
    const updated = await markItemComplete(course.id, itemId);
    if (updated.status === 'completed') {
      setCompletionOpen(true);
      return;
    }
    const idx = allItems.findIndex(i => i.id === itemId);
    const next = allItems.slice(idx + 1).find(i => !completedSet.has(i.id) && i.id !== itemId);
    if (next) setSelectedItemId(next.id);
  };

  // ── Одобрение/отклонение заявок ──────────────────────────
  const handleApproveRequest = async (req: EnrollmentRequest) => {
    setApprovingId(req.userId);
    await approveEnrollmentRequest(course.id, req.userId);
    setPendingRequests(prev => prev.filter(r => r.userId !== req.userId));
    setApprovingId(null);
  };

  const handleRejectRequest = async (req: EnrollmentRequest) => {
    setRejectingId(req.userId);
    await rejectEnrollmentRequest(course.id, req.userId);
    setPendingRequests(prev => prev.filter(r => r.userId !== req.userId));
    setRejectingId(null);
  };

  const pageClass = isPlaying ? styles.pageWide : styles.page;

  return (
    <div className={pageClass}>
      <Link to="/courses" className={styles.backLink}>← Все курсы</Link>

      {/* ── Шапка курса — скрывается во время просмотра ── */}
      {!isPlaying && (
        <>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{course.title}</h1>
            {canAssignCourse(user) && (
              <button className={styles.assignBtn} onClick={() => setAssignOpen(true)}>
                Назначить сотрудникам
              </button>
            )}
          </div>

          <div className={styles.metaRow}>
            <span className={styles.meta}>{course.lessonsCount} уроков · {course.createdAt}</span>
            <span className={styles.courseTypeBadge}>{COURSE_TYPE_LABELS[course.courseType]}</span>
            {course.targetDepartmentName && (
              <span className={styles.targetBadge}>
                <Building2 size={11} /> {course.targetDepartmentName}
              </span>
            )}
            {course.targetDivisionName && (
              <span className={styles.targetBadge}>
                <Target size={11} /> {course.targetDivisionName}
              </span>
            )}
          </div>

          {/* Описание + автор */}
          <div className={styles.descriptionCard}>
            <div className={styles.descriptionCardInner}>
              <div className={styles.descriptionBody}>
                <h2 className={styles.descriptionTitle}>О курсе</h2>
                <p className={styles.descriptionText}>{course.description}</p>
              </div>
              <div className={styles.authorBlock}>
                {(() => {
                  const authorInfo = MOCK_USER_INFO[course.authorId];
                  const authorName = authorInfo?.name ?? course.authorId;
                  const authorDiv  = authorInfo?.division;
                  const initials   = authorName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <>
                      <div className={styles.authorLabel}>
                        <UserCircle2 size={13} /> Автор курса
                      </div>
                      <div className={styles.authorChip}>
                        <div className={styles.authorAvatar}>{initials}</div>
                        <div className={styles.authorInfo}>
                          <span className={styles.authorName}>{authorName}</span>
                          {authorDiv && <span className={styles.authorDiv}>{authorDiv}</span>}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Статистика прохождения (для canControl) */}
          {isController && (
            <CourseStatsPanel
              courseId={course.id}
              getCourseEnrollments={getCourseEnrollments}
            />
          )}

          {/* Прогресс (только если идёт прохождение) */}
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

          {/* ── Панель одобрения для руководителей ── */}
          {isController && (
            <div className={styles.approvalPanel}>
              <h3 className={styles.approvalPanelTitle}>
                <Users size={16} /> Заявки на прохождение
                {pendingRequests.length > 0 && (
                  <span style={{ marginLeft: '0.375rem', background: 'var(--primary)', color: '#fff', borderRadius: '3px', padding: '0 6px', fontSize: '0.75rem' }}>
                    {pendingRequests.length}
                  </span>
                )}
              </h3>
              {pendingRequests.length === 0 ? (
                <p className={styles.approvalPanelEmpty}>Нет ожидающих заявок</p>
              ) : (
                pendingRequests.map(req => (
                  <div key={req.userId} className={styles.approvalRequestRow}>
                    <div className={styles.approvalRequestAvatar}>
                      {(req.userName || req.userEmail)[0].toUpperCase()}
                    </div>
                    <div className={styles.approvalRequestInfo}>
                      <div className={styles.approvalRequestName}>{req.userName}</div>
                      <div className={styles.approvalRequestMeta}>
                        {req.userEmail} · {new Date(req.requestedAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className={styles.approvalActions}>
                      <button
                        className={styles.approveBtn}
                        onClick={() => void handleApproveRequest(req)}
                        disabled={approvingId === req.userId || rejectingId === req.userId}
                      >
                        <CheckCircle2 size={14} />
                        {approvingId === req.userId ? '...' : 'Одобрить'}
                      </button>
                      <button
                        className={styles.rejectReqBtn}
                        onClick={() => void handleRejectRequest(req)}
                        disabled={approvingId === req.userId || rejectingId === req.userId}
                      >
                        <XCircle size={14} />
                        {rejectingId === req.userId ? '...' : 'Отклонить'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Кнопки / статусы записи ── */}

          {/* Не записан — подать заявку */}
          {enrollStatus === 'not_enrolled' && !isAdmin(user) && (
            <button
              className={styles.requestBtn}
              onClick={() => void handleRequestEnrollment()}
              disabled={actionPending}
            >
              <Clock size={18} />
              {actionPending ? 'Отправляем...' : 'Подать заявку на прохождение'}
            </button>
          )}

          {/* Admin — записывается напрямую */}
          {enrollStatus === 'not_enrolled' && isAdmin(user) && (
            <button
              className={styles.requestBtn}
              onClick={() => void handleEnrollDirect()}
              disabled={actionPending}
            >
              <Play size={18} />
              {actionPending ? 'Записываем...' : 'Начать курс'}
            </button>
          )}

          {/* Заявка на рассмотрении */}
          {isPending && (
            <div className={styles.pendingBanner}>
              <Clock size={20} className={styles.pendingBannerIcon} />
              <div className={styles.pendingBannerText}>
                <div className={styles.pendingBannerTitle}>Заявка на рассмотрении</div>
                <div className={styles.pendingBannerSub}>
                  Ваша заявка отправлена руководителю. Вы получите доступ после одобрения.
                </div>
              </div>
            </div>
          )}

          {/* Заявка отклонена */}
          {isRejected && (
            <>
              <div className={styles.rejectedBanner}>
                <XCircle size={20} className={styles.rejectedBannerIcon} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>Заявка отклонена</div>
                  <div style={{ fontSize: '0.8125rem', opacity: 0.8 }}>
                    Обратитесь к руководителю или подайте заявку повторно.
                  </div>
                </div>
              </div>
              <button
                className={styles.reRequestBtn}
                onClick={() => void handleRequestEnrollment()}
                disabled={actionPending}
              >
                <Clock size={14} />
                {actionPending ? 'Отправляем...' : 'Подать заявку повторно'}
              </button>
            </>
          )}

          {/* Курс завершён */}
          {isCompleted && !playerOpen && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div className={styles.completedBanner}>
                <CheckCircle2 size={18} /> Курс завершён!
              </div>
              <button className={styles.startBtn} style={{ margin: 0 }} onClick={() => setPlayerOpen(true)}>
                Повторить материал
              </button>
            </div>
          )}

          {/* Курс одобрен — начать/продолжить */}
          {isEnrolled && !isCompleted && !playerOpen && (
            <button className={styles.startBtn} onClick={() => setPlayerOpen(true)}>
              <Play size={18} />
              {completedSet.size === 0 ? 'Начать курс' : 'Продолжить курс'}
            </button>
          )}
        </>
      )}

      {/* ── Плеер ── */}
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

      {completionOpen && (
        <CompletionModal
          courseTitle={course.title}
          certificate={certificates.find(c => c.courseId === course.id)}
          onClose={() => setCompletionOpen(false)}
        />
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
