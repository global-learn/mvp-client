import { z } from 'zod';

// ================================================================
// Zod-схемы: runtime-валидация ответов API
// ================================================================
//
// Два слоя:
//   1. Backend DTOs — прямые зеркала swagger-контракта (префикс Dto).
//      Используются внутри *Api.ts для парсинга сырых ответов.
//   2. Frontend schemas — составные типы для UI (без префикса).
//      Могут агрегировать несколько DTO или добавлять вычисляемые поля.
//
// Шаблон использования:
//   const data = await api.get('/departments').then(r => paginatedSchema(DepartmentDtoSchema).parse(r.data));

// ── Общие ────────────────────────────────────────────────────────

export const IdResponseSchema = z.object({
  id: z.string(),
});

export const paginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    count: z.number(),
    limit: z.number(),
    page:  z.number(),
    data:  z.array(itemSchema),
  });

export type IdResponse = z.infer<typeof IdResponseSchema>;

// ── Auth / User (Backend DTOs) ───────────────────────────────────

export const MeResponseDtoSchema = z.object({
  id:        z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  email:     z.string().email(),
  role:      z.string(),
});

export type MeResponseDto = z.infer<typeof MeResponseDtoSchema>;

export const UserDtoSchema = z.object({
  id:        z.string(),
  createdAt: z.string(),
  email:     z.string().email(),
  roleId:    z.string(),
});

export const LoginRequestSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(4).max(30),
});

export const RegisterRequestSchema = z.object({
  email:          z.string().email(),
  password:       z.string().min(4).max(30),
  roleId:         z.string().uuid(),
  fullname:       z.string().min(1).max(255),
  divisionId:     z.string().uuid(),
  employmentDate: z.string(),
  positionId:     z.string().uuid().optional(),
});

export const CompleteRegistrationSchema = z.object({
  email:       z.string().email(),
  newPassword: z.string().min(4).max(30),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(4).max(30),
  newPassword: z.string().min(4).max(30),
});

export type UserDto = z.infer<typeof UserDtoSchema>;

// ── Departments ──────────────────────────────────────────────────

export const DepartmentDtoSchema = z.object({
  id:        z.string(),
  createdAt: z.string(),
  name:      z.string(),
});

export type DepartmentDto = z.infer<typeof DepartmentDtoSchema>;

// ── Divisions ────────────────────────────────────────────────────

export const DivisionDtoSchema = z.object({
  id:           z.string(),
  createdAt:    z.string(),
  name:         z.string(),
  departmentId: z.string(),
});

export type DivisionDto = z.infer<typeof DivisionDtoSchema>;

// ── Positions ────────────────────────────────────────────────────

export const PositionDtoSchema = z.object({
  id:        z.string(),
  createdAt: z.string(),
  name:      z.string(),
  parentId:  z.string().nullable().optional(),
});

export type PositionDto = z.infer<typeof PositionDtoSchema>;

export type PositionTreeDto = {
  id:       string;
  name:     string;
  parentId?: string | null | undefined;
  children: PositionTreeDto[];
};

export const PositionTreeDtoSchema: z.ZodType<PositionTreeDto> = z.lazy(() =>
  z.object({
    id:       z.string(),
    name:     z.string(),
    parentId: z.string().nullable().optional(),
    children: z.array(PositionTreeDtoSchema),
  }),
);

// ── Employees ────────────────────────────────────────────────────

export const EmployeeDtoSchema = z.object({
  id:             z.string(),
  createdAt:      z.string(),
  fullname:       z.string(),
  biography:      z.string().nullable().optional(),
  employmentDate: z.string(),
  dismissalDate:  z.string().nullable().optional(),
  divisionId:     z.string(),
  positionId:     z.string().nullable().optional(),
  avatarId:       z.string().nullable().optional(),
});

export type EmployeeDto = z.infer<typeof EmployeeDtoSchema>;

// ── Onboarding templates ─────────────────────────────────────────

