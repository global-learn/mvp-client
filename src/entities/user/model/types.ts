// Типы пользователей — соответствуют schema.prisma

export type UserType = 'EMPLOYEE' | 'CLIENT';

// ================================================================
// Роли сотрудников (фиксированные)
// ================================================================

export type EmployeeRole =
  | 'admin'             // Администратор — полный доступ
  | 'department_head'   // Руководитель департамента — курсы/статистика по всему департаменту
  | 'division_head'     // Руководитель отдела — курсы/статистика по своему отделу
  | 'senior_manager'    // Старший менеджер — курсы/статистика назначенных менеджеров
  | 'manager';          // Менеджер — только прохождение курсов

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  admin:            'Администратор',
  department_head:  'Руководитель департамента',
  division_head:    'Руководитель отдела',
  senior_manager:   'Старший менеджер',
  manager:          'Менеджер',
};

export interface UserRole {
  id: string;
  name: EmployeeRole;
}

// ================================================================
// Организационная структура
// ================================================================

export interface UserDepartment {
  id: string;
  name: string;
}

export interface UserDivision {
  id: string;
  name: string;
  departmentId: string;
  isService?: boolean; // Отдел сервиса
}

export interface UserPosition {
  id: string;
  name: string;
}

// ================================================================
// Профили пользователей
// ================================================================

export interface UserAvatar {
  id: string;
  name: string;
  isSystem: boolean;
  bgColor?: string;
  url?: string;
}

export interface EmployeeProfile {
  id: string;
  department: UserDepartment;
  division:   UserDivision;
  position:   UserPosition;
  role:       UserRole;
  birthDate:        string;
  employmentDate:   string;
}

export interface User {
  id: string;
  email: string;
  fullname: string | null;
  type: UserType;
  avatar?: UserAvatar;
  employee?: EmployeeProfile; // только когда type === 'EMPLOYEE'
}

// ================================================================
// Вспомогательные функции
// ================================================================

export function displayName(user: User): string {
  return user.fullname ?? user.email;
}

export function userInitials(user: User): string {
  const name = user.fullname;
  if (!name) return user.email[0].toUpperCase();
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Роли ────────────────────────────────────────────────────────

function role(user: User): EmployeeRole | undefined {
  return user.employee?.role.name;
}

export function isAdmin(user: User): boolean {
  return role(user) === 'admin';
}

export function isDepartmentHead(user: User): boolean {
  return role(user) === 'department_head';
}

export function isDivisionHead(user: User): boolean {
  return role(user) === 'division_head';
}

export function isSeniorManager(user: User): boolean {
  return role(user) === 'senior_manager';
}

export function isManager(user: User): boolean {
  return role(user) === 'manager';
}

/** Отдел сервиса — может работать с клиентами */
export function isServiceDivision(user: User): boolean {
  return user.type === 'EMPLOYEE' && (user.employee?.division.isService ?? false);
}

// ── Права доступа ────────────────────────────────────────────────

/** Создание курсов: admin, рук. департамента, рук. отдела, старший менеджер */
export function canCreateCourse(user: User): boolean {
  const r = role(user);
  return r === 'admin' || r === 'department_head' || r === 'division_head' || r === 'senior_manager';
}

/** Назначение курсов другим пользователям */
export function canAssignCourse(user: User): boolean {
  return canCreateCourse(user);
}

/** Страница контроля (видит чью-то статистику) */
export function canControl(user: User): boolean {
  return canCreateCourse(user);
}

/** Работа с клиентами: добавление компаний, регистрация, чат */
export function canManageClients(user: User): boolean {
  return isAdmin(user) || isServiceDivision(user);
}

// ── Масштаб статистики ───────────────────────────────────────────

export type StatsScope = 'all' | 'department' | 'division' | 'assigned' | 'self';

/**
 * Определяет, какую статистику может видеть пользователь:
 *   all        — admin: видит всё
 *   department — department_head: только свой департамент
 *   division   — division_head: только свой отдел
 *   assigned   — senior_manager: только те, кому назначил
 *   self       — manager/client: только своя
 */
export function getStatsScope(user: User): StatsScope {
  const r = role(user);
  if (r === 'admin')            return 'all';
  if (r === 'department_head')  return 'department';
  if (r === 'division_head')    return 'division';
  if (r === 'senior_manager')   return 'assigned';
  return 'self';
}

export function canCreateCourses(user: User): boolean {
  if (user.type !== 'EMPLOYEE') return false;
  const role = user.employee?.role.name;
  return role === 'admin' || role === 'manager';
}
