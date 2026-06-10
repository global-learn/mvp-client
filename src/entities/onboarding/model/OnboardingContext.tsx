import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { isAxiosError } from 'axios';
import type {
  OnboardingTemplate,
  OnboardingAssignment,
  OnboardingStep,
  OnboardingMessage,
} from './types';
import { onboardingRealApi, mapFrontendStepType } from '../api/onboardingRealApi';
import { useUser } from '@entities/user/model/UserContext';
import { displayName, isAdmin, canControl } from '@entities/user/model/types';
import { toast } from '@shared/lib/toast';

interface OnboardingContextValue {
  templates: OnboardingTemplate[];
  /** Онбординги, назначенные текущему пользователю */
  myAssignments: OnboardingAssignment[];
  /** Онбординги, созданные текущим пользователем (для менеджера) */
  managedAssignments: OnboardingAssignment[];
  /** Все назначения в системе (для admins / canControl) */
  allAssignments: OnboardingAssignment[];
  isLoading: boolean;

  /** Оставить отзыв и пометить шаг выполненным */
  completeStepWithFeedback: (assignmentId: string, stepId: string, feedbackText: string) => Promise<void>;
  /** Отправить сообщение */
  sendMessage: (assignmentId: string, text: string) => Promise<void>;
  /** Загрузить историю чата и пометить сообщения прочитанными */
  loadMessages: (assignmentId: string) => Promise<void>;
  /** Назначить шаблон сотруднику */
  assign: (
    templateId: string,
    employeeId: string,
    employeeName: string,
    employeeEmail: string,
    divisionId: string,
    divisionName: string,
    departmentId: string,
    departmentName: string,
    customSteps?: OnboardingStep[],
    dueDate?: string,
  ) => Promise<OnboardingAssignment>;
  /** Отменить онбординг */
  cancelAssignment: (assignmentId: string) => Promise<void>;
  /** Обновить шаги конкретного назначения (локально, нет endpoint) */
  updateSteps: (assignmentId: string, steps: OnboardingStep[]) => Promise<void>;
  /** Создать новый шаблон онбординга */
  createTemplate: (dto: Omit<OnboardingTemplate, 'id' | 'createdAt'>) => Promise<OnboardingTemplate>;
  /** Обновить существующий шаблон */
  updateTemplate: (id: string, patch: Partial<OnboardingTemplate>) => Promise<OnboardingTemplate>;

  reload: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();

  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [myAssignments, setMyAssignments] = useState<OnboardingAssignment[]>([]);
  const [managedAssignments, setManagedAssignments] = useState<OnboardingAssignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<OnboardingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const controller = canControl(user);
      const admin = isAdmin(user);

      const [tmplsResult, mineResult, managedResult] = await Promise.allSettled([
        onboardingRealApi.getTemplates(),
        onboardingRealApi.getMyOnboardings(),
        controller ? onboardingRealApi.getManagedOnboardings() : Promise.resolve([]),
      ]);

      const tmpls  = tmplsResult.status   === 'fulfilled' ? tmplsResult.value.data : [];
      const mine    = mineResult.status    === 'fulfilled' ? mineResult.value    : [];
      const managed = managedResult.status === 'fulfilled' ? managedResult.value : [];

      if (tmplsResult.status === 'rejected')
        console.error('[onboarding] templates load failed:', tmplsResult.reason);
      if (mineResult.status === 'rejected')
        console.error('[onboarding] mine load failed:', mineResult.reason);
      if (managedResult.status === 'rejected')
        console.error('[onboarding] managed load failed:', managedResult.reason);

      setTemplates(tmpls);
      setMyAssignments(mine);
      setManagedAssignments(managed);

