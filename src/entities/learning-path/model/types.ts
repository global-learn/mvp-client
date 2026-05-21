import type { EmployeeRole } from '@entities/user/model/types';
import type { Enrollment } from '@entities/course/model/types';

// ================================================================
// Learning Path — последовательный маршрут из курсов
// ================================================================

/** Кому назначен path */
export type PathTargetType = 'all' | 'department' | 'division' | 'managers';

export const PATH_TARGET_LABELS: Record<PathTargetType, string> = {
  all:        'Все сотрудники',
  department: 'Департамент',
  division:   'Отдел',
  managers:   'Менеджеры отдела',
};

export interface LearningPathStep {
  id: string;
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  order: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdByName: string;
  targetType: PathTargetType;
  targetDepartmentId?: string | null;
  targetDepartmentName?: string | null;
  targetDivisionId?: string | null;
  targetDivisionName?: string | null;
  steps: LearningPathStep[];
  status: 'draft' | 'published';
  createdAt: string;
}

// ================================================================
// Статус шага в контексте конкретного пользователя
// Вычисляется на лету из enrollments — не хранится в БД
// ================================================================

export type PathStepStatus =
  | 'locked'           // предыдущий шаг не завершён
  | 'not_enrolled'     // разблокирован, заявка ещё не подавалась
  | 'pending_approval' // заявка подана, ждёт одобрения
  | 'rejected'         // заявка отклонена
  | 'in_progress'      // одобрен, курс проходится
  | 'completed';       // курс завершён

export interface LearningPathStepWithStatus extends LearningPathStep {
  status: PathStepStatus;
}

/**
 * Вычислить статус каждого шага пути для данного пользователя.
 * Правила:
 *   - Шаг 0 всегда разблокирован
 *   - Шаг N разблокируется, если шаг N-1 completed
 *   - Статус самого шага = enrollment.status (или not_enrolled/locked)
 *   - Даже если шаг разблокирован — нужна заявка (approval flow)
 */
export function computeStepStatuses(
  path: LearningPath,
  enrollments: Enrollment[],
): LearningPathStepWithStatus[] {
  const sorted = [...path.steps].sort((a, b) => a.order - b.order);
  const result: LearningPathStepWithStatus[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const step = sorted[i];
    const enrollment = enrollments.find(e => e.courseId === step.courseId);

    // Первый шаг всегда открыт; остальные — если предыдущий завершён
    const prevDone = i === 0 || result[i - 1].status === 'completed';

    let status: PathStepStatus;

    if (!prevDone) {
      status = 'locked';
    } else if (!enrollment) {
      status = 'not_enrolled';
    } else {
      // enrollment.status: 'pending_approval' | 'in_progress' | 'completed' | 'rejected'
      status = enrollment.status as PathStepStatus;
    }

    result.push({ ...step, status });
  }

  return result;
}

/** Прогресс пути в % (только completed шаги) */
export function calcPathProgress(steps: LearningPathStepWithStatus[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter(s => s.status === 'completed').length;
  return Math.round((done / steps.length) * 100);
}

// Для доступа к созданию путей
export const PATH_CREATOR_ROLES: EmployeeRole[] = [
  'admin',
  'department_head',
  'division_head',
  'senior_manager',
];

// ── Диплом о завершении трека ────────────────────────────────────
export interface TrackCertificate {
  id: string;
  userId: string;
  pathId: string;
  pathTitle: string;
  userName: string;
  stepCount: number;
  issuedAt: string;
}
