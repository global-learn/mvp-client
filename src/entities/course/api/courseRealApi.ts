import { api } from '@shared/api/axios';
import {
  CourseDtoSchema,
  CourseApplicationDtoSchema,
  EnrollmentDtoSchema,
  FileResponseDtoSchema,
  IdResponseSchema,
  TestDefinitionDtoSchema,
  paginatedSchema,
  type CourseApplicationDto,
  type CourseDto,
  type EnrollmentDto,
  type FileResponseDto,
  type TestDefinitionDto,
} from '@shared/api/schemas';
import type { Course, Enrollment, EnrollmentStatus, Module, Step, StepItem, TestQuestion } from '../model/types';

// ── Mappers ──────────────────────────────────────────────────────

function mapStep(backendStep: CourseDto['modules'][number]['steps'][number]): Step {
  const item: StepItem =
    backendStep.type === 'TEST'
      ? { id: backendStep.id, title: backendStep.name, type: 'test', questions: [], passingPercent: 0, testId: backendStep.testId }
      : { id: backendStep.id, title: backendStep.name, type: 'lesson', content: backendStep.lessonContent ?? '' };

  return { id: backendStep.id, title: backendStep.name, items: [item] };
}

export function mapTestDefinitionToQuestions(dto: TestDefinitionDto): TestQuestion[] {
  return dto.questions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.answers.map(a => ({
      id:        a.id,
      text:      a.answer,
      isCorrect: a.isCorrect,
    })),
  }));
}

export function mapTestDefinitionPassingPercent(dto: TestDefinitionDto): number {
  return dto.passingPercent ?? 80;
}

function mapModule(backendModule: CourseDto['modules'][number]): Module {
  const steps = [...backendModule.steps]
    .sort((a, b) => a.position - b.position)
    .map(mapStep);
  return { id: backendModule.id, title: backendModule.name, steps };
}

export function mapCourse(dto: CourseDto): Course {
  const modules = [...dto.modules]
    .sort((a, b) => a.position - b.position)
    .map(mapModule);

  const lessonsCount = modules.reduce(
    (total, m) => total + m.steps.reduce((s, step) => s + step.items.length, 0),
    0,
  );

  return {
    id:          dto.id,
    title:       dto.name,
    description: dto.description,
    authorId:    dto.authorId,
    status:      'published',
    courseType:  'all',
    createdAt:   dto.createdAt,
    lessonsCount,
    modules,
  };
}

function mapEnrollmentStatus(status: EnrollmentDto['status']): EnrollmentStatus {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED') return 'rejected';
  return 'in_progress';
}

export function mapEnrollmentDto(dto: EnrollmentDto, totalSteps: number): Enrollment {
  const completedItems = dto.progress
    .filter(p => p.completedAt)
    .map(p => p.stepId);

  const progress =
    totalSteps > 0 ? Math.round((completedItems.length / totalSteps) * 100) : 0;

  return {
    id:             dto.id,
    courseId:       dto.courseId,
    userId:         dto.employeeId,
    status:         mapEnrollmentStatus(dto.status),
    progress,
    completedItems,
    enrolledAt:     dto.startedAt,
    assignedBy:     dto.assignedById,
  };
}

// ── API calls ────────────────────────────────────────────────────

const CoursePaginatedSchema    = paginatedSchema(CourseDtoSchema);
const EnrollmentPaginatedSchema = paginatedSchema(EnrollmentDtoSchema);

export const courseRealApi = {
  async list(): Promise<Course[]> {
    const { data } = await api.get('/courses', { params: { page: 1, limit: 200 } });
    return CoursePaginatedSchema.parse(data).data.map(mapCourse);
  },

  async getById(id: string): Promise<Course> {
    const { data } = await api.get(`/courses/${id}`);
    return mapCourse(CourseDtoSchema.parse(data));
  },

  async getMyEnrollmentDtos(): Promise<EnrollmentDto[]> {
    const { data } = await api.get('/me/enrollments', { params: { page: 1, limit: 200 } });
    return EnrollmentPaginatedSchema.parse(data).data;
  },

  async getCourseEnrollmentDtos(courseId: string): Promise<EnrollmentDto[]> {
    const { data } = await api.get(`/courses/${courseId}/enrollments`, { params: { page: 1, limit: 200 } });
    return EnrollmentPaginatedSchema.parse(data).data;
  },
};

// ── File upload ──────────────────────────────────────────────────

export const fileApi = {
  async upload(file: File): Promise<FileResponseDto> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return FileResponseDtoSchema.parse(data);
  },
};

