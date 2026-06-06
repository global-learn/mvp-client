// Приглашение сотрудника — admin создаёт аккаунт, система отправляет ссылку.
// Mock до бэкенда.

export type InviteStatus =
  | 'active'   // пользователь перешёл по ссылке и вошёл — зелёный
  | 'pending'  // ссылка отправлена, ещё не перешёл — жёлтый
  | 'expired'; // срок ссылки истёк — красный

export interface EmployeeInvite {
  id: string;
  type: 'EMPLOYEE';
  email: string;
  fullname: string | null;
  password: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
  department: { id: string; name: string };
  role: { id: string; name: string };
}

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
