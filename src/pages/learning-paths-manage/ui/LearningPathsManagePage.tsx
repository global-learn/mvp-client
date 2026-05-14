import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Trash2, Eye, Globe } from 'lucide-react';
import { useLearningPaths } from '@entities/learning-path/model/LearningPathContext';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, isDepartmentHead, isDivisionHead } from '@entities/user/model/types';
import type { LearningPath, LearningPathStep, PathTargetType } from '@entities/learning-path/model/types';
import { PATH_TARGET_LABELS } from '@entities/learning-path/model/types';
import styles from './LearningPathsManage.module.css';

// ── Создать трек — модальное окно ────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
}

function CreateModal({ onClose }: CreateModalProps) {
  const { createPath } = useLearningPaths();
  const { courses } = useCourses();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<PathTargetType>('all');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [steps, setSteps] = useState<LearningPathStep[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Доступные targetType по роли
  const availableTargets: PathTargetType[] = (() => {
    if (isAdmin(user)) return ['all', 'department', 'division', 'managers'];
    if (isDepartmentHead(user)) return ['department', 'division', 'managers'];
    if (isDivisionHead(user)) return ['division', 'managers'];
    return ['managers'];
  })();

  // Курсы (только employee + all — paths только для сотрудников)
  const availableCourses = courses.filter(c =>
    c.status === 'published' &&
    (c.courseType === 'employee' || c.courseType === 'all'),
  );

  const addCourse = () => {
    if (!selectedCourseId) return;
    if (steps.some(s => s.courseId === selectedCourseId)) return;
    const course = availableCourses.find(c => c.id === selectedCourseId)!;
    const newStep: LearningPathStep = {
      id: `step-${Date.now()}`,
      courseId: course.id,
      courseTitle: course.title,
      courseDescription: course.description,
      order: steps.length + 1,
    };
    setSteps(prev => [...prev, newStep]);
    setSelectedCourseId('');
  };

  const removeStep = (stepId: string) => {
    setSteps(prev =>
      prev
        .filter(s => s.id !== stepId)
        .map((s, i) => ({ ...s, order: i + 1 })),
    );
  };

  // Определяем department / division из роли пользователя для автозаполнения
  const emp = user.employee;

  const targetDeptId   = targetType === 'department' || targetType === 'division' || targetType === 'managers'
    ? (emp?.department.id ?? null) : null;
  const targetDeptName = targetDeptId ? (emp?.department.name ?? null) : null;
  const targetDivId    = targetType === 'division' || targetType === 'managers'
    ? (emp?.division.id ?? null) : null;
  const targetDivName  = targetDivId ? (emp?.division.name ?? null) : null;

  const handleSubmit = async (asDraft = false) => {
    if (!title.trim() || steps.length === 0) return;
    setSubmitting(true);
    await createPath({
      title: title.trim(),
      description: description.trim(),
      targetType,
      targetDepartmentId: targetDeptId,
      targetDepartmentName: targetDeptName,
      targetDivisionId: targetDivId,
      targetDivisionName: targetDivName,
      steps,
      status: asDraft ? 'draft' : 'published',
    });
    setSubmitting(false);
    onClose();
  };

  const unusedCourses = availableCourses.filter(c => !steps.some(s => s.courseId === c.id));

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Новый Learning Path</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <label className={styles.label}>
          Название *
          <input
            className={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Путь разработчика"
          />
        </label>

        <label className={styles.label}>
          Описание
          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Последовательный маршрут для..."
          />
        </label>

        <label className={styles.label}>
          Целевая аудитория
          <select className={styles.select} value={targetType} onChange={e => setTargetType(e.target.value as PathTargetType)}>
            {availableTargets.map(t => (
              <option key={t} value={t}>{PATH_TARGET_LABELS[t]}</option>
            ))}
          </select>
        </label>

        {(targetType === 'department' || targetType === 'division' || targetType === 'managers') && emp && (
          <div className={styles.label} style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
            Привязка: {targetType === 'department'
              ? emp.department.name
              : `${emp.department.name} → ${emp.division.name}${targetType === 'managers' ? ' (менеджеры)' : ''}`
            }
          </div>
        )}

        {/* Курсы в пути */}
        <div className={styles.coursesSection}>
          <div className={styles.coursesSectionTitle}>
            <span>Курсы в порядке прохождения *</span>
            <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              {steps.length} добавлено
            </span>
          </div>

          <div className={styles.coursesList}>
            {steps.map((step, i) => (
              <div key={step.id} className={styles.courseRow}>
                <span className={styles.courseRowNum}>{i + 1}</span>
                <span className={styles.courseRowTitle}>{step.courseTitle}</span>
                <button className={styles.courseRowDel} onClick={() => removeStep(step.id)}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.addCourseRow}>
            <select
              className={styles.addCourseSelect}
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
            >
              <option value="">Выбрать курс...</option>
              {unusedCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button
              className={styles.addCourseBtn}
              onClick={addCourse}
              disabled={!selectedCourseId}
            >
              <Plus size={14} /> Добавить
            </button>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
          <button
            className={styles.cancelBtn}
            onClick={() => void handleSubmit(true)}
            disabled={!title.trim() || steps.length === 0 || submitting}
          >
            Сохранить черновик
          </button>
          <button
            className={styles.submitBtn}
            onClick={() => void handleSubmit(false)}
            disabled={!title.trim() || steps.length === 0 || submitting}
          >
            {submitting ? 'Создаём...' : 'Опубликовать'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Строка пути ──────────────────────────────────────────────────
function PathRow({ path }: { path: LearningPath }) {
  const { publishPath, deletePath } = useLearningPaths();
  const [deleting, setDeleting] = useState(false);

  const targetStr = [
    PATH_TARGET_LABELS[path.targetType],
    path.targetDepartmentName,
    path.targetDivisionName,
  ].filter(Boolean).join(' · ');

  return (
    <div className={styles.pathCard}>
      <div className={styles.pathCardMain}>
        <div className={styles.pathCardTitle}>{path.title}</div>
        <div className={styles.pathCardMeta}>
          <span className={`${styles.statusBadge} ${path.status === 'published' ? styles.statusPublished : styles.statusDraft}`}>
            {path.status === 'published' ? 'Опубликован' : 'Черновик'}
          </span>
          <span className={styles.dot}>·</span>
          <span className={styles.targetBadge}>{targetStr}</span>
          <span className={styles.dot}>·</span>
          <span>{path.steps.length} курс{path.steps.length === 1 ? '' : path.steps.length < 5 ? 'а' : 'ов'}</span>
        </div>
      </div>

      <div className={styles.pathCardActions}>
        <Link to={`/learning-paths/${path.id}`} className={styles.viewBtn}>
          <Eye size={14} /> Смотреть
        </Link>
        {path.status === 'draft' && (
          <button className={styles.publishBtn} onClick={() => void publishPath(path.id)}>
            <Globe size={14} /> Опубликовать
          </button>
        )}
        <button
          className={styles.deleteBtn}
          disabled={deleting}
          onClick={async () => {
            if (!confirm('Удалить этот трек?')) return;
            setDeleting(true);
            await deletePath(path.id);
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Главная страница ─────────────────────────────────────────────
export function LearningPathsManagePage() {
  const { myPaths, isLoading } = useLearningPaths();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Управление треками</h1>
          <p className={styles.subtitle}>Создавайте последовательные маршруты обучения для сотрудников.</p>
        </div>
        <button className={styles.createBtn} onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Создать трек
        </button>
      </div>

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : myPaths.length === 0 ? (
        <div className={styles.empty}>Нет созданных треков</div>
      ) : (
        <div className={styles.list}>
          {myPaths.map(p => <PathRow key={p.id} path={p} />)}
        </div>
      )}

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
