import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X as XIcon, Pencil, Trash2, Plus, Check } from 'lucide-react';
import { questionApi } from '@entities/course/api/courseRealApi';
import { useCourseQuestionsQuery, useQuestionBankStatsQuery } from '@entities/course/api/hooks';
import type { Course } from '@entities/course/model/types';
import type { CourseQuestionDto } from '@shared/api/schemas';
import { queryKeys } from '@shared/lib/query/queryKeys';
import { toast } from '@shared/lib/toast';
import styles from './QuestionBankModal.module.css';

interface Props {
  courseId: string;
  modules: NonNullable<Course['modules']>;
  onClose: () => void;
}

type AnswerDraft = { answer: string; isCorrect: boolean };

export function QuestionBankModal({ courseId, modules, onClose }: Props) {
  const queryClient = useQueryClient();
  const { data: questions = [], isLoading } = useCourseQuestionsQuery(courseId);
  const { data: stats } = useQuestionBankStatsQuery(courseId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftAnswers, setDraftAnswers] = useState<AnswerDraft[]>([]);
  const [busy, setBusy] = useState(false);

  const moduleName = (moduleId?: string) =>
    moduleId ? (modules.find(m => m.id === moduleId)?.title ?? 'Модуль') : 'Без модуля';

  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.questions(courseId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.questionStats(courseId) }),
  ]);

  const startEdit = (q: CourseQuestionDto) => {
    setEditingId(q.id);
    setDraftText(q.question);
    setDraftAnswers(q.answers.map(a => ({ answer: a.answer, isCorrect: a.isCorrect })));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftText('');
    setDraftAnswers([]);
  };

  const saveEdit = async () => {
    const answers = draftAnswers.map(a => ({ answer: a.answer.trim(), isCorrect: a.isCorrect }))
      .filter(a => a.answer.length > 0);
    if (!draftText.trim()) { toast.error('Введите текст вопроса'); return; }
    if (answers.length < 2) { toast.error('Нужно минимум 2 варианта ответа'); return; }
    if (!answers.some(a => a.isCorrect)) { toast.error('Отметьте хотя бы один правильный ответ'); return; }
    setBusy(true);
    try {
      await questionApi.update(editingId!, { question: draftText.trim(), answers });
      await invalidate();
      toast.success('Вопрос обновлён');
      cancelEdit();
    } catch (err) {
      toast.apiError(err, 'Не удалось обновить вопрос');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (q: CourseQuestionDto) => {
    const used = q.usedInTestsCount ?? 0;
    const warn = used > 0
      ? `Вопрос используется в ${used} тест(ах) — он будет удалён и оттуда. Продолжить?`
      : 'Удалить вопрос из банка?';
    if (!window.confirm(warn)) return;
    setBusy(true);
    try {
      await questionApi.delete(q.id);
      await invalidate();
      toast.success('Вопрос удалён');
    } catch (err) {
      toast.apiError(err, 'Не удалось удалить вопрос');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Банк вопросов</h2>
          <button className={styles.closeBtn} onClick={onClose}><XIcon size={16} /></button>
        </div>

        {stats && (
          <div className={styles.stats}>
            <span><b>{stats.total}</b> всего</span>
            <span><b>{stats.usedInTests}</b> в тестах</span>
            <span><b>{stats.unused}</b> не используются</span>
          </div>
        )}

        <div className={styles.list}>
          {isLoading ? (
            <div className={styles.empty}>Загрузка...</div>
          ) : questions.length === 0 ? (
            <div className={styles.empty}>В банке пока нет вопросов</div>
          ) : (
            questions.map((q, i) => (
              <div key={q.id} className={styles.item}>
                {editingId === q.id ? (
                  <div className={styles.editForm}>
                    <textarea
                      className={styles.editText}
                      value={draftText}
                      onChange={e => setDraftText(e.target.value)}
                      rows={2}
                    />
                    {draftAnswers.map((a, ai) => (
                      <div key={ai} className={styles.answerRow}>
                        <button
                          type="button"
                          className={`${styles.correctToggle} ${a.isCorrect ? styles.correctOn : ''}`}
                          title="Правильный ответ"
                          onClick={() => setDraftAnswers(prev => prev.map((x, xi) => xi === ai ? { ...x, isCorrect: !x.isCorrect } : x))}
                        >
                          <Check size={12} />
                        </button>
                        <input
                          className={styles.answerInput}
                          value={a.answer}
                          onChange={e => setDraftAnswers(prev => prev.map((x, xi) => xi === ai ? { ...x, answer: e.target.value } : x))}
                        />
                        <button
                          type="button"
                          className={styles.answerRemove}
                          onClick={() => setDraftAnswers(prev => prev.filter((_, xi) => xi !== ai))}
                        >
                          <XIcon size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={styles.addAnswer}
                      onClick={() => setDraftAnswers(prev => [...prev, { answer: '', isCorrect: false }])}
                    >
                      <Plus size={13} /> Вариант
                    </button>
                    <div className={styles.editActions}>
                      <button className={styles.saveBtn} onClick={() => void saveEdit()} disabled={busy}>Сохранить</button>
                      <button className={styles.cancelBtn} onClick={cancelEdit} disabled={busy}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.itemHead}>
                      <span className={styles.itemNum}>{i + 1}.</span>
                      <span className={styles.itemText}>{q.question}</span>
                      <span className={styles.itemModule}>{moduleName(q.moduleId)}</span>
                      {(q.usedInTestsCount ?? 0) > 0 && (
                        <span className={styles.usedBadge}>в {q.usedInTestsCount} тест.</span>
                      )}
                      <div className={styles.itemActions}>
                        <button className={styles.iconBtn} title="Редактировать" onClick={() => startEdit(q)} disabled={busy}>
                          <Pencil size={14} />
                        </button>
                        <button className={styles.iconBtnDanger} title="Удалить" onClick={() => void handleDelete(q)} disabled={busy}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <ul className={styles.answers}>
                      {q.answers.map(a => (
                        <li key={a.id} className={a.isCorrect ? styles.answerCorrect : styles.answer}>
                          {a.isCorrect && <Check size={12} />} {a.answer}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
