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
import { onboardingApi } from '../api/onboardingApi';
import { useUser } from '@entities/user/model/UserContext';
import { displayName } from '@entities/user/model/types';

interface OnboardingContextValue {
  templates: OnboardingTemplate[];
  /** Онбординги, назначенные текущему пользователю */
  myAssignments: OnboardingAssignment[];
  /** Онбординги, созданные текущим пользователем (для менеджера) */
  managedAssignments: OnboardingAssignment[];
  isLoading: boolean;

  /** Пометить / снять шаг */
  toggleStep: (assignmentId: string, stepId: string, done: boolean) => Promise<void>;
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
  ) => Promise<OnboardingAssignment>;
  /** Обновить шаги конкретного назначения */
  updateSteps: (assignmentId: string, steps: OnboardingStep[]) => Promise<void>;

  reload: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();

  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [myAssignments, setMyAssignments] = useState<OnboardingAssignment[]>([]);
  const [managedAssignments, setManagedAssignments] = useState<OnboardingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [tmpls, mine, managed] = await Promise.all([
      onboardingApi.getTemplates(),
      onboardingApi.getMyAssignments(user.id),
      onboardingApi.getManagedAssignments(user.id),
    ]);
    setTemplates(tmpls);
    setMyAssignments(mine);
    setManagedAssignments(managed);
    setIsLoading(false);
  }, [user.id]);

  useEffect(() => { void load(); }, [load]);

  // ── Обновить конкретное назначение в обоих списках ────────────
  const patchAssignment = (updated: OnboardingAssignment) => {
    setMyAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
    setManagedAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const toggleStep = async (assignmentId: string, stepId: string, done: boolean) => {
    const updated = done
      ? await onboardingApi.completeStep(assignmentId, stepId)
      : await onboardingApi.uncompleteStep(assignmentId, stepId);
    patchAssignment(updated);
  };

  const sendMessage = async (assignmentId: string, text: string) => {
    const msg: OnboardingMessage = await onboardingApi.sendMessage(
      assignmentId,
      user.id,
      displayName(user),
      text,
    );
    const patch = (a: OnboardingAssignment) =>
      a.id === assignmentId ? { ...a, messages: [...a.messages, msg] } : a;
    setMyAssignments(prev => prev.map(patch));
    setManagedAssignments(prev => prev.map(patch));
  };

  const assign = async (
    templateId: string,
    employeeId: string,
    employeeName: string,
    employeeEmail: string,
    divisionId: string,
    divisionName: string,
    departmentId: string,
    departmentName: string,
    customSteps?: OnboardingStep[],
  ): Promise<OnboardingAssignment> => {
    const created = await onboardingApi.assignTemplate(
      templateId,
      employeeId,
      employeeName,
      employeeEmail,
      user.id,
      displayName(user),
      divisionId,
      divisionName,
      departmentId,
      departmentName,
      customSteps,
    );
    setManagedAssignments(prev => [...prev, created]);
    return created;
  };

  const updateSteps = async (assignmentId: string, steps: OnboardingStep[]) => {
    const updated = await onboardingApi.updateAssignmentSteps(assignmentId, steps);
    patchAssignment(updated);
  };

  return (
    <OnboardingContext.Provider
      value={{
        templates,
        myAssignments,
        managedAssignments,
        isLoading,
        toggleStep,
        sendMessage,
        assign,
        updateSteps,
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
