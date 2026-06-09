import { api } from '@shared/api/axios';
import {
  IdResponseSchema,
  paginatedSchema,
  OnboardingTemplateSummaryDtoSchema,
  OnboardingTemplateFullDtoSchema,
  OnboardingAssignmentDtoSchema,
  OnboardingChatMessageDtoSchema,
  type OnboardingAssignmentDto,
} from '@shared/api/schemas';
import type {
  CreateOnboardingTemplateRequest,
  UpdateOnboardingTemplateRequest,
  AssignOnboardingRequest,
  CompleteOnboardingStepRequest,
  SendOnboardingChatMessageRequest,
} from '@shared/api/schemas';
import type {
  OnboardingTemplate,
  OnboardingAssignment,
  OnboardingStep,
  OnboardingMessage,
  StepFeedback,
} from '../model/types';
import type { EmployeeDto } from '@shared/api/schemas';

// ── Type mappers ─────────────────────────────────────────────────

function mapBackendStepType(type: string): OnboardingStepType {
  switch (type) {
    case 'COURSE':   return 'course';
    case 'DOCUMENT': return 'document';
    case 'MEETING':  return 'meeting';
    case 'VIDEO':    return 'video';
    default:         return 'task'; // TEXT, TASK
  }
}

// Backend only accepts TEXT | COURSE — all non-course types map to TEXT
export function mapFrontendStepType(type: OnboardingStepType): 'TEXT' | 'COURSE' {
  return type === 'course' ? 'COURSE' : 'TEXT';
}

// ── Mappers ─────────────────────────────────────────────────────

function mapTemplateStep(dto: OnboardingAssignmentDto['steps'][number]): OnboardingStep {
  return {
    id:          dto.id,
    title:       dto.name,
    description: dto.description,
    type:        mapBackendStepType(dto.type),
    required:    true,
    order:       dto.position,
    courseId:    dto.courseId,
    dueDate:     dto.recommendedEndDate,
  };
}

function mapAssignmentDto(
  dto: OnboardingAssignmentDto,
  empMap: Map<string, EmployeeDto>,
): OnboardingAssignment {
  const assignedTo = empMap.get(dto.assignedToId);
  const assignedBy = empMap.get(dto.assignedById);

  const completedSteps = dto.steps.filter(s => s.completedAt).map(s => s.id);
  const feedbacks: StepFeedback[] = dto.steps
    .filter(s => s.feedbackText)
    .map(s => ({ stepId: s.id, text: s.feedbackText!, submittedAt: s.completedAt ?? '' }));

  return {
    id:             dto.id,
    templateId:     dto.templateId ?? '',
    templateTitle:  dto.name,
    employeeId:     dto.assignedToId,
    employeeName:   assignedTo?.fullname ?? dto.assignedToId,
    employeeEmail:  assignedTo?.email ?? '',
    assignedBy:     dto.assignedById,
    assignedByName: assignedBy?.fullname ?? dto.assignedById,
    divisionId:     assignedTo?.divisionId ?? '',
    divisionName:   '',
    departmentId:   assignedTo?.department?.id ?? '',
    departmentName: assignedTo?.department?.name ?? '',
    steps:          dto.steps.map(mapTemplateStep),
    dueDate:        dto.endDate,
    completedSteps,
    feedbacks,
    status:         dto.status === 'COMPLETED' ? 'completed' : 'in_progress',
    startedAt:      dto.startDate,
    completedAt:    dto.completedAt,
    messages:       [],
  };
}

async function fetchEmployeeMap(ids: string[]): Promise<Map<string, EmployeeDto>> {
  const unique = [...new Set(ids)];
  const entries = await Promise.allSettled(
    unique.map(id => api.get(`/employees/${id}`).then(r => r.data as EmployeeDto)),
  );
  const map = new Map<string, EmployeeDto>();
  entries.forEach((result, i) => {
    if (result.status === 'fulfilled') map.set(unique[i], result.value);
  });
  return map;
}

async function mapAssignmentList(dtos: OnboardingAssignmentDto[]): Promise<OnboardingAssignment[]> {
  const ids = dtos.flatMap(d => [d.assignedToId, d.assignedById]);
  const empMap = await fetchEmployeeMap(ids);
  return dtos.map(dto => mapAssignmentDto(dto, empMap));
}

// ── Write operations ─────────────────────────────────────────────

