// Типы пользователей — соответствуют schema.prisma
// UserType: EMPLOYEE (сотрудник компании) | CLIENT (пользователь клиентской компании)

export type UserType = 'EMPLOYEE' | 'CLIENT';

export interface UserRole {
  id: string;
  name: string; // 'admin' | 'departmentHead' | 'seniorManager' | 'manager' | 'developer' | 'employee' | 'accountant' | …
}

export interface UserDepartment {
  id: string;
  name: string;
}

// Avatar — системные (isSystem: true, bgColor для CSS) или загруженные (url)
export interface UserAvatar {
  id: string;
  name: string;
  isSystem: boolean;
  bgColor?: string; // для системных аватаров (CSS background-color)
  url?: string;     // для загруженных аватаров
}

// Employee — дополнительные данные для UserType.EMPLOYEE
export interface EmployeeProfile {
  id: string;
  department: UserDepartment;
  role: UserRole;
  birthDate: string;        // ISO date string
  employmentDate: string;   // ISO date string
}

export interface ClientProfile {
  id: string;
  company: string;
}


export interface User {
  id: string;
  email: string;
  fullname: string | null;
  type: UserType;
  avatar?: UserAvatar;
  employee?: EmployeeProfile; // присутствует только когда type === 'EMPLOYEE'
  client?: ClientProfile;
}

// ---- Вспомогательные функции ----

/** Отображаемое имя: fullname если есть, иначе email */
export function displayName(user: User): string {
  return user.fullname ?? user.email;
}

/** Инициалы для аватара-заглушки: "Алексей Петров" → "АП" */
export function userInitials(user: User): string {
  const name = user.fullname;
  if (!name) return user.email[0].toUpperCase();
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Admin: полный доступ */
export function isAdmin(user: User): boolean {
  return user.type === 'EMPLOYEE' && user.employee?.role.name === 'admin';
}

/** DepartmentHead: управляет своим отделом */
export function isDepartmentHead(user: User): boolean {
  return user.type === 'EMPLOYEE' && user.employee?.role.name === 'departmentHead';
}

/** SeniorManager: назначает курсы менеджерам своего отдела */
export function isSeniorManager(user: User): boolean {
  return user.type === 'EMPLOYEE' && user.employee?.role.name === 'seniorManager';
}

/** Может назначать курсы другим сотрудникам */
export function canAssignCourses(user: User): boolean {
  return isAdmin(user) || isDepartmentHead(user) || isSeniorManager(user);
}

/** Может создавать курсы */
export function canCreateCourses(user: User): boolean {
  return isAdmin(user) || isDepartmentHead(user);
}
