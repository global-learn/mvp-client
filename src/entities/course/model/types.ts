export type CourseStatus = 'draft' | 'published' | 'archived';

export type EnrollmentStatus = 'not_enrolled' | 'in_progress' | 'completed';

export interface Course {
  id: string;
  title: string;
  description: string;
  authorId: string;    // id пользователя-создателя
  status: CourseStatus;
  createdAt: string;   // ISO date string: "2024-01-15"
  lessonsCount: number;
}

// Запись на курс — связывает пользователя с курсом.
// Один пользователь + один курс = одна запись.
export interface Enrollment {
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  progress: number; // 0-100, процент прохождения
}

// DTO = Data Transfer Object — данные которые отправляем на сервер при создании.
// Omit убирает поля которые генерирует сервер (id, createdAt).
export type CreateCourseDto = Omit<Course, 'id' | 'createdAt'>;
