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

// Кому предназначен курс — используется для фильтрации в списке курсов
export type CourseType = 'employee' | 'client' | 'all';

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  all:      'Для всех',
  employee: 'Для сотрудников',
  client:   'Для клиентов',
};

export interface Course {
  id: string;
  title: string;
  description: string;
  authorId: string;
  status: CourseStatus;
  courseType: CourseType;
  createdAt: string;
  lessonsCount: number;
  modules?: Module[]; // опционально — загружается при открытии курса
}

// Запись пользователя на курс
export interface Enrollment {
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  progress: number;           // 0-100
  completedStepIds: string[]; // ID пройденных шагов (Step.id)
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
