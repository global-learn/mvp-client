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
  email:          z.string(),
  role:           z.object({ id: z.string(), name: z.string() }),
  department:     z.object({ id: z.string(), name: z.string() }),
});

export type EmployeeDto = z.infer<typeof EmployeeDtoSchema>;

// ── Auth — /auth/me/profile ──────────────────────────────────────

export const MyProfileResponseDtoSchema = z.object({
  id:        z.string(),
  createdAt: z.string(),
  email:     z.string(),
  role:      z.object({ id: z.string(), name: z.string() }),
  employee:  z.object({
    id:             z.string(),
    fullname:       z.string(),
    biography:      z.string().nullable().optional(),
    employmentDate: z.string(),
    dismissalDate:  z.string().nullable().optional(),
    avatarId:       z.string().nullable().optional(),
    division: z.object({
      id:         z.string(),
      name:       z.string(),
      department: z.object({ id: z.string(), name: z.string() }),
    }),
    position: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
  }).nullable().optional(),
});

export type MyProfileResponseDto = z.infer<typeof MyProfileResponseDtoSchema>;

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

// ── Courses (backend DTOs) ────────────────────────────────────────

// Scope info — returned in both summary and full course responses
export const CourseScopeInfoDtoSchema = z.object({
  scope:          z.enum(['ALL', 'DEPARTMENT', 'DIVISION']),
  departmentId:   z.string().optional().nullable(),
  departmentName: z.string().optional().nullable(),
  divisionId:     z.string().optional().nullable(),
  divisionName:   z.string().optional().nullable(),
});
export type CourseScopeInfoDto = z.infer<typeof CourseScopeInfoDtoSchema>;

// Inline enrollment progress embedded in course list/detail
export const CourseEnrollmentProgressDtoSchema = z.object({
  enrollmentId:   z.string(),
  status:         z.string(),
  completedSteps: z.number(),
  totalSteps:     z.number(),
  completionRate: z.number(),
  completedAt:    z.string().optional().nullable(),
});
export type CourseEnrollmentProgressDto = z.infer<typeof CourseEnrollmentProgressDtoSchema>;

export const CourseStepDtoSchema = z.object({
  id:            z.string(),
  name:          z.string(),
  position:      z.number(),
  type:          z.enum(['LESSON', 'TEST']),
  lessonId:      z.string().optional(),
  lessonContent: z.string().optional(),
  testId:        z.string().optional(),
  isCompleted:   z.boolean().optional().default(false),
});

export const CourseModuleDtoSchema = z.object({
  id:             z.string(),
  name:           z.string(),
  position:       z.number(),
  steps:          z.array(CourseStepDtoSchema),
  completedSteps: z.number().optional(),
  totalSteps:     z.number().optional(),
});

// GET /courses — summary list (no modules array, has moduleCount)
export const CourseSummaryDtoSchema = z.object({
  id:          z.string(),
  createdAt:   z.string(),
  updatedAt:   z.string().optional(),
  name:        z.string(),
  description: z.string(),
  authorId:    z.string(),
  coverId:     z.string().optional().nullable(),
  scopeInfo:   CourseScopeInfoDtoSchema.optional(),
  moduleCount: z.number().optional(),
  enrollment:  CourseEnrollmentProgressDtoSchema.optional().nullable(),
});
export type CourseSummaryDto = z.infer<typeof CourseSummaryDtoSchema>;

// GET /courses/:id — full course with modules
export const CourseDtoSchema = z.object({
  id:             z.string(),
  createdAt:      z.string(),
  updatedAt:      z.string().optional(),
  name:           z.string(),
  description:    z.string(),
  authorId:       z.string(),
  coverId:        z.string().optional().nullable(),
  scopeInfo:      CourseScopeInfoDtoSchema.optional(),
  modules:        z.array(CourseModuleDtoSchema).default([]),
  totalSteps:     z.number().optional(),
  completedSteps: z.number().optional(),
  enrollment:     CourseEnrollmentProgressDtoSchema.optional().nullable(),
});

export const StepProgressDtoSchema = z.object({
  id:          z.string(),
  stepId:      z.string(),
  createdAt:   z.string(),
  completedAt: z.string().optional(),
});

export const EnrollmentDtoSchema = z.object({
  id:           z.string(),
  createdAt:    z.string(),
  updatedAt:    z.string().optional(),
  courseId:     z.string(),
  employeeId:   z.string(),
  assignedById: z.string().optional(),
  status:       z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  startedAt:    z.string(),
  completedAt:  z.string().optional(),
  // /me/enrollments returns EnrollmentSummaryResponseDto without progress; default to []
  progress:     z.array(StepProgressDtoSchema).default([]),
});

export type CourseDto      = z.infer<typeof CourseDtoSchema>;
export type EnrollmentDto  = z.infer<typeof EnrollmentDtoSchema>;

// ── Course applications ───────────────────────────────────────────

export const CourseApplicationDtoSchema = z.object({
  id:         z.string(),
  courseId:   z.string(),
  employeeId: z.string(),
  createdAt:  z.string(),
  status:     z.string().optional(),
});

export type CourseApplicationDto = z.infer<typeof CourseApplicationDtoSchema>;

// ── Test definitions ──────────────────────────────────────────────

export const CourseAnswerDtoSchema = z.object({
  id:        z.string(),
  answer:    z.string(),
  isCorrect: z.boolean(),
});

export const CourseQuestionDtoSchema = z.object({
  id:       z.string(),
  question: z.string(),
  courseId: z.string(),
  moduleId: z.string().optional(),
  answers:  z.array(CourseAnswerDtoSchema),
});

