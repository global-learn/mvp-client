import type { CourseType, EnrollmentStatus } from './types';

// ================================================================
// Типы для страницы контроля прохождения курсов
// ================================================================
// Admin / manager видят прогресс не своего, а других пользователей.
// Бэкенд: GET /admin/enrollments?type=EMPLOYEE|CLIENT

export interface AdminEnrollmentRecord {
  userId: string;
  userName: string;        // fullname ?? email
  userEmail: string;
  userType: 'EMPLOYEE' | 'CLIENT';
  department?: string;     // только EMPLOYEE
  division?: string;       // только EMPLOYEE — название отдела
  companyName?: string;    // только CLIENT
  courseId: string;
  courseTitle: string;
  courseType: CourseType;
  status: EnrollmentStatus;
  progress: number;        // 0-100
  assignedAt: string;
}

// Сводка по одному курсу (для вида "По курсам")
export interface CourseSummary {
  courseId: string;
  courseTitle: string;
  courseType: CourseType;
  completed: number;
  inProgress: number;
  notStarted: number;
  totalAssigned: number;
  completionRate: number;  // 0-100, % завершивших
  records: AdminEnrollmentRecord[];
}

// Сводка по одному пользователю (для вида "По сотрудникам / клиентам")
export interface PersonSummary {
  userId: string;
  userName: string;
  userEmail: string;
  userType: 'EMPLOYEE' | 'CLIENT';
  department?: string;
  division?: string;
  companyName?: string;
  completed: number;
  inProgress: number;
  notStarted: number;
  totalCourses: number;
  avgProgress: number;     // средний прогресс по всем назначенным курсам
  records: AdminEnrollmentRecord[];
}

// Утилиты вычисления сводок из плоского списка records
export function buildCourseSummaries(records: AdminEnrollmentRecord[]): CourseSummary[] {
  const map = new Map<string, AdminEnrollmentRecord[]>();
  records.forEach(r => {
    const list = map.get(r.courseId) ?? [];
    list.push(r);
    map.set(r.courseId, list);
  });
  return [...map.values()].map(recs => {
    const completed  = recs.filter(r => r.status === 'completed').length;
    const inProgress = recs.filter(r => r.status === 'in_progress').length;
    const notStarted = recs.filter(r => r.status === 'not_enrolled').length;
    return {
      courseId: recs[0].courseId,
      courseTitle: recs[0].courseTitle,
      courseType: recs[0].courseType,
      completed, inProgress, notStarted,
      totalAssigned: recs.length,
      completionRate: Math.round((completed / recs.length) * 100),
      records: recs,
    };
  });
}

export function buildPersonSummaries(records: AdminEnrollmentRecord[]): PersonSummary[] {
  const map = new Map<string, AdminEnrollmentRecord[]>();
  records.forEach(r => {
    const list = map.get(r.userId) ?? [];
    list.push(r);
    map.set(r.userId, list);
  });
  return [...map.values()].map(recs => {
    const completed  = recs.filter(r => r.status === 'completed').length;
    const inProgress = recs.filter(r => r.status === 'in_progress').length;
    const notStarted = recs.filter(r => r.status === 'not_enrolled').length;
    const avgProgress = Math.round(recs.reduce((s, r) => s + r.progress, 0) / recs.length);
    return {
      userId: recs[0].userId,
      userName: recs[0].userName,
      userEmail: recs[0].userEmail,
      userType: recs[0].userType,
      department: recs[0].department,
      division: recs[0].division,
      companyName: recs[0].companyName,
      completed, inProgress, notStarted,
      totalCourses: recs.length,
      avgProgress,
      records: recs,
    };
  });
}
