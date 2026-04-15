import { CourseList } from '@widgets/course-list/ui/CourseList';
import { CreateCourseButton } from '@features/create-course/ui/CreateCourseButton';
import styles from './CoursesList.module.css';

// Page "Список курсов" — /courses
// Page — самый тонкий слой: только компонует виджеты и фичи.
// Никакой бизнес-логики, никаких запросов — всё это в слоях ниже.

export function CoursesListPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Курсы</h1>
          <p className={styles.subtitle}>Портал обучения Global Learn</p>
        </div>
        <CreateCourseButton />
      </div>

      <CourseList />
    </div>
  );
}
