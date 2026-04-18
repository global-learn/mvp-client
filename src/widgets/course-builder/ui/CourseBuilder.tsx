import { useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Plus, GripVertical, Trash2, BookOpen, FileQuestion,
  ChevronDown, ChevronRight, X, Check,
} from 'lucide-react';
import type {
  Module, Step, StepItem,
  LessonContent, TestContent, TestQuestion, TestOption, CourseType,
} from '@entities/course/model/types';
import { COURSE_TYPE_LABELS } from '@entities/course/model/types';
import { useCourses } from '@entities/course/model/CoursesContext';
import styles from './CourseBuilder.module.css';

// Изменения относительно оригинала (Next.js → React):
//   - убран "use client" (не нужен в Vite)
//   - import из "@/types/course" → "@entities/course/model/types"
//   - React.DragEvent → import type { DragEvent } from 'react'
//   - добавлены useCourses + useNavigate для кнопки "Сохранить"

const generateId = () => Math.random().toString(36).substring(2, 9);

// Локальный тип для состояния билдера — без id, authorId, createdAt
type BuilderCourse = {
  title: string;
  description: string;
  courseType: CourseType;
  modules: Module[];
};

export function CourseBuilder() {
  const { createCourse } = useCourses();
  const navigate = useNavigate();

  const [course, setCourse] = useState<BuilderCourse>({
    title: '',
    description: '',
    courseType: 'all',
    modules: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<{ moduleId: string; stepId: string } | null>(null);

  // ---- Сохранение на сервер ----
  const handleSave = async () => {
    if (!course.title.trim()) return;
    setIsSaving(true);
    try {
      const lessonsCount = course.modules.reduce(
        (acc, m) => acc + m.steps.reduce((acc2, s) => acc2 + s.items.length, 0),
        0,
      );
      await createCourse({
        title: course.title,
        description: course.description,
        courseType: course.courseType,
        lessonsCount,
        modules: course.modules,
        status: 'published',
      });
      navigate('/courses');
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Expand/collapse ----
  const toggleModule = (moduleId: string) => {
    const next = new Set(expandedModules);
    next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
    setExpandedModules(next);
  };

  const toggleStep = (stepId: string) => {
    const next = new Set(expandedSteps);
    next.has(stepId) ? next.delete(stepId) : next.add(stepId);
    setExpandedSteps(next);
  };

  // ---- Add ----
  const addModule = () => {
    const m: Module = { id: generateId(), title: `Модуль ${course.modules.length + 1}`, steps: [] };
    setCourse({ ...course, modules: [...course.modules, m] });
    setExpandedModules(new Set([...expandedModules, m.id]));
  };

  const addStep = (moduleId: string) => {
    const mi = course.modules.findIndex(m => m.id === moduleId);
    const mod = course.modules[mi];
    const s: Step = { id: generateId(), title: `Шаг ${mod.steps.length + 1}`, items: [] };
    const mods = [...course.modules];
    mods[mi] = { ...mod, steps: [...mod.steps, s] };
    setCourse({ ...course, modules: mods });
    setExpandedSteps(new Set([...expandedSteps, s.id]));
  };

  const addItem = (moduleId: string, stepId: string, type: 'lesson' | 'test') => {
    const mi = course.modules.findIndex(m => m.id === moduleId);
    const mod = course.modules[mi];
    const si = mod.steps.findIndex(s => s.id === stepId);
    const step = mod.steps[si];

    let item: StepItem;
    if (type === 'lesson') {
      item = {
        id: generateId(),
        title: `Урок ${step.items.filter(i => i.type === 'lesson').length + 1}`,
        type: 'lesson',
        content: '# Заголовок урока\n\nВведите содержимое урока здесь...',
      } satisfies LessonContent;
    } else {
      item = {
        id: generateId(),
        title: `Тест ${step.items.filter(i => i.type === 'test').length + 1}`,
        type: 'test',
        questions: [{
          id: generateId(),
          question: 'Вопрос теста',
          options: [
            { id: generateId(), text: 'Вариант 1', isCorrect: true },
            { id: generateId(), text: 'Вариант 2', isCorrect: false },
          ],
        }],
        passingPercent: 70,
      } satisfies TestContent;
    }

    const steps = [...mod.steps];
    steps[si] = { ...step, items: [...step.items, item] };
    const mods = [...course.modules];
    mods[mi] = { ...mod, steps };
    setCourse({ ...course, modules: mods });
    setEditingItem(item.id);
  };

  // ---- Delete ----
  const deleteModule = (moduleId: string) => {
    setCourse({ ...course, modules: course.modules.filter(m => m.id !== moduleId) });
  };

  const deleteStep = (moduleId: string, stepId: string) => {
    const mi = course.modules.findIndex(m => m.id === moduleId);
    const mod = course.modules[mi];
    const mods = [...course.modules];
    mods[mi] = { ...mod, steps: mod.steps.filter(s => s.id !== stepId) };
    setCourse({ ...course, modules: mods });
  };

  const deleteItem = (moduleId: string, stepId: string, itemId: string) => {
    const mi = course.modules.findIndex(m => m.id === moduleId);
    const mod = course.modules[mi];
    const si = mod.steps.findIndex(s => s.id === stepId);
    const step = mod.steps[si];
    const steps = [...mod.steps];
    steps[si] = { ...step, items: step.items.filter(i => i.id !== itemId) };
    const mods = [...course.modules];
    mods[mi] = { ...mod, steps };
    setCourse({ ...course, modules: mods });
    if (editingItem === itemId) setEditingItem(null);
  };

  // ---- Update titles ----
  const updateModuleTitle = (moduleId: string, title: string) => {
    setCourse({ ...course, modules: course.modules.map(m => m.id === moduleId ? { ...m, title } : m) });
  };

  const updateStepTitle = (moduleId: string, stepId: string, title: string) => {
    const mi = course.modules.findIndex(m => m.id === moduleId);
    const mod = course.modules[mi];
    const mods = [...course.modules];
    mods[mi] = { ...mod, steps: mod.steps.map(s => s.id === stepId ? { ...s, title } : s) };
    setCourse({ ...course, modules: mods });
  };

  // ---- Update item content ----
  const updateItem = (moduleId: string, stepId: string, itemId: string, updates: Partial<StepItem>) => {
    const mi = course.modules.findIndex(m => m.id === moduleId);
    const mod = course.modules[mi];
    const si = mod.steps.findIndex(s => s.id === stepId);
    const step = mod.steps[si];
    const steps = [...mod.steps];
    steps[si] = { ...step, items: step.items.map(i => i.id === itemId ? { ...i, ...updates } : i) };
    const mods = [...course.modules];
    mods[mi] = { ...mod, steps };
    setCourse({ ...course, modules: mods });
  };

  // ---- Questions ----
  const getTest = (moduleId: string, stepId: string, itemId: string) => {
    const mod = course.modules.find(m => m.id === moduleId)!;
    const step = mod.steps.find(s => s.id === stepId)!;
    return step.items.find(i => i.id === itemId) as TestContent;
  };

  const addQuestion = (moduleId: string, stepId: string, itemId: string) => {
    const test = getTest(moduleId, stepId, itemId);
    const q: TestQuestion = {
      id: generateId(),
      question: 'Новый вопрос',
      options: [
        { id: generateId(), text: 'Вариант 1', isCorrect: false },
        { id: generateId(), text: 'Вариант 2', isCorrect: false },
      ],
    };
    updateItem(moduleId, stepId, itemId, { questions: [...test.questions, q] } as Partial<TestContent>);
  };

  const updateQuestion = (moduleId: string, stepId: string, itemId: string, questionId: string, updates: Partial<TestQuestion>) => {
    const test = getTest(moduleId, stepId, itemId);
    const questions = test.questions.map(q => q.id === questionId ? { ...q, ...updates } : q);
    updateItem(moduleId, stepId, itemId, { questions } as Partial<TestContent>);
  };

  const deleteQuestion = (moduleId: string, stepId: string, itemId: string, questionId: string) => {
    const test = getTest(moduleId, stepId, itemId);
    updateItem(moduleId, stepId, itemId, {
      questions: test.questions.filter(q => q.id !== questionId),
    } as Partial<TestContent>);
  };

  // ---- Options ----
  const getQuestion = (moduleId: string, stepId: string, itemId: string, questionId: string) => {
    const test = getTest(moduleId, stepId, itemId);
    return test.questions.find(q => q.id === questionId)!;
  };

  const addOption = (moduleId: string, stepId: string, itemId: string, questionId: string) => {
    const q = getQuestion(moduleId, stepId, itemId, questionId);
    const option: TestOption = { id: generateId(), text: `Вариант ${q.options.length + 1}`, isCorrect: false };
    updateQuestion(moduleId, stepId, itemId, questionId, { options: [...q.options, option] });
  };

  const updateOption = (moduleId: string, stepId: string, itemId: string, questionId: string, optionId: string, updates: Partial<TestOption>) => {
    const q = getQuestion(moduleId, stepId, itemId, questionId);
    updateQuestion(moduleId, stepId, itemId, questionId, {
      options: q.options.map(o => o.id === optionId ? { ...o, ...updates } : o),
    });
  };

  const deleteOption = (moduleId: string, stepId: string, itemId: string, questionId: string, optionId: string) => {
    const q = getQuestion(moduleId, stepId, itemId, questionId);
    updateQuestion(moduleId, stepId, itemId, questionId, {
      options: q.options.filter(o => o.id !== optionId),
    });
  };

  // ---- Drag & Drop (модули) ----
  const handleModuleDragOver = (e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedModule || draggedModule === targetId) return;
    const di = course.modules.findIndex(m => m.id === draggedModule);
    const ti = course.modules.findIndex(m => m.id === targetId);
    const mods = [...course.modules];
    const [removed] = mods.splice(di, 1);
    mods.splice(ti, 0, removed);
    setCourse({ ...course, modules: mods });
  };

  // ---- Drag & Drop (шаги) ----
  const handleStepDragOver = (e: DragEvent<HTMLDivElement>, moduleId: string, targetStepId: string) => {
    e.preventDefault();
    if (!draggedStep || draggedStep.moduleId !== moduleId || draggedStep.stepId === targetStepId) return;
    const mi = course.modules.findIndex(m => m.id === moduleId);
    const mod = course.modules[mi];
    const di = mod.steps.findIndex(s => s.id === draggedStep.stepId);
    const ti = mod.steps.findIndex(s => s.id === targetStepId);
    const steps = [...mod.steps];
    const [removed] = steps.splice(di, 1);
    steps.splice(ti, 0, removed);
    const mods = [...course.modules];
    mods[mi] = { ...mod, steps };
    setCourse({ ...course, modules: mods });
  };

  // ---- Find item for editor ----
  const findItemContext = (itemId: string) => {
    for (const mod of course.modules) {
      for (const step of mod.steps) {
        const item = step.items.find(i => i.id === itemId);
        if (item) return { moduleId: mod.id, stepId: step.id, item };
      }
    }
    return null;
  };

  // ---- Render editor ----
  const renderItemEditor = (moduleId: string, stepId: string, item: StepItem) => {
    if (item.type === 'lesson') {
      return (
        <div className={styles.lessonEditor}>
          <div className={styles.editorHeader}>
            <input
              className={styles.editorTitle}
              value={item.title}
              onChange={e => updateItem(moduleId, stepId, item.id, { title: e.target.value })}
              placeholder="Название урока"
            />
            <button className={styles.closeEditor} onClick={() => setEditingItem(null)}>
              <X size={18} />
            </button>
          </div>
          <div className={styles.markdownEditor}>
            <div className={styles.editorPane}>
              <div className={styles.paneHeader}>Markdown</div>
              <textarea
                className={styles.markdownInput}
                value={item.content}
                onChange={e => updateItem(moduleId, stepId, item.id, { content: e.target.value })}
                placeholder="Введите содержимое в формате Markdown..."
              />
            </div>
            <div className={styles.previewPane}>
              <div className={styles.paneHeader}>Предпросмотр</div>
              <div className={styles.markdownPreview}>
                <ReactMarkdown>{item.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // test
    return (
      <div className={styles.testEditor}>
        <div className={styles.editorHeader}>
          <input
            className={styles.editorTitle}
            value={item.title}
            onChange={e => updateItem(moduleId, stepId, item.id, { title: e.target.value })}
            placeholder="Название теста"
          />
          <button className={styles.closeEditor} onClick={() => setEditingItem(null)}>
            <X size={18} />
          </button>
        </div>

        {item.questions.length > 1 && (
          <div className={styles.passingPercent}>
            <label>Проходной балл:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={item.passingPercent}
              onChange={e => updateItem(moduleId, stepId, item.id, { passingPercent: Number(e.target.value) } as Partial<TestContent>)}
            />
            <span>%</span>
          </div>
        )}

        <div className={styles.questionsList}>
          {item.questions.map((q, qi) => (
            <div key={q.id} className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <span className={styles.questionNum}>Вопрос {qi + 1}</span>
                {item.questions.length > 1 && (
                  <button className={styles.deleteQuestionBtn} onClick={() => deleteQuestion(moduleId, stepId, item.id, q.id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input
                className={styles.questionInput}
                value={q.question}
                onChange={e => updateQuestion(moduleId, stepId, item.id, q.id, { question: e.target.value })}
                placeholder="Введите вопрос..."
              />
              <div className={styles.optionsList}>
                {q.options.map(opt => (
                  <div key={opt.id} className={styles.optionItem}>
                    <button
                      className={`${styles.correctToggle} ${opt.isCorrect ? styles.correct : ''}`}
                      onClick={() => updateOption(moduleId, stepId, item.id, q.id, opt.id, { isCorrect: !opt.isCorrect })}
                    >
                      <Check size={14} />
                    </button>
                    <input
                      className={styles.optionInput}
                      value={opt.text}
                      onChange={e => updateOption(moduleId, stepId, item.id, q.id, opt.id, { text: e.target.value })}
                      placeholder="Вариант ответа..."
                    />
                    {q.options.length > 2 && (
                      <button className={styles.deleteOptionBtn} onClick={() => deleteOption(moduleId, stepId, item.id, q.id, opt.id)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className={styles.addOptionBtn} onClick={() => addOption(moduleId, stepId, item.id, q.id)}>
                <Plus size={14} />
                Добавить вариант
              </button>
            </div>
          ))}
        </div>

        <button className={styles.addQuestionBtn} onClick={() => addQuestion(moduleId, stepId, item.id)}>
          <Plus size={16} />
          Добавить вопрос
        </button>
      </div>
    );
  };

  const editingContext = editingItem ? findItemContext(editingItem) : null;

  return (
    <div className={styles.builder}>
      <header className={styles.header}>
        <h1 className={styles.title}>Создание курса</h1>
        <button className={styles.saveBtn} onClick={() => void handleSave()} disabled={isSaving || !course.title.trim()}>
          {isSaving ? 'Сохраняем...' : 'Сохранить курс'}
        </button>
      </header>

      <div className={styles.builderContent}>
        {/* Левая панель — структура курса */}
        <div className={styles.structurePanel}>
          <div className={styles.courseInfo}>
            <div className={styles.field}>
              <label className={styles.label}>Название курса</label>
              <input
                className={styles.input}
                placeholder="Введите название курса"
                value={course.title}
                onChange={e => setCourse({ ...course, title: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Описание</label>
              <textarea
                className={styles.textarea}
                placeholder="Краткое описание курса"
                rows={2}
                value={course.description}
                onChange={e => setCourse({ ...course, description: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Тип курса</label>
              <select
                className={styles.input}
                value={course.courseType}
                onChange={e => setCourse({ ...course, courseType: e.target.value as CourseType })}
              >
                {(Object.entries(COURSE_TYPE_LABELS) as [CourseType, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <section className={styles.modulesSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Структура курса</h2>
              <button className={styles.addBtn} onClick={addModule}>
                <Plus size={16} /> Модуль
              </button>
            </div>

            <div className={styles.modulesList}>
              {course.modules.length === 0 ? (
                <div className={styles.emptyState}>Добавьте первый модуль</div>
              ) : (
                course.modules.map(mod => (
                  <div
                    key={mod.id}
                    className={`${styles.moduleCard} ${draggedModule === mod.id ? styles.dragging : ''}`}
                    draggable
                    onDragStart={() => setDraggedModule(mod.id)}
                    onDragOver={e => handleModuleDragOver(e, mod.id)}
                    onDragEnd={() => setDraggedModule(null)}
                  >
                    <div className={styles.moduleHeader}>
                      <div className={styles.dragHandle}><GripVertical size={16} /></div>
                      <button className={styles.expandBtn} onClick={() => toggleModule(mod.id)}>
                        {expandedModules.has(mod.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <input
                        className={styles.moduleTitle}
                        value={mod.title}
                        onChange={e => updateModuleTitle(mod.id, e.target.value)}
                      />
                      <span className={styles.badge}>{mod.steps.length}</span>
                      <button className={styles.deleteBtn} onClick={() => deleteModule(mod.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {expandedModules.has(mod.id) && (
                      <div className={styles.moduleContent}>
                        <div className={styles.stepsList}>
                          {mod.steps.map(step => (
                            <div
                              key={step.id}
                              className={`${styles.stepCard} ${draggedStep?.stepId === step.id ? styles.dragging : ''}`}
                              draggable
                              onDragStart={e => { e.stopPropagation(); setDraggedStep({ moduleId: mod.id, stepId: step.id }); }}
                              onDragOver={e => handleStepDragOver(e, mod.id, step.id)}
                              onDragEnd={() => setDraggedStep(null)}
                            >
                              <div className={styles.stepHeader}>
                                <div className={styles.dragHandle}><GripVertical size={14} /></div>
                                <button className={styles.expandBtn} onClick={() => toggleStep(step.id)}>
                                  {expandedSteps.has(step.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                                <input
                                  className={styles.stepTitle}
                                  value={step.title}
                                  onChange={e => updateStepTitle(mod.id, step.id, e.target.value)}
                                />
                                <span className={styles.badgeSmall}>{step.items.length}</span>
                                <button className={styles.deleteBtnSmall} onClick={() => deleteStep(mod.id, step.id)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {expandedSteps.has(step.id) && (
                                <div className={styles.stepContent}>
                                  <div className={styles.itemsList}>
                                    {step.items.map(item => (
                                      <div
                                        key={item.id}
                                        className={`${styles.itemCard} ${editingItem === item.id ? styles.active : ''}`}
                                        onClick={() => setEditingItem(item.id)}
                                      >
                                        <div className={styles.itemIcon}>
                                          {item.type === 'lesson' ? <BookOpen size={14} /> : <FileQuestion size={14} />}
                                        </div>
                                        <span className={styles.itemTitle}>{item.title}</span>
                                        <span className={styles.itemType}>{item.type === 'lesson' ? 'Урок' : 'Тест'}</span>
                                        <button
                                          className={styles.deleteBtnSmall}
                                          onClick={e => { e.stopPropagation(); deleteItem(mod.id, step.id, item.id); }}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className={styles.addItemBtns}>
                                    <button className={styles.addItemBtn} onClick={() => addItem(mod.id, step.id, 'lesson')}>
                                      <BookOpen size={14} /> Урок
                                    </button>
                                    <button className={styles.addItemBtn} onClick={() => addItem(mod.id, step.id, 'test')}>
                                      <FileQuestion size={14} /> Тест
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <button className={styles.addStepBtn} onClick={() => addStep(mod.id)}>
                          <Plus size={14} /> Добавить шаг
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Правая панель — редактор урока/теста */}
        <div className={styles.editorPanel}>
          {editingContext ? (
            renderItemEditor(editingContext.moduleId, editingContext.stepId, editingContext.item)
          ) : (
            <div className={styles.editorEmpty}>
              <BookOpen size={48} strokeWidth={1} />
              <p>Выберите урок или тест для редактирования</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
