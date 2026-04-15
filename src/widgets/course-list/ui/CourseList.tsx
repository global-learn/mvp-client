import { useCourses } from '@entities/course/model/CoursesContext';
import { CourseCard } from '@entities/course/ui/CourseCard';

// Widget "Список курсов"
// ---------------------------------------------------------------
// Widget — крупный самодостаточный блок страницы.
// Отличие от entity-компонента: виджет сам забирает данные из контекста,
// а не получает их через пропсы. Страница вставляет <CourseList /> без пропсов.
//
// Иерархия: Widget > Feature > Entity > Shared
// Widget может использовать Feature и Entity, но НЕ наоборот.

export function CourseList() {
  const { courses, getEnrollment, isLoading } = useCourses();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#a0aec0', fontSize: 15 }}>
        Загрузка курсов...
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#a0aec0', fontSize: 15 }}>
        Курсов пока нет. Создайте первый!
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
      }}
    >
      {courses.map(course => (
        <CourseCard key={course.id} course={course} enrollment={getEnrollment(course.id)} />
      ))}
    </div>
  );
}
