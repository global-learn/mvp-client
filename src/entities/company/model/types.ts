// Типы для клиентских компаний и внутренней структуры компании
// Соответствуют schema.prisma: Company, Client, Department, Employee

// ---- Клиентские компании (страница /clients) ----

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

// ---- Внутренняя структура компании (страница /company) ----

export interface EmployeeListItem {
  id: string;
  fullname: string | null;
  email: string;
  role: { id: string; name: string };
  department: { id: string; name: string };
  birthDate: string;
  employmentDate: string;
}

export interface Department {
  id: string;
  name: string;
  employees: EmployeeListItem[];
}
