import { z } from 'zod';

// ================================================================
// Zod-схемы: runtime-валидация ответов API
// ================================================================
//
// Используются на границе с бэкендом — парсим JSON через `Schema.parse(data)`
// внутри queryFn. Если бэкенд переименует поле, ошибка вылезет сразу
// в dev, а не молча сломается в проде.
//
// Шаблон использования:
//   const data = await api.get('/courses').then(r => CourseSchema.array().parse(r.data));
//
// Заглушки ниже — заполнить по факту согласования контракта с бэкендом.

// ── Auth ─────────────────────────────────────────────────────────
export const UserAvatarSchema = z.object({
  id:       z.string(),
  name:     z.string(),
  isSystem: z.boolean(),
  bgColor:  z.string().optional(),
  url:      z.string().optional(),
});

export const EmployeeRoleSchema = z.enum([
  'admin',
  'department_head',
  'division_head',
  'senior_manager',
  'manager',
]);

export const EmployeeProfileSchema = z.object({
  id: z.string(),
  department: z.object({ id: z.string(), name: z.string() }),
  division:   z.object({ id: z.string(), name: z.string(), departmentId: z.string() }),
  position:   z.object({ id: z.string(), name: z.string() }),
  role:       z.object({ id: z.string(), name: EmployeeRoleSchema }),
  birthDate:      z.string(),
  employmentDate: z.string(),
});

export const UserSchema = z.object({
  id:       z.string(),
  email:    z.string().email(),
  fullname: z.string().nullable(),
  type:     z.literal('EMPLOYEE'),
  avatar:   UserAvatarSchema.optional(),
  employee: EmployeeProfileSchema.optional(),
});

export type ApiUser = z.infer<typeof UserSchema>;

// ── Courses ──────────────────────────────────────────────────────
export const CourseStatusSchema = z.enum(['draft', 'pending', 'published', 'archived']);
export const CourseTypeSchema   = z.enum(['employee', 'all']);
export const EnrollmentStatusSchema = z.enum([
  'not_enrolled', 'pending_approval', 'in_progress', 'completed', 'rejected',
]);

export const CourseSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  authorId: z.string(),
  status: CourseStatusSchema,
  courseType: CourseTypeSchema,
  createdAt: z.string(),
  lessonsCount: z.number(),
  targetDepartmentId:   z.string().nullable().optional(),
  targetDepartmentName: z.string().nullable().optional(),
  targetDivisionId:     z.string().nullable().optional(),
  targetDivisionName:   z.string().nullable().optional(),
});

export const EnrollmentSchema = z.object({
  courseId: z.string(),
  userId:   z.string(),
  status:   EnrollmentStatusSchema,
  progress: z.number().min(0).max(100),
  completedItems: z.array(z.string()),
  enrolledAt: z.string().optional(),
  assignedBy: z.string().optional(),
});

export type ApiCourse     = z.infer<typeof CourseSummarySchema>;
export type ApiEnrollment = z.infer<typeof EnrollmentSchema>;