export const TestDefinitionDtoSchema = z.object({
  id:             z.string(),
  createdAt:      z.string(),
  name:           z.string(),
  passingPercent: z.number().default(80),
  questions:      z.array(CourseQuestionDtoSchema),
});

export type TestDefinitionDto = z.infer<typeof TestDefinitionDtoSchema>;

// ── Files ─────────────────────────────────────────────────────────

export const FileResponseDtoSchema = z.object({
  id:  z.string(),
  url: z.string(),
});

export type FileResponseDto = z.infer<typeof FileResponseDtoSchema>;

// ── Onboarding response DTOs (GET endpoints) ─────────────────────

export const OnboardingTemplateSummaryDtoSchema = z.object({
  id:          z.string(),
  createdAt:   z.string(),
  updatedAt:   z.string().optional(),
  name:        z.string(),
  description: z.string(),
  positionId:  z.string(),
  divisionId:  z.string(),
  coverId:     z.string().optional(),
  stepCount:   z.number(),
});

export const OnboardingTemplateFeedbackOptionDtoSchema = z.object({
  id:    z.string(),
  label: z.string(),
});

export const OnboardingTemplateStepDtoSchema = z.object({
  id:                         z.string(),
  position:                   z.number(),
  name:                       z.string(),
  description:                z.string(),
  type:                       z.enum(['TEXT', 'COURSE']),
  courseId:                   z.string().optional(),
  recommendedStartOffsetDays: z.number(),
  recommendedEndOffsetDays:   z.number(),
  coverId:                    z.string().optional(),
  feedbackOptions:            z.array(OnboardingTemplateFeedbackOptionDtoSchema),
});

export const OnboardingTemplateFullDtoSchema = z.object({
  id:          z.string(),
  createdAt:   z.string(),
  name:        z.string(),
  description: z.string(),
  positionId:  z.string(),
  divisionId:  z.string(),
  coverId:     z.string().optional(),
  steps:       z.array(OnboardingTemplateStepDtoSchema),
});

export const OnboardingAssignmentStepDtoSchema = z.object({
  id:                   z.string(),
  position:             z.number(),
  name:                 z.string(),
  description:          z.string(),
  type:                 z.enum(['TEXT', 'COURSE']),
  courseId:             z.string().optional(),
  recommendedStartDate: z.string(),
  recommendedEndDate:   z.string(),
  feedbackText:         z.string().optional(),
  completedAt:          z.string().optional(),
  feedbackOptions:      z.array(z.object({ id: z.string(), label: z.string() })),
  selectedOptionIds:    z.array(z.string()),
});

export const OnboardingAssignmentDtoSchema = z.object({
  id:           z.string(),
  createdAt:    z.string(),
  name:         z.string(),
  description:  z.string(),
  templateId:   z.string().optional(),
  assignedById: z.string(),
  assignedToId: z.string(),
  status:       z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  startDate:    z.string(),
  endDate:      z.string(),
  completedAt:  z.string().optional(),
  steps:        z.array(OnboardingAssignmentStepDtoSchema),
});

export const OnboardingChatMessageDtoSchema = z.object({
  id:        z.string(),
  senderId:  z.string(),
  body:      z.string(),
  readAt:    z.string().optional(),
  createdAt: z.string(),
});

export type OnboardingTemplateSummaryDto  = z.infer<typeof OnboardingTemplateSummaryDtoSchema>;
export type OnboardingTemplateFullDto     = z.infer<typeof OnboardingTemplateFullDtoSchema>;
export type OnboardingAssignmentDto       = z.infer<typeof OnboardingAssignmentDtoSchema>;
export type OnboardingChatMessageDto      = z.infer<typeof OnboardingChatMessageDtoSchema>;

// ── Courses analytics ────────────────────────────────────────────

export const CoursesOverviewItemDtoSchema = z.object({
  courseId:         z.string(),
  courseName:       z.string(),
  totalEnrollments: z.number(),
  inProgress:       z.number(),
  completed:        z.number(),
  cancelled:        z.number(),
  completionRate:   z.number(),
});

export type CoursesOverviewItemDto = z.infer<typeof CoursesOverviewItemDtoSchema>;

// ── Notifications ─────────────────────────────────────────────────

export const NotificationDtoSchema = z.object({
  id:        z.string(),
  type:      z.string(),
  payload:   z.unknown().optional(),
  readAt:    z.string().optional().nullable(),
  createdAt: z.string(),
});

export type NotificationDto = z.infer<typeof NotificationDtoSchema>;

// ── Roles ─────────────────────────────────────────────────────────

export const RoleDtoSchema = z.object({
  id:        z.string(),
  name:      z.string(),
  createdAt: z.string(),
});

export type RoleDto = z.infer<typeof RoleDtoSchema>;

// ── Test attempts ─────────────────────────────────────────────────

export const TestAttemptResultSchema = z.object({
  correct:  z.number(),
  total:    z.number(),
  score:    z.number(),
  isPassed: z.boolean(),
});

export type TestAttemptResult = z.infer<typeof TestAttemptResultSchema>;

// ── Courses (frontend-facing schemas, kept for backwards compat) ──

export const CourseStatusSchema     = z.enum(['draft', 'pending', 'published', 'archived']);
export const CourseTypeSchema       = z.enum(['employee', 'all']);
export const EnrollmentStatusSchema = z.enum([
  'not_enrolled', 'pending_approval', 'in_progress', 'completed', 'rejected',
]);
