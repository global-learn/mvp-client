import { useUser } from '@entities/user/model/UserContext';
import { CourseList } from '@widgets/course-list/ui/CourseList';
import { CreateCourseButton } from '@features/create-course/ui/CreateCourseButton';

// Page "Список курсов" — /courses
// ---------------------------------------------------------------
// Page — самый ТОНКИЙ слой. Только компонует блоки.
// Никакой бизнес-логики, никаких запросов — всё это в слоях ниже.
//
// Эта страница собирает:
//   - виджет CourseList (список курсов)
//   - фичу CreateCourseButton (кнопка "создать", видна только admin)

export function CoursesListPage() {
  const { user, switchUser } = useUser();

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
      {/* Шапка */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 36,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1a202c' }}>Курсы</h1>
          <p style={{ margin: '6px 0 0', color: '#718096', fontSize: 14 }}>
            Портал обучения Global Learn
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Переключатель пользователей — только для демо, удалить после auth */}
          <button
            onClick={switchUser}
            title="Нажми для смены роли (только для демо)"
            style={{
              padding: '8px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              background: '#f7fafc',
              cursor: 'pointer',
              fontSize: 13,
              color: '#4a5568',
            }}
          >
            👤 {user.name} ({user.role}) ↻
          </button>

          {/* CreateCourseButton сам решает показываться или нет (проверяет role) */}
          <CreateCourseButton />
        </div>
      </div>

      {/* Список курсов */}
      <CourseList />
    </div>
  );
}