export const onboardingRealApi = {
  createTemplate: async (payload: CreateOnboardingTemplateRequest) => {
    const { data } = await api.post('/onboarding/templates', payload);
    return IdResponseSchema.parse(data);
  },

  assign: async (payload: AssignOnboardingRequest): Promise<string> => {
    const { data } = await api.post('/onboardings', payload);
    return IdResponseSchema.parse(data).id;
  },

  completeStep: async (onboardingId: string, payload: CompleteOnboardingStepRequest) => {
    await api.post(`/onboardings/${onboardingId}/complete-step`, payload);
  },

  sendChatMessage: async (onboardingId: string, payload: SendOnboardingChatMessageRequest): Promise<string> => {
    const { data } = await api.post(`/onboardings/${onboardingId}/chat/messages`, payload);
    return IdResponseSchema.parse(data).id;
  },

  // ── Read operations ───────────────────────────────────────────

  getTemplates: async (): Promise<OnboardingTemplate[]> => {
    const { data } = await api.get('/onboarding/templates', { params: { page: 1, limit: 200 } });
    const dtos = paginatedSchema(OnboardingTemplateSummaryDtoSchema).parse(data).data;
    return dtos.map(dto => ({
      id:               dto.id,
      title:            dto.name,
      description:      dto.description,
      positionId:       dto.positionId,
      targetDivisionId: dto.divisionId,
      steps:            [],
      stepCount:        dto.stepCount,
      createdBy:        '',
      status:           'active' as const,
      createdAt:        dto.createdAt,
    }));
  },

  getTemplateById: async (id: string): Promise<OnboardingTemplate> => {
    const { data } = await api.get(`/onboarding/templates/${id}`);
    const dto = OnboardingTemplateFullDtoSchema.parse(data);
    return {
      id:               dto.id,
      title:            dto.name,
      description:      dto.description,
      positionId:       dto.positionId,
      targetDivisionId: dto.divisionId,
      steps:            dto.steps.map(s => ({
        id:                         s.id,
        title:                      s.name,
        description:                s.description,
        type:                       mapBackendStepType(s.type),
        required:                   true,
        order:                      s.position,
        courseId:                   s.courseId,
        recommendedStartOffsetDays: s.recommendedStartOffsetDays,
        recommendedEndOffsetDays:   s.recommendedEndOffsetDays,
      })),
      createdBy:  '',
      status:     'active' as const,
      createdAt:  dto.createdAt,
    };
  },

  updateTemplate: async (id: string, payload: UpdateOnboardingTemplateRequest): Promise<void> => {
    await api.put(`/onboarding/templates/${id}`, payload);
  },

  getMyOnboardings: async (): Promise<OnboardingAssignment[]> => {
    const { data } = await api.get('/onboardings/mine', { params: { page: 1, limit: 200 } });
    const dtos = paginatedSchema(OnboardingAssignmentDtoSchema).parse(data).data;
    return mapAssignmentList(dtos);
  },

  getManagedOnboardings: async (): Promise<OnboardingAssignment[]> => {
    const { data } = await api.get('/onboardings/assigned-by-me', { params: { page: 1, limit: 200 } });
    const dtos = paginatedSchema(OnboardingAssignmentDtoSchema).parse(data).data;
    return mapAssignmentList(dtos);
  },

  getAllOnboardings: async (): Promise<OnboardingAssignment[]> => {
    const { data } = await api.get('/onboardings', { params: { page: 1, limit: 200 } });
    const dtos = paginatedSchema(OnboardingAssignmentDtoSchema).parse(data).data;
    return mapAssignmentList(dtos);
  },

  getOnboardingById: async (id: string): Promise<OnboardingAssignment> => {
    const { data } = await api.get(`/onboardings/${id}`);
    const dto = OnboardingAssignmentDtoSchema.parse(data);
    const empMap = await fetchEmployeeMap([dto.assignedToId, dto.assignedById]);
    return mapAssignmentDto(dto, empMap);
  },

  getChatMessages: async (onboardingId: string): Promise<OnboardingMessage[]> => {
    const { data } = await api.get(`/onboardings/${onboardingId}/chat/messages`, { params: { limit: 200 } });
    const dtos = (Array.isArray(data) ? data : data.data ?? []).map(
      (m: unknown) => OnboardingChatMessageDtoSchema.parse(m),
    );
    return dtos.map(m => ({
      id:         m.id,
      senderId:   m.senderId,
      senderName: m.senderId,
      text:       m.body,
      sentAt:     m.createdAt,
    }));
  },
};