// ── Course write operations ───────────────────────────────────────

export const courseWriteApi = {
  async create(dto: { name: string; description: string; coverId?: string }): Promise<string> {
    const { data } = await api.post('/courses', dto);
    return IdResponseSchema.parse(data).id;
  },

  async update(id: string, dto: { name?: string; description?: string; coverId?: string | null }): Promise<void> {
    await api.patch(`/courses/${id}`, dto);
  },

  async addModule(courseId: string, name: string): Promise<string> {
    const { data } = await api.post(`/courses/${courseId}/modules`, { name });
    return IdResponseSchema.parse(data).id;
  },

  async deleteModule(courseId: string, moduleId: string): Promise<void> {
    await api.delete(`/courses/${courseId}/modules/${moduleId}`);
  },

  async addStep(
    courseId: string,
    moduleId: string,
    dto: { name: string; type: 'LESSON' | 'TEST'; lessonId?: string; testId?: string },
  ): Promise<string> {
    // Explicitly whitelist body fields — backend rejects unknown properties
    const body: Record<string, unknown> = { name: dto.name, type: dto.type };
    if (dto.lessonId != null) body.lessonId = dto.lessonId;
    if (dto.testId  != null) body.testId  = dto.testId;
    const { data } = await api.post(`/courses/${courseId}/modules/${moduleId}/steps`, body);
    return IdResponseSchema.parse(data).id;
  },

  async deleteStep(courseId: string, moduleId: string, stepId: string): Promise<void> {
    await api.delete(`/courses/${courseId}/modules/${moduleId}/steps/${stepId}`);
  },

  async enrollEmployee(courseId: string, employeeId: string): Promise<string> {
    const { data } = await api.post(`/courses/${courseId}/enroll`, { employeeId });
    return IdResponseSchema.parse(data).id;
  },

  async applyForCourse(courseId: string): Promise<string> {
    const { data } = await api.post(`/courses/${courseId}/applications`);
    return IdResponseSchema.parse(data).id;
  },

  async approveApplication(courseId: string, appId: string): Promise<void> {
    await api.patch(`/courses/${courseId}/applications/${appId}/approve`);
  },

  async rejectApplication(courseId: string, appId: string): Promise<void> {
    await api.patch(`/courses/${courseId}/applications/${appId}/reject`);
  },

  async getApplications(courseId: string): Promise<CourseApplicationDto[]> {
    const { data } = await api.get(`/courses/${courseId}/applications`, { params: { page: 1, limit: 200 } });
    return paginatedSchema(CourseApplicationDtoSchema).parse(data).data;
  },
};

// ── Lessons ──────────────────────────────────────────────────────

export const lessonApi = {
  async create(name: string, content?: string): Promise<string> {
    const body: Record<string, unknown> = { name };
    if (content !== undefined) body.content = content;
    const { data } = await api.post('/lessons', body);
    return IdResponseSchema.parse(data).id;
  },

  async update(id: string, dto: { name?: string; content?: string }): Promise<void> {
    await api.patch(`/lessons/${id}`, dto);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/lessons/${id}`);
  },
};

// ── Test definitions ─────────────────────────────────────────────

export const testDefApi = {
  async create(name: string): Promise<string> {
    const { data } = await api.post('/test-definitions', { name });
    return IdResponseSchema.parse(data).id;
  },

  async getById(id: string): Promise<TestDefinitionDto> {
    const { data } = await api.get(`/test-definitions/${id}`);
    return TestDefinitionDtoSchema.parse(data);
  },

  async addQuestion(testId: string, questionId: string): Promise<void> {
    await api.post(`/test-definitions/${testId}/questions`, { questionId });
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/test-definitions/${id}`);
  },
};

// ── Course question bank ──────────────────────────────────────────

export const questionApi = {
  async create(
    courseId: string,
    dto: { question: string; moduleId?: string; answers: { answer: string; isCorrect: boolean }[] },
  ): Promise<string> {
    const { data } = await api.post(`/courses/${courseId}/questions`, dto);
    return IdResponseSchema.parse(data).id;
  },
};

// ── Enrollment step progress ──────────────────────────────────────

export const enrollmentWriteApi = {
  async completeStep(enrollmentId: string, stepId: string): Promise<void> {
    await api.post(`/enrollments/${enrollmentId}/steps/${stepId}/complete`);
  },

  async getById(id: string): Promise<EnrollmentDto> {
    const { data } = await api.get(`/enrollments/${id}`);
    return EnrollmentDtoSchema.parse(data);
  },
};
