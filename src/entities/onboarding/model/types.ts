import type { EmployeeRole } from '@entities/user/model/types';

// ================================================================
// Шаг онбординга
// ================================================================

export type OnboardingStepType = 'task' | 'document' | 'meeting' | 'video' | 'course';

export const STEP_TYPE_LABELS: Record<OnboardingStepType, string> = {
  task:     'Задача',
  document: 'Документ',
  meeting:  'Встреча',
  video:    'Видео',
  course:   'Курс',
};

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: OnboardingStepType;
  required: boolean;
  order: number;
  /** Если type === 'course', можно прикрепить courseId */
  courseId?: string;
  /** Дедлайн шага (ISO date) — используется в назначениях */
  dueDate?: string;
  /** Смещение относительно старта онбординга — используется в шаблонах */
  recommendedStartOffsetDays?: number;
  recommendedEndOffsetDays?: number;
}

// ================================================================
// Шаблон онбординга (черновик / активный)
// ================================================================

export interface OnboardingTemplate {
  id: string;
  title: string;
  description: string;
  positionId?: string;
  positionName?: string;
  /** Для какой роли (опционально) */
  targetRole?: EmployeeRole | null;
  /** Для какого подразделения (опционально) */
  targetDivisionId?: string | null;
  targetDivisionName?: string | null;
  targetDepartmentId?: string | null;
  targetDepartmentName?: string | null;
  steps: OnboardingStep[];
  stepCount?: number;
  createdBy: string;
  status: 'draft' | 'active';
  createdAt: string;
}

// ================================================================
// Обратная связь по шагу (оставляет сотрудник перед отметкой)
// ================================================================

export interface StepFeedback {
  stepId: string;
  text: string;
  submittedAt: string;
}

// ================================================================
// Сообщение в чате онбординга
// ================================================================

export interface OnboardingMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  sentAt: string;
}

// ================================================================
// Назначение онбординга сотруднику
// ================================================================

export interface OnboardingAssignment {
  id: string;
  templateId: string;
  templateTitle: string;
  /** Кому назначено */
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  /** Кто назначил */
  assignedBy: string;
  assignedByName: string;
  /** Структура */
  divisionId: string;
  divisionName: string;
  departmentId: string;
  departmentName: string;
  /** Редактируемый снапшот шагов (копия из шаблона + возможные правки) */
  steps: OnboardingStep[];
  /** Общий дедлайн онбординга (ISO date) */
  dueDate?: string;
  /** ID пройденных шагов */
  completedSteps: string[];
  /** Обратная связь по шагам (одна запись на шаг) */
  feedbacks: StepFeedback[];
  status: 'in_progress' | 'completed';
  startedAt: string;
  completedAt?: string;
  /** Переписка между назначившим и сотрудником */
  messages: OnboardingMessage[];
}

// ── Утилиты ─────────────────────────────────────────────────────

export function calcOnboardingProgress(assignment: OnboardingAssignment): number {
  const total = assignment.steps.length;
  if (total === 0) return 0;
  return Math.round((assignment.completedSteps.length / total) * 100);
}
