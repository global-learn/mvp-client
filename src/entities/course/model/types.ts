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
  testId?: string;        // backend test-definition ID for lazy loading
}

// Дискриминированное объединение — TypeScript определяет тип по полю `type`
export type StepItem = LessonContent | TestContent;

export interface Step {
  id: string;
  title: string;
  items: StepItem[];
  type: 'lesson' | 'test';
  isCompleted?: boolean;
}

export interface Module {
  id: string;
  title: string;
  steps: Step[];
  completedSteps?: number;
  totalSteps?: number;
}

// ================================================================
// Типы для API (список курсов, записи)
// ================================================================

export type CourseStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';

export type EnrollmentStatus = 'not_enrolled' | 'pending_approval' | 'in_progress' | 'completed' | 'rejected';

// Кому предназначен курс — используется для фильтрации в списке курсов
export type CourseType = 'employee' | 'all';

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  all:      'Для всех',
  employee: 'Для сотрудников',
};

export interface Course {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName?: string;
  coverId?: string;
  status: CourseStatus;
  /** Причина отклонения (заполнена, когда status === 'rejected') */
  reviewNote?: string | null;
  courseType: CourseType;
  createdAt: string;
  lessonsCount: number;
  moduleCount?: number; // from list summary (when modules[] not available)
  modules?: Module[]; // опционально — загружается при открытии курса
  /** Если задан — курс предназначен конкретному департаменту */
  targetDepartmentId?: string | null;
  targetDepartmentName?: string | null;
  /** Если задан — курс предназначен конкретному отделу */
  targetDivisionId?: string | null;
  targetDivisionName?: string | null;
  /** Прогресс прохождения, встроенный в ответ списка курсов — используется как primary source */
  embeddedEnrollment?: {
    enrollmentId: string;
    status: string;
    progress: number;      // 0-100
    completedSteps: number;
    totalSteps: number;
    completedAt?: string | null;
  };
}

// Запись пользователя на курс
export interface Enrollment {
  id?: string;              // backend enrollment ID (needed for step mutations)
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  progress: number;        // 0-100
  completedItems: string[]; // id пройденных шагов
  enrolledAt?: string;     // ISO — когда создана запись
  assignedBy?: string;     // userId того, кто назначил (если не сам)
}

// ── Утилиты для курсового плеера ────────────────────────
/** Все StepItem из всех модулей курса (плоский список) */
export function getAllItems(course: Course): StepItem[] {
  return (course.modules ?? []).flatMap(m => m.steps.flatMap(s => s.items));
}

/** Вычислить прогресс (0-100) по числу пройденных элементов */
export function calcProgress(course: Course, completedItems: string[]): number {
  const total = getAllItems(course).length;
  if (total === 0) return 0;
  return Math.round((completedItems.length / total) * 100);
}

export type CreateCourseDto = Omit<Course, 'id' | 'createdAt'>;

// ── Сотрудник для назначения курса ──────────────────────────────
export interface EmployeeForAssignment {
  userId: string;
  fullname: string;
  email?: string;
  division:   { id: string; name: string };
  department: { id: string; name: string };
  role: { name: string };
}

// ── Заявка на прохождение курса (требует одобрения) ──────────────
export interface EnrollmentRequest {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedAt: string;
}

// ── Сертификат о прохождении курса ──────────────────────────────
export interface Certificate {
  id:           string;
  enrollmentId: string;
  employeeId:   string;
  employeeName: string;
  courseId:     string;
  courseName:   string;
  issuedAt:     string;
  /** Presigned URL of the generated PDF (when issued) */
  fileUrl?:     string | null;
}