      if (admin) {
        try {
          const all = await onboardingRealApi.getAllOnboardings();
          setAllAssignments(all);
        } catch (err) {
          console.error('[onboarding] all-assignments load failed:', err);
          const merged = [...mine, ...managed];
          const seen = new Set<string>();
          setAllAssignments(merged.filter(a => seen.has(a.id) ? false : (seen.add(a.id), true)));
        }
      } else {
        const merged = [...mine, ...managed];
        const seen = new Set<string>();
        setAllAssignments(merged.filter(a => seen.has(a.id) ? false : (seen.add(a.id), true)));
      }
    } catch (err) {
      toast.apiError(err, 'Не удалось загрузить онбординги');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  // ── Обновить конкретное назначение во всех списках ───────────
  const patchAssignment = (updated: OnboardingAssignment) => {
    setMyAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
    setManagedAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
    setAllAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const completeStepWithFeedback = async (assignmentId: string, stepId: string, feedbackText: string) => {
    try {
      await onboardingRealApi.completeStep(assignmentId, { stepId, feedbackText, selectedOptionIds: [] });
      const updated = await onboardingRealApi.getOnboardingById(assignmentId);
      patchAssignment(updated);
      toast.success('Шаг отмечен как выполненный');
    } catch (err) {
      toast.apiError(err, 'Не удалось отметить шаг');
      throw err;
    }
  };

  const sendMessage = async (assignmentId: string, text: string) => {
    try {
      const msgId = await onboardingRealApi.sendChatMessage(assignmentId, { body: text });
      const msg: OnboardingMessage = {
        id:         msgId,
        senderId:   user.id,
        senderName: displayName(user),
        text,
        sentAt:     new Date().toISOString(),
      };
      const patch = (a: OnboardingAssignment) =>
        a.id === assignmentId ? { ...a, messages: [...a.messages, msg] } : a;
      setMyAssignments(prev => prev.map(patch));
      setManagedAssignments(prev => prev.map(patch));
      setAllAssignments(prev => prev.map(patch));
    } catch (err) {
      toast.apiError(err, 'Не удалось отправить сообщение');
      throw err;
    }
  };

  const loadMessages = async (assignmentId: string) => {
    const assignment =
      [...myAssignments, ...managedAssignments, ...allAssignments].find(a => a.id === assignmentId);
    if (!assignment) return;
    try {
      const nameMap: Record<string, string> = {
        [assignment.employeeId]: assignment.employeeName || assignment.employeeId,
        [assignment.assignedBy]: assignment.assignedByName || assignment.assignedBy,
      };
      const msgs = await onboardingRealApi.getChatMessages(assignmentId, nameMap);
      const applyMsgs = (list: OnboardingAssignment[]) =>
        list.map(a => a.id === assignmentId ? { ...a, messages: msgs } : a);
      setMyAssignments(applyMsgs);
      setManagedAssignments(applyMsgs);
      setAllAssignments(applyMsgs);
      onboardingRealApi.markMessagesRead(assignmentId).catch(() => {});
    } catch {
      // non-fatal — chat stays empty rather than crashing the view
    }
  };

  const cancelAssignment = async (assignmentId: string) => {
    try {
      await onboardingRealApi.cancel(assignmentId);
      const removeOrCancel = (list: OnboardingAssignment[]) =>
        list.map(a => a.id === assignmentId ? { ...a, status: 'cancelled' as const } : a);
      setMyAssignments(prev => removeOrCancel(prev));
      setManagedAssignments(prev => removeOrCancel(prev));
      setAllAssignments(prev => removeOrCancel(prev));
      toast.success('Онбординг отменён');
    } catch (err) {
      toast.apiError(err, 'Не удалось отменить онбординг');
      throw err;
    }
  };

  const assign = async (
    templateId: string,
    employeeId: string,
    employeeName: string,
    employeeEmail: string,
    _divisionId: string,
    _divisionName: string,
    _departmentId: string,
    _departmentName: string,
    _customSteps?: OnboardingStep[],
    dueDate?: string,
  ): Promise<OnboardingAssignment> => {
    try {
      const startDate = new Date().toISOString();
      const endDate = dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const id = await onboardingRealApi.assign({ templateId, assignedToId: employeeId, startDate, endDate });
      const created = await onboardingRealApi.getOnboardingById(id);
      const enriched: OnboardingAssignment = {
        ...created,
        employeeName:  created.employeeName !== employeeId ? created.employeeName : employeeName,
        employeeEmail: created.employeeEmail || employeeEmail,
      };
      setManagedAssignments(prev => [...prev, enriched]);
      setAllAssignments(prev => [...prev, enriched]);
      toast.success('Онбординг назначен');
      return enriched;
    } catch (err) {
      toast.apiError(err, 'Не удалось назначить онбординг');
      throw err;
    }
  };

  const updateSteps = async (assignmentId: string, steps: OnboardingStep[]) => {
    // No backend endpoint for updating assignment steps — local state update only
    const patch = (a: OnboardingAssignment) =>
      a.id === assignmentId ? { ...a, steps } : a;
    setMyAssignments(prev => prev.map(patch));
    setManagedAssignments(prev => prev.map(patch));
    setAllAssignments(prev => prev.map(patch));
  };

  const buildStepsPayload = (steps: OnboardingStep[]) =>
    steps.map((s, i) => ({
      position:                   i + 1,
      name:                       s.title,
      description:                s.description,
      type:                       mapFrontendStepType(s.type),
      courseId:                   s.courseId,
      recommendedStartOffsetDays: s.recommendedStartOffsetDays ?? 0,
      recommendedEndOffsetDays:   s.recommendedEndOffsetDays ?? 7,
      feedbackOptions:            [] as [],
    }));

  const createTemplate = async (dto: Omit<OnboardingTemplate, 'id' | 'createdAt'>): Promise<OnboardingTemplate> => {
    try {
      const { id } = await onboardingRealApi.createTemplate({
        name:        dto.title,
        description: dto.description,
        positionId:  dto.positionId || undefined,
        divisionId:  dto.targetDivisionId!,
        steps:       buildStepsPayload(dto.steps),
      });
      toast.success('Шаблон онбординга создан');
      // Reload from server so summary list is always fresh
      await load();
      const fresh = templates.find(t => t.id === id);
      return fresh ?? { ...dto, id, createdAt: new Date().toISOString() };
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        // Template already exists on the server — reload to surface it
        toast.error('Шаблон с такими параметрами уже существует');
        void load();
      } else {
        toast.apiError(err, 'Не удалось создать шаблон');
      }
      throw err;
    }
  };

  const updateTemplate = async (id: string, patch: Partial<OnboardingTemplate>): Promise<OnboardingTemplate> => {
    const existing = templates.find(t => t.id === id);
    const updated: OnboardingTemplate = {
      ...(existing ?? { id, title: '', description: '', steps: [], createdBy: '', status: 'active', createdAt: '' }),
      ...patch,
    };
    try {
      await onboardingRealApi.updateTemplate(id, {
        name:        updated.title,
        description: updated.description,
        steps:       buildStepsPayload(updated.steps),
      });
      toast.success('Шаблон обновлён');
      // Reload to get server-side state
      void load();
      return updated;
    } catch (err) {
      toast.apiError(err, 'Не удалось обновить шаблон');
      throw err;
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        templates,
        myAssignments,
        managedAssignments,
        allAssignments,
        isLoading,
        completeStepWithFeedback,
        sendMessage,
        loadMessages,
        assign,
        cancelAssignment,
        updateSteps,
        createTemplate,
        updateTemplate,
        reload: load,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}
