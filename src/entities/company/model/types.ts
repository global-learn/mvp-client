// Типы для клиентских компаний и внутренней структуры компании
// Соответствуют schema.prisma: Company, Client, Department, Division, Position, Employee

import type { EmployeeRole } from '@entities/user/model/types';

// ================================================================
// Клиентские компании (страница /clients)
// ================================================================

export interface CompanyClient {
  id: string;
  fullname: string | null;
  email: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  clients: CompanyClient[];
}

// ================================================================
// Внутренняя структура: Департамент → Отдел → Должность
// ================================================================

export interface Position {
  id: string;
  name: string;
}

export interface Division {
  id: string;
  name: string;
  departmentId: string;
  /** Отдел сервиса — сотрудники могут работать с клиентами */
  isService?: boolean;
  positions: Position[];
  employees: EmployeeListItem[];
}

export interface Department {
  id: string;
  name: string;
  divisions: Division[];
}

// ================================================================
// Сотрудник в контексте /company
// ================================================================

export interface EmployeeListItem {
  id: string;
  fullname: string | null;
  email: string;
  role: { id: string; name: EmployeeRole };
  department: { id: string; name: string };
  division:   { id: string; name: string; isService?: boolean };
  position:   { id: string; name: string };
  birthDate: string;
  employmentDate: string;
}
