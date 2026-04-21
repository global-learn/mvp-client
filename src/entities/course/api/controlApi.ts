import type { AdminEnrollmentRecord } from '../model/controlTypes';

// ================================================================
// MOCK API для страницы контроля прохождения курсов
// Бэкенд: GET /admin/enrollments?type=EMPLOYEE|CLIENT
// ================================================================

const MOCK_RECORDS: AdminEnrollmentRecord[] = [
  // ── Сотрудники — Департамент маркетинга ─────────────────────────
  // Ислам Гадиляев (admin, Отдел разработки)
  { userId: 'emp-admin', userName: 'Ислам Гадиляев',   userEmail: 'admin@test.com',    userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '1', courseTitle: 'Основы JavaScript',           courseType: 'employee', status: 'completed',    progress: 100, assignedAt: '2024-02-01' },
  { userId: 'emp-admin', userName: 'Ислам Гадиляев',   userEmail: 'admin@test.com',    userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '2', courseTitle: 'React для начинающих',        courseType: 'employee', status: 'completed',    progress: 100, assignedAt: '2024-03-01' },
  { userId: 'emp-admin', userName: 'Ислам Гадиляев',   userEmail: 'admin@test.com',    userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '3', courseTitle: 'Git и командная разработка',  courseType: 'all',      status: 'completed',    progress: 100, assignedAt: '2024-04-01' },

  // Дмитрий Козлов (department_head, Отдел разработки)
  { userId: 'emp-5',     userName: 'Дмитрий Козлов',   userEmail: 'depthead@test.com', userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '1', courseTitle: 'Основы JavaScript',           courseType: 'employee', status: 'completed',    progress: 100, assignedAt: '2024-02-05' },
  { userId: 'emp-5',     userName: 'Дмитрий Козлов',   userEmail: 'depthead@test.com', userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '2', courseTitle: 'React для начинающих',        courseType: 'employee', status: 'in_progress',  progress: 65,  assignedAt: '2024-03-05' },
  { userId: 'emp-5',     userName: 'Дмитрий Козлов',   userEmail: 'depthead@test.com', userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '3', courseTitle: 'Git и командная разработка',  courseType: 'all',      status: 'in_progress',  progress: 30,  assignedAt: '2024-04-05' },

  // Анна Серова (senior_manager, Отдел разработки)
  { userId: 'emp-6',     userName: 'Анна Серова',       userEmail: 'senior@test.com',   userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '1', courseTitle: 'Основы JavaScript',           courseType: 'employee', status: 'in_progress',  progress: 45,  assignedAt: '2024-02-10' },
  { userId: 'emp-6',     userName: 'Анна Серова',       userEmail: 'senior@test.com',   userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '2', courseTitle: 'React для начинающих',        courseType: 'employee', status: 'not_enrolled', progress: 0,   assignedAt: '2024-03-10' },
  { userId: 'emp-6',     userName: 'Анна Серова',       userEmail: 'senior@test.com',   userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '3', courseTitle: 'Git и командная разработка',  courseType: 'all',      status: 'not_enrolled', progress: 0,   assignedAt: '2024-04-10' },

  // Иван Петров (division_head, Отдел разработки)
  { userId: 'emp-divhead', userName: 'Иван Петров',     userEmail: 'divhead@test.com',  userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '1', courseTitle: 'Основы JavaScript',           courseType: 'employee', status: 'completed',    progress: 100, assignedAt: '2024-02-12' },
  { userId: 'emp-divhead', userName: 'Иван Петров',     userEmail: 'divhead@test.com',  userType: 'EMPLOYEE', department: 'Департамент маркетинга', division: 'Отдел разработки', courseId: '3', courseTitle: 'Git и командная разработка',  courseType: 'all',      status: 'in_progress',  progress: 55,  assignedAt: '2024-04-12' },

  // ── Сотрудники — Департамент продаж ─────────────────────────────
  // Мария Иванова (manager, Отдел продаж)
  { userId: 'emp-2', userName: 'Мария Иванова',   userEmail: 'user@test.com',     userType: 'EMPLOYEE', department: 'Департамент продаж', division: 'Отдел продаж', courseId: '1', courseTitle: 'Основы JavaScript',           courseType: 'employee', status: 'not_enrolled', progress: 0,   assignedAt: '2024-02-15' },
  { userId: 'emp-2', userName: 'Мария Иванова',   userEmail: 'user@test.com',     userType: 'EMPLOYEE', department: 'Департамент продаж', division: 'Отдел продаж', courseId: '3', courseTitle: 'Git и командная разработка',  courseType: 'all',      status: 'completed',    progress: 100, assignedAt: '2024-04-15' },

  // Сергей Волков (manager, Отдел продаж)
  { userId: 'emp-3', userName: 'Сергей Волков',   userEmail: 'serg@corp.ru',      userType: 'EMPLOYEE', department: 'Департамент продаж', division: 'Отдел продаж', courseId: '1', courseTitle: 'Основы JavaScript',           courseType: 'employee', status: 'in_progress',  progress: 20,  assignedAt: '2024-02-18' },
  { userId: 'emp-3', userName: 'Сергей Волков',   userEmail: 'serg@corp.ru',      userType: 'EMPLOYEE', department: 'Департамент продаж', division: 'Отдел продаж', courseId: '3', courseTitle: 'Git и командная разработка',  courseType: 'all',      status: 'in_progress',  progress: 50,  assignedAt: '2024-04-18' },

  // Виктор Кузнецов (manager, Отдел сервиса)
  { userId: 'emp-service', userName: 'Виктор Кузнецов', userEmail: 'service@test.com', userType: 'EMPLOYEE', department: 'Департамент продаж', division: 'Отдел сервиса', courseId: '3', courseTitle: 'Git и командная разработка',  courseType: 'all',      status: 'completed',    progress: 100, assignedAt: '2024-04-20' },

  // ── Сотрудники — Административный департамент ───────────────────
  // Наталья Орлова (manager, Финансовый отдел)
  { userId: 'emp-4', userName: 'Наталья Орлова',  userEmail: 'nataly@corp.ru',    userType: 'EMPLOYEE', department: 'Административный департамент', division: 'Финансовый отдел', courseId: '1', courseTitle: 'Основы JavaScript',           courseType: 'employee', status: 'completed',    progress: 100, assignedAt: '2024-02-20' },
  { userId: 'emp-4', userName: 'Наталья Орлова',  userEmail: 'nataly@corp.ru',    userType: 'EMPLOYEE', department: 'Административный департамент', division: 'Финансовый отдел', courseId: '3', courseTitle: 'Git и командная разработка',  courseType: 'all',      status: 'not_enrolled', progress: 0,   assignedAt: '2024-04-20' },

  // Ольга Смирнова (manager, Финансовый отдел)
  { userId: 'emp-7', userName: 'Ольга Смирнова',  userEmail: 'olga@corp.ru',      userType: 'EMPLOYEE', department: 'Административный департамент', division: 'Финансовый отдел', courseId: '3', courseTitle: 'Git и командная разработка',  courseType: 'all',      status: 'in_progress',  progress: 80,  assignedAt: '2024-04-22' },

  // ── Клиенты ─────────────────────────────────────────────────────
  { userId: 'cl-1', userName: 'Иван Соколов',      userEmail: 'ivan@technostroy.ru',  userType: 'CLIENT', companyName: 'ТехноСтрой', courseId: '3', courseTitle: 'Git и командная разработка',       courseType: 'all',    status: 'completed',    progress: 100, assignedAt: '2024-05-01' },
  { userId: 'cl-1', userName: 'Иван Соколов',      userEmail: 'ivan@technostroy.ru',  userType: 'CLIENT', companyName: 'ТехноСтрой', courseId: '4', courseTitle: 'Введение в продукт для клиентов', courseType: 'client', status: 'in_progress',  progress: 60,  assignedAt: '2024-05-01' },
  { userId: 'cl-2', userName: 'Анна Фёдорова',     userEmail: 'anna@technostroy.ru',  userType: 'CLIENT', companyName: 'ТехноСтрой', courseId: '3', courseTitle: 'Git и командная разработка',       courseType: 'all',    status: 'not_enrolled', progress: 0,   assignedAt: '2024-05-01' },
  { userId: 'cl-2', userName: 'Анна Фёдорова',     userEmail: 'anna@technostroy.ru',  userType: 'CLIENT', companyName: 'ТехноСтрой', courseId: '4', courseTitle: 'Введение в продукт для клиентов', courseType: 'client', status: 'completed',    progress: 100, assignedAt: '2024-05-01' },
  { userId: 'cl-4', userName: 'Марина Белова',     userEmail: 'marina@mediagroup.ru', userType: 'CLIENT', companyName: 'МедиаГрупп', courseId: '4', courseTitle: 'Введение в продукт для клиентов', courseType: 'client', status: 'in_progress',  progress: 30,  assignedAt: '2024-05-05' },
  { userId: 'cl-5', userName: 'Александр Новиков', userEmail: 'alex@agroprime.ru',    userType: 'CLIENT', companyName: 'АгроПрайм',  courseId: '3', courseTitle: 'Git и командная разработка',       courseType: 'all',    status: 'in_progress',  progress: 45,  assignedAt: '2024-05-10' },
  { userId: 'cl-5', userName: 'Александр Новиков', userEmail: 'alex@agroprime.ru',    userType: 'CLIENT', companyName: 'АгроПрайм',  courseId: '4', courseTitle: 'Введение в продукт для клиентов', courseType: 'client', status: 'not_enrolled', progress: 0,   assignedAt: '2024-05-10' },
  { userId: 'cl-6', userName: 'Елена Попова',      userEmail: 'elena@agroprime.ru',   userType: 'CLIENT', companyName: 'АгроПрайм',  courseId: '3', courseTitle: 'Git и командная разработка',       courseType: 'all',    status: 'completed',    progress: 100, assignedAt: '2024-05-10' },
  { userId: 'cl-6', userName: 'Елена Попова',      userEmail: 'elena@agroprime.ru',   userType: 'CLIENT', companyName: 'АгроПрайм',  courseId: '4', courseTitle: 'Введение в продукт для клиентов', courseType: 'client', status: 'completed',    progress: 100, assignedAt: '2024-05-10' },
];

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const controlApi = {
  /** Получить все записи о прохождении для сотрудников */
  async getEmployeeEnrollments(): Promise<AdminEnrollmentRecord[]> {
    await delay(300);
    return MOCK_RECORDS.filter(r => r.userType === 'EMPLOYEE');
  },

  /** Получить все записи о прохождении для клиентов */
  async getClientEnrollments(): Promise<AdminEnrollmentRecord[]> {
    await delay(300);
    return MOCK_RECORDS.filter(r => r.userType === 'CLIENT');
  },
};
