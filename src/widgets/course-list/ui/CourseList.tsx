import { useCourses } from '@entities/course/model/CoursesContext';
import { CourseCard } from '@entities/course/ui/CourseCard';
import { useUser } from '@entities/user/model/UserContext';

// CourseList фильтрует курсы по courseType:
//   'all'      → видят все
//   'employee' → только EMPLOYEE
//   'client'   → только CLIENT

export function CourseList() {
  const { courses, getEnrollment, isLoading } = useCourses();
  const { user } = useUser();

  const visibleCourses = courses.filter(c => {
    if (c.courseType === 'all') return true;
    return c.courseType === user.type.toLowerCase();
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-foreground)', fontSize: 15 }}>
        Загрузка курсов...
      </div>
    );
  }

  if (visibleCourses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-foreground)', fontSize: 15 }}>
        {courses.length === 0 ? 'Курсов пока нет. Создайте первый!' : 'Нет доступных курсов.'}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
      {visibleCourses.map(course => (
        <CourseCard key={course.id} course={course} enrollment={getEnrollment(course.id)} />
      ))}
    </div>
  );
}
