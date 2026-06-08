import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  OnboardingTemplate,
  OnboardingAssignment,
  OnboardingStep,
  OnboardingMessage,
} from './types';
import { onboardingRealApi } from '../api/onboardingRealApi';
import { useUser } from '@entities/user/model/UserContext';
import { displayName, isAdmin, canControl } from '@entities/user/model/types';

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

      const [tmpls, mine, managed] = await Promise.all([
        onboardingRealApi.getTemplates(),
        onboardingRealApi.getMyOnboardings(),
        controller ? onboardingRealApi.getManagedOnboardings() : Promise.resolve([]),
      ]);

      setTemplates(tmpls);
      setMyAssignments(mine);
      setManagedAssignments(managed);

      if (admin) {
        const all = await onboardingRealApi.getAllOnboardings();
        setAllAssignments(all);
      } else {
        // Merge mine + managed, deduplicate by id
        const merged = [...mine, ...managed];
        const seen = new Set<string>();
        setAllAssignments(merged.filter(a => seen.has(a.id) ? false : (seen.add(a.id), true)));
      }
    } catch (err) {
      console.error('Onboarding load failed:', err);
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
    await onboardingRealApi.completeStep(assignmentId, { stepId, feedbackText, selectedOptionIds: [] });
    const updated = await onboardingRealApi.getOnboardingById(assignmentId);
    patchAssignment(updated);
  };

  const sendMessage = async (assignmentId: string, text: string) => {
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
    const startDate = new Date().toISOString();
    const endDate = dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const id = await onboardingRealApi.assign({ templateId, assignedToId: employeeId, startDate, endDate });
    const created = await onboardingRealApi.getOnboardingById(id);
    // Fill in names from the caller if the API doesn't resolve them
    const enriched: OnboardingAssignment = {
      ...created,
      employeeName:  created.employeeName !== employeeId ? created.employeeName : employeeName,
      employeeEmail: created.employeeEmail || employeeEmail,
    };
    setManagedAssignments(prev => [...prev, enriched]);
    setAllAssignments(prev => [...prev, enriched]);
    return enriched;
  };

  const updateSteps = async (assignmentId: string, steps: OnboardingStep[]) => {
    // No backend endpoint for updating assignment steps — local state update only
    const patch = (a: OnboardingAssignment) =>
      a.id === assignmentId ? { ...a, steps } : a;
    setMyAssignments(prev => prev.map(patch));
    setManagedAssignments(prev => prev.map(patch));
    setAllAssignments(prev => prev.map(patch));
  };

  const createTemplate = async (dto: Omit<OnboardingTemplate, 'id' | 'createdAt'>): Promise<OnboardingTemplate> => {
    const { id } = await onboardingRealApi.createTemplate({
      name:        dto.title,
      description: dto.description,
      positionId:  '00000000-0000-0000-0000-000000000000', // placeholder — UI doesn't provide it yet
      divisionId:  dto.targetDivisionId ?? '00000000-0000-0000-0000-000000000000',
      steps:       dto.steps.map((s, i) => ({
        position:                   i + 1,
        name:                       s.title,
        description:                s.description,
        type:                       s.type === 'course' ? 'COURSE' as const : 'TEXT' as const,
        courseId:                   s.courseId,
        recommendedStartOffsetDays: 0,
        recommendedEndOffsetDays:   7,
        feedbackOptions:            [],
      })),
    });
    const created: OnboardingTemplate = {
      ...dto,
      id,
      createdAt: new Date().toISOString(),
    };
    setTemplates(prev => [...prev, created]);
    return created;
  };

  const updateTemplate = async (id: string, patch: Partial<OnboardingTemplate>): Promise<OnboardingTemplate> => {
    const existing = templates.find(t => t.id === id);
    const updated: OnboardingTemplate = { ...(existing ?? { id, title: '', description: '', steps: [], createdBy: '', status: 'active', createdAt: '' }), ...patch };
    setTemplates(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
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
        assign,
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
