import { api } from '@shared/api/axios';
import { IdResponseSchema } from '@shared/api/schemas';
import type {
  CreateOnboardingTemplateRequest,
  AssignOnboardingRequest,
  CompleteOnboardingStepRequest,
  SendOnboardingChatMessageRequest,
} from '@shared/api/schemas';

// Реальные API-функции для онбординга.
// Read-операции (GET) пока отсутствуют в бэкенде — используется onboardingApi.ts (mock).
// При добавлении GET-эндпоинтов — перенести сюда и удалить mock.

export const onboardingRealApi = {
  createTemplate: async (payload: CreateOnboardingTemplateRequest) => {
    const { data } = await api.post('/onboarding/templates', payload);
    return IdResponseSchema.parse(data);
  },

  assign: async (payload: AssignOnboardingRequest) => {
    const { data } = await api.post('/onboardings', payload);
    return IdResponseSchema.parse(data);
  },

  completeStep: async (onboardingId: string, payload: CompleteOnboardingStepRequest) => {
    await api.post(`/onboardings/${onboardingId}/complete-step`, payload);
  },

  sendChatMessage: async (onboardingId: string, payload: SendOnboardingChatMessageRequest) => {
    const { data } = await api.post(`/onboardings/${onboardingId}/chat/messages`, payload);
    return IdResponseSchema.parse(data);
  },
};
