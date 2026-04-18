// Типы пользователей — соответствуют schema.prisma
// UserType: EMPLOYEE (сотрудник компании) | CLIENT (пользователь клиентской компании)

export type UserType = 'EMPLOYEE' | 'CLIENT';

export interface UserRole {
  id: string;
  name: string; // динамические роли: 'admin', 'manager', 'developer', 'employee', etc.
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

export interface User {
  id: string;
  email: string;
  fullname: string | null;
  type: UserType;
  avatar?: UserAvatar;
  employee?: EmployeeProfile; // присутствует только когда type === 'EMPLOYEE'
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

/** Проверка роли admin: только EMPLOYEE с role.name === 'admin' */
export function isAdmin(user: User): boolean {
  return user.type === 'EMPLOYEE' && user.employee?.role.name === 'admin';
}

/** Может контролировать прохождение курсов: admin или manager */
export function canControl(user: User): boolean {
  if (user.type !== 'EMPLOYEE') return false;
  const role = user.employee?.role.name;
  return role === 'admin' || role === 'manager';
}
