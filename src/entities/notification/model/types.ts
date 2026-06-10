export type NotificationType =
  | 'ONBOARDING_ASSIGNED'
  | 'ONBOARDING_COMPLETED'
  | 'ONBOARDING_COMPLETED_MANAGER'
  | 'ONBOARDING_STEP_OVERDUE'
  | 'ONBOARDING_STEP_OVERDUE_MANAGER'
  | 'COURSE_APPLICATION_APPROVED'
  | 'EMPLOYEE_PROMOTED';

export interface NotificationPayload {
  onboardingId?:  string;
  stepName?:      string;
  assignedToId?:  string;
  courseId?:      string;
  positionId?:    string;
}

export interface Notification {
  id:        string;
  type:      string;
  payload:   NotificationPayload;
  readAt:    string | null;
  createdAt: string;
}

export const NOTIF_LABELS: Record<string, string> = {
  ONBOARDING_ASSIGNED:           'Назначен онбординг',
  ONBOARDING_COMPLETED:          'Онбординг завершён',
  ONBOARDING_COMPLETED_MANAGER:  'Сотрудник завершил онбординг',
  ONBOARDING_STEP_OVERDUE:       'Шаг онбординга просрочен',
  ONBOARDING_STEP_OVERDUE_MANAGER: 'Шаг просрочен у сотрудника',
  COURSE_APPLICATION_APPROVED:   'Заявка на курс одобрена',
  EMPLOYEE_PROMOTED:             'Изменение должности',
};

export function notifLabel(type: string): string {
  return NOTIF_LABELS[type] ?? type.replace(/_/g, ' ').toLowerCase();
}

export function notifDescription(type: string, payload: NotificationPayload): string | null {
  switch (type) {
    case 'ONBOARDING_STEP_OVERDUE':
    case 'ONBOARDING_STEP_OVERDUE_MANAGER':
      return payload.stepName ? `Шаг: «${payload.stepName}»` : null;
    default:
      return null;
  }
}

export function notifRoute(type: string): string {
  switch (type) {
    case 'ONBOARDING_ASSIGNED':
    case 'ONBOARDING_COMPLETED':
    case 'ONBOARDING_STEP_OVERDUE':
      return '/onboarding';
    case 'ONBOARDING_COMPLETED_MANAGER':
    case 'ONBOARDING_STEP_OVERDUE_MANAGER':
      return '/onboarding/manage';
    case 'COURSE_APPLICATION_APPROVED':
      return '/courses';
    case 'EMPLOYEE_PROMOTED':
      return '/profile';
    default:
      return '/dashboard';
  }
}