export const OnboardingStepTypeDtoSchema = z.enum(['TEXT', 'COURSE']);

export const OnboardingFeedbackOptionDtoSchema = z.object({
  label: z.string(),
});

export const CreateOnboardingStepRequestSchema = z.object({
  position:                   z.number().min(1),
  name:                       z.string().min(1).max(255),
  description:                z.string(),
  type:                       OnboardingStepTypeDtoSchema,
  courseId:                   z.string().uuid().optional(),
  recommendedStartOffsetDays: z.number().min(0),
  recommendedEndOffsetDays:   z.number().min(0),
  coverId:                    z.string().uuid().optional(),
  feedbackOptions:            z.array(OnboardingFeedbackOptionDtoSchema).default([]),
});

export const CreateOnboardingTemplateRequestSchema = z.object({
  name:        z.string().min(1).max(255),
  description: z.string(),
  positionId:  z.string().uuid(),
  divisionId:  z.string().uuid(),
  coverId:     z.string().uuid().optional(),
  steps:       z.array(CreateOnboardingStepRequestSchema).min(1),
});

export type CreateOnboardingTemplateRequest = z.infer<typeof CreateOnboardingTemplateRequestSchema>;

// ── Onboarding assignments ───────────────────────────────────────

export const AssignOnboardingRequestSchema = z.object({
  templateId:          z.string().uuid(),
  assignedToId:        z.string().uuid(),
  startDate:           z.string(),
  endDate:             z.string(),
  nameOverride:        z.string().min(1).max(255).optional(),
  descriptionOverride: z.string().optional(),
});

export type AssignOnboardingRequest = z.infer<typeof AssignOnboardingRequestSchema>;

export const CompleteOnboardingStepRequestSchema = z.object({
  stepId:            z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  feedbackText:      z.string().optional(),
});

export type CompleteOnboardingStepRequest = z.infer<typeof CompleteOnboardingStepRequestSchema>;

export const SendOnboardingChatMessageRequestSchema = z.object({
  body: z.string().min(1).max(4000),
});

export type SendOnboardingChatMessageRequest = z.infer<typeof SendOnboardingChatMessageRequestSchema>;

// ── Frontend schemas (составные, для UI) ─────────────────────────

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
  id:             z.string(),
  department:     z.object({ id: z.string(), name: z.string() }),
  division:       z.object({ id: z.string(), name: z.string(), departmentId: z.string() }),
  position:       z.object({ id: z.string(), name: z.string() }).optional(),
  role:           z.object({ id: z.string(), name: EmployeeRoleSchema }),
  birthDate:      z.string().optional(),
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

// ── Courses (backend не реализован — схемы-заглушки) ─────────────

export const CourseStatusSchema     = z.enum(['draft', 'pending', 'published', 'archived']);
export const CourseTypeSchema       = z.enum(['employee', 'all']);
export const EnrollmentStatusSchema = z.enum([
  'not_enrolled', 'pending_approval', 'in_progress', 'completed', 'rejected',
]);

export const CourseSummarySchema = z.object({
  id:                   z.string(),
  title:                z.string(),
  description:          z.string(),
  authorId:             z.string(),
  status:               CourseStatusSchema,
  courseType:           CourseTypeSchema,
  createdAt:            z.string(),
  lessonsCount:         z.number(),
  targetDepartmentId:   z.string().nullable().optional(),
  targetDepartmentName: z.string().nullable().optional(),
  targetDivisionId:     z.string().nullable().optional(),
  targetDivisionName:   z.string().nullable().optional(),
});

export const EnrollmentSchema = z.object({
  courseId:       z.string(),
  userId:         z.string(),
  status:         EnrollmentStatusSchema,
  progress:       z.number().min(0).max(100),
  completedItems: z.array(z.string()),
  enrolledAt:     z.string().optional(),
  assignedBy:     z.string().optional(),
});

export type ApiCourse     = z.infer<typeof CourseSummarySchema>;
export type ApiEnrollment = z.infer<typeof EnrollmentSchema>;
