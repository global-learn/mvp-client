// Система приглашений — admin создаёт аккаунт, система отправляет ссылку.
// Пока бэкенда нет — всё в mock состоянии.

export type InviteStatus =
  | 'active'   // пользователь перешёл по ссылке и вошёл — зелёный
  | 'pending'  // ссылка отправлена, ещё не перешёл — жёлтый
  | 'expired'; // срок ссылки истёк — красный

interface InviteBase {
  id: string;
  email: string;
  fullname: string | null;
  password: string; // хранит admin при создании; в реальности — хешируется на бэке
  status: InviteStatus;
  createdAt: string;
  expiresAt: string; // ISO date — через 7 дней после createdAt
}

export interface EmployeeInvite extends InviteBase {
  type: 'EMPLOYEE';
  department: { id: string; name: string };
  role: { id: string; name: string };
}

export interface ClientInvite extends InviteBase {
  type: 'CLIENT';
  companyId: string;
  companyName: string;
}

export type Invite = EmployeeInvite | ClientInvite;

/** Вычисляет статус по дате истечения (для свежесозданных invite) */
export function computeStatus(expiresAt: string): InviteStatus {
  return new Date(expiresAt) > new Date() ? 'pending' : 'expired';
}

/** createdAt + 7 дней */
export function makeExpiresAt(createdAt: string): string {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}
