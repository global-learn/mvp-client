// ================================================================
// Типы для контента курса (Builder + Player)
// ================================================================

export interface TestOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: TestOption[];
}

export interface LessonContent {
  id: string;
  title: string;
  type: 'lesson';
  content: string; // markdown
}

export interface TestContent {
  id: string;
  title: string;
  type: 'test';
  questions: TestQuestion[];
  passingPercent: number; // минимальный % для прохождения
}

// Дискриминированное объединение — TypeScript определяет тип по полю `type`
export type StepItem = LessonContent | TestContent;

export interface Step {
  id: string;
  title: string;
  items: StepItem[];
}

export interface Module {
  id: string;
  title: string;
  steps: Step[];
}

// ================================================================
// Типы для API (список курсов, записи)
// ================================================================

export type CourseStatus = 'draft' | 'published' | 'archived';

export type EnrollmentStatus = 'not_enrolled' | 'in_progress' | 'completed';

export interface Course {
  id: string;
  title: string;
  description: string;
  authorId: string;
  status: CourseStatus;
  createdAt: string;
  lessonsCount: number;
  modules?: Module[]; // опционально — загружается при открытии курса
}

// Запись пользователя на курс
export interface Enrollment {
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  progress: number;           // 0-100, вычисляется из completedLessonCount
  completedLessonCount: number; // сколько уроков пройдено
}

export type CreateCourseDto = Omit<Course, 'id' | 'createdAt'>;

// Сотрудник для назначения курса
export interface EmployeeForAssignment {
  userId: string;
  fullname: string | null;
  email: string;
  role: { id: string; name: string };
  department: { id: string; name: string };
}
