import { useState, type FormEvent, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '@entities/course/model/CoursesContext';

// Widget "Форма создания курса"
// ---------------------------------------------------------------
// Виджет потому что знает:
//   1. Как создать курс (через useCourses)
//   2. Куда перейти после (через useNavigate)
// "Тупой" компонент (entity) получал бы эти данные через пропсы — тут логики больше.

export function CourseForm() {
  const { createCourse } = useCourses();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessonsCount, setLessonsCount] = useState(1);

  const handleSubmit = async (e: FormEvent) => {
    // preventDefault — отменяем стандартную отправку формы (перезагрузку страницы)
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createCourse({ title, description, lessonsCount });
      navigate('/courses'); // после создания — на список курсов
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={e => void handleSubmit(e)} style={{ maxWidth: 560 }}>
      <div style={field}>
        <label style={label}>Название курса</label>
        <input
          style={input}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Например: Введение в TypeScript"
          required
        />
      </div>

      <div style={field}>
        <label style={label}>Описание</label>
        <textarea
          style={{ ...input, height: 100, resize: 'vertical' }}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Что изучат сотрудники на этом курсе?"
          required
        />
      </div>

      <div style={field}>
        <label style={label}>Количество уроков</label>
        <input
          type="number"
          style={{ ...input, width: 120 }}
          value={lessonsCount}
          onChange={e => setLessonsCount(Number(e.target.value))}
          min={1}
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          marginTop: 8,
          padding: '12px 28px',
          borderRadius: 8,
          border: 'none',
          background: '#4299e1',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? 'Создание...' : 'Создать курс'}
      </button>
    </form>
  );
}

const field: CSSProperties = { marginBottom: 20 };

const label: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: '#4a5568',
  marginBottom: 6,
};

const input: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 15,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};
