import type { AdminEnrollmentRecord } from '../model/controlTypes';

// ================================================================
// MOCK API для страницы контроля прохождения курсов
// Бэкенд: GET /admin/enrollments?type=EMPLOYEE|CLIENT
// ================================================================

const MOCK_RECORDS: AdminEnrollmentRecord[] = [
  // ── Сотрудники ──────────────────────────────────────────────
  // Ислам Гадиляев (admin, IT отдел)
  { userId: 'emp-admin', userName: 'Ислам Гадиляев',   userEmail: 'admin@test.com',  userType: 'EMPLOYEE', department: 'IT отдел',  courseId: '1', courseTitle: 'Основы JavaScript',              courseType: 'employee', status: 'completed',   progress: 100, assignedAt: '2024-02-01' },
  { userId: 'emp-admin', userName: 'Ислам Гадиляев',   userEmail: 'admin@test.com',  userType: 'EMPLOYEE', department: 'IT отдел',  courseId: '2', courseTitle: 'React для начинающих',          courseType: 'employee', status: 'completed',   progress: 100, assignedAt: '2024-03-01' },
  { userId: 'emp-admin', userName: 'Ислам Гадиляев',   userEmail: 'admin@test.com',  userType: 'EMPLOYEE', department: 'IT отдел',  courseId: '3', courseTitle: 'Git и командная разработка',    courseType: 'all',      status: 'completed',   progress: 100, assignedAt: '2024-04-01' },

  // Дмитрий Козлов (developer, IT отдел)
  { userId: 'emp-5', userName: 'Дмитрий Козлов',  userEmail: 'dmitry@corp.ru',  userType: 'EMPLOYEE', department: 'IT отдел',  courseId: '1', courseTitle: 'Основы JavaScript',              courseType: 'employee', status: 'completed',   progress: 100, assignedAt: '2024-02-05' },
  { userId: 'emp-5', userName: 'Дмитрий Козлов',  userEmail: 'dmitry@corp.ru',  userType: 'EMPLOYEE', department: 'IT отдел',  courseId: '2', courseTitle: 'React для начинающих',          courseType: 'employee', status: 'in_progress', progress: 65,  assignedAt: '2024-03-05' },
  { userId: 'emp-5', userName: 'Дмитрий Козлов',  userEmail: 'dmitry@corp.ru',  userType: 'EMPLOYEE', department: 'IT отдел',  courseId: '3', courseTitle: 'Git и командная разработка',    courseType: 'all',      status: 'in_progress', progress: 30,  assignedAt: '2024-04-05' },

  // Анна Серова (developer, IT отдел)
  { userId: 'emp-6', userName: 'Анна Серова',     userEmail: 'anna@corp.ru',    userType: 'EMPLOYEE', department: 'IT отдел',  courseId: '1', courseTitle: 'Основы JavaScript',              courseType: 'employee', status: 'in_progress', progress: 45,  assignedAt: '2024-02-10' },
  { userId: 'emp-6', userName: 'Анна Серова',     userEmail: 'anna@corp.ru',    userType: 'EMPLOYEE', department: 'IT отдел',  courseId: '2', courseTitle: 'React для начинающих',          courseType: 'employee', status: 'not_enrolled', progress: 0,  assignedAt: '2024-03-10' },
  { userId: 'emp-6', userName: 'Анна Серова',     userEmail: 'anna@corp.ru',    userType: 'EMPLOYEE', department: 'IT отдел',  courseId: '3', courseTitle: 'Git и командная разработка',    courseType: 'all',      status: 'not_enrolled', progress: 0,  assignedAt: '2024-04-10' },

  // Мария Иванова (employee, Продажи)
  { userId: 'emp-2', userName: 'Мария Иванова',   userEmail: 'user@test.com',   userType: 'EMPLOYEE', department: 'Продажи',   courseId: '1', courseTitle: 'Основы JavaScript',              courseType: 'employee', status: 'not_enrolled', progress: 0,  assignedAt: '2024-02-15' },
  { userId: 'emp-2', userName: 'Мария Иванова',   userEmail: 'user@test.com',   userType: 'EMPLOYEE', department: 'Продажи',   courseId: '3', courseTitle: 'Git и командная разработка',    courseType: 'all',      status: 'completed',   progress: 100, assignedAt: '2024-04-15' },

  // Сергей Волков (employee, Продажи)
  { userId: 'emp-3', userName: 'Сергей Волков',   userEmail: 'serg@corp.ru',    userType: 'EMPLOYEE', department: 'Продажи',   courseId: '1', courseTitle: 'Основы JavaScript',              courseType: 'employee', status: 'in_progress', progress: 20,  assignedAt: '2024-02-18' },
  { userId: 'emp-3', userName: 'Сергей Волков',   userEmail: 'serg@corp.ru',    userType: 'EMPLOYEE', department: 'Продажи',   courseId: '3', courseTitle: 'Git и командная разработка',    courseType: 'all',      status: 'in_progress', progress: 50,  assignedAt: '2024-04-18' },

  // Наталья Орлова (manager, HR)
  { userId: 'emp-4', userName: 'Наталья Орлова',  userEmail: 'nataly@corp.ru',  userType: 'EMPLOYEE', department: 'HR',        courseId: '1', courseTitle: 'Основы JavaScript',              courseType: 'employee', status: 'completed',   progress: 100, assignedAt: '2024-02-20' },
  { userId: 'emp-4', userName: 'Наталья Орлова',  userEmail: 'nataly@corp.ru',  userType: 'EMPLOYEE', department: 'HR',        courseId: '2', courseTitle: 'React для начинающих',          courseType: 'employee', status: 'not_enrolled', progress: 0,  assignedAt: '2024-03-20' },
  { userId: 'emp-4', userName: 'Наталья Орлова',  userEmail: 'nataly@corp.ru',  userType: 'EMPLOYEE', department: 'HR',        courseId: '3', courseTitle: 'Git и командная разработка',    courseType: 'all',      status: 'not_enrolled', progress: 0,  assignedAt: '2024-04-20' },

  // Ольга Смирнова (accountant, Финансы)
  { userId: 'emp-7', userName: 'Ольга Смирнова',  userEmail: 'olga@corp.ru',    userType: 'EMPLOYEE', department: 'Финансы',   courseId: '3', courseTitle: 'Git и командная разработка',    courseType: 'all',      status: 'in_progress', progress: 80,  assignedAt: '2024-04-22' },

  // ── Клиенты ─────────────────────────────────────────────────
  // Иван Соколов (ТехноСтрой)
  { userId: 'cl-1', userName: 'Иван Соколов',        userEmail: 'ivan@technostroy.ru',  userType: 'CLIENT', companyName: 'ТехноСтрой', courseId: '3', courseTitle: 'Git и командная разработка',       courseType: 'all',    status: 'completed',    progress: 100, assignedAt: '2024-05-01' },
  { userId: 'cl-1', userName: 'Иван Соколов',        userEmail: 'ivan@technostroy.ru',  userType: 'CLIENT', companyName: 'ТехноСтрой', courseId: '4', courseTitle: 'Введение в продукт для клиентов', courseType: 'client', status: 'in_progress',  progress: 60,  assignedAt: '2024-05-01' },

  // Анна Фёдорова (ТехноСтрой)
  { userId: 'cl-2', userName: 'Анна Фёдорова',       userEmail: 'anna@technostroy.ru',  userType: 'CLIENT', companyName: 'ТехноСтрой', courseId: '3', courseTitle: 'Git и командная разработка',       courseType: 'all',    status: 'not_enrolled', progress: 0,   assignedAt: '2024-05-01' },
  { userId: 'cl-2', userName: 'Анна Фёдорова',       userEmail: 'anna@technostroy.ru',  userType: 'CLIENT', companyName: 'ТехноСтрой', courseId: '4', courseTitle: 'Введение в продукт для клиентов', courseType: 'client', status: 'completed',    progress: 100, assignedAt: '2024-05-01' },

  // Марина Белова (МедиаГрупп)
  { userId: 'cl-4', userName: 'Марина Белова',       userEmail: 'marina@mediagroup.ru', userType: 'CLIENT', companyName: 'МедиаГрупп', courseId: '4', courseTitle: 'Введение в продукт для клиентов', courseType: 'client', status: 'in_progress',  progress: 30,  assignedAt: '2024-05-05' },

  // Александр Новиков (АгроПрайм)
  { userId: 'cl-5', userName: 'Александр Новиков',   userEmail: 'alex@agroprime.ru',    userType: 'CLIENT', companyName: 'АгроПрайм',  courseId: '3', courseTitle: 'Git и командная разработка',       courseType: 'all',    status: 'in_progress',  progress: 45,  assignedAt: '2024-05-10' },
  { userId: 'cl-5', userName: 'Александр Новиков',   userEmail: 'alex@agroprime.ru',    userType: 'CLIENT', companyName: 'АгроПрайм',  courseId: '4', courseTitle: 'Введение в продукт для клиентов', courseType: 'client', status: 'not_enrolled', progress: 0,   assignedAt: '2024-05-10' },

  // Елена Попова (АгроПрайм)
  { userId: 'cl-6', userName: 'Елена Попова',        userEmail: 'elena@agroprime.ru',   userType: 'CLIENT', companyName: 'АгроПрайм',  courseId: '3', courseTitle: 'Git и командная разработка',       courseType: 'all',    status: 'completed',    progress: 100, assignedAt: '2024-05-10' },
  { userId: 'cl-6', userName: 'Елена Попова',        userEmail: 'elena@agroprime.ru',   userType: 'CLIENT', companyName: 'АгроПрайм',  courseId: '4', courseTitle: 'Введение в продукт для клиентов', courseType: 'client', status: 'completed',    progress: 100, assignedAt: '2024-05-10' },
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
