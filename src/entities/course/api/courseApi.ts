import type { Course, Enrollment, CreateCourseDto, EmployeeForAssignment } from '../model/types';

// ================================================================
// API СЛОЙ — интерфейс к бэкенду
// ================================================================
// Сейчас: возвращает мок-данные с симуляцией задержки.
// Когда появится бэкенд — меняешь реализацию функций, НЕ их сигнатуры.
// Контекст и компоненты не трогаешь — они не знают мок это или нет.
//
// Для реального API раскомментируй:
// import { api } from '@shared/api/axios';

// ---- Мок-данные (изменяемые через let — имитируем "базу данных") ----
let mockCourses: Course[] = [
  {
    id: '1',
    title: 'Основы JavaScript',
    description:
      'Переменные, функции, объекты, асинхронность. Обязательный базовый курс для всех разработчиков компании.',
    authorId: 'user-admin',
    status: 'published',
    createdAt: '2024-01-15',
    lessonsCount: 12,
  },
  {
    id: '2',
    title: 'React для начинающих',
    description:
      'Компоненты, хуки, роутинг. Практический курс — строим реальный портал обучения.',
    authorId: 'user-admin',
    status: 'published',
    createdAt: '2024-02-10',
    lessonsCount: 8,
  },
  {
    id: '3',
    title: 'Git и командная разработка',
    description:
      'Ветки, мёрж, конфликты, pull requests. Как продуктивно работать в команде.',
    authorId: 'user-admin',
    status: 'published',
    createdAt: '2024-03-05',
    lessonsCount: 6,
  },
];

let mockEnrollments: Enrollment[] = [];

// Сотрудники компании (для назначения курсов).
// userId совпадает с User.id из UserContext.
const MOCK_EMPLOYEES: EmployeeForAssignment[] = [
  { userId: 'user-admin',  fullname: 'Алексей Петров',   email: 'admin@test.com',   role: { id: 'role-admin',   name: 'admin' },          department: { id: 'dept-1', name: 'IT отдел' } },
  { userId: 'user-head',   fullname: 'Дмитрий Козлов',   email: 'head@test.com',    role: { id: 'role-depthead', name: 'departmentHead' }, department: { id: 'dept-1', name: 'IT отдел' } },
  { userId: 'user-emp-1',  fullname: 'Анна Серова',       email: 'anna@corp.ru',     role: { id: 'r2', name: 'developer' },                department: { id: 'dept-1', name: 'IT отдел' } },
  { userId: 'user-emp-2',  fullname: 'Иван Соколов',      email: 'ivan@corp.ru',     role: { id: 'r4', name: 'manager' },                  department: { id: 'dept-1', name: 'IT отдел' } },
  { userId: 'user-senior', fullname: 'Наталья Орлова',    email: 'senior@test.com',  role: { id: 'role-senior', name: 'seniorManager' },   department: { id: 'dept-2', name: 'Продажи' } },
  { userId: 'user-emp-3',  fullname: 'Мария Иванова',     email: 'user@test.com',    role: { id: 'r3', name: 'employee' },                 department: { id: 'dept-2', name: 'Продажи' } },
  { userId: 'user-emp-4',  fullname: 'Сергей Волков',     email: 'serg@corp.ru',     role: { id: 'r4', name: 'manager' },                  department: { id: 'dept-2', name: 'Продажи' } },
  { userId: 'user-emp-5',  fullname: 'Елена Попова',      email: 'elena@corp.ru',    role: { id: 'r4', name: 'manager' },                  department: { id: 'dept-3', name: 'HR' } },
  { userId: 'user-emp-6',  fullname: 'Ольга Смирнова',    email: 'olga@corp.ru',     role: { id: 'r5', name: 'accountant' },               department: { id: 'dept-4', name: 'Финансы' } },
];

// Имитация задержки сети (чтобы видеть состояния загрузки)
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const courseApi = {
  async getCourses(): Promise<Course[]> {
    await delay(300);
    // Реальный API: return (await api.get<Course[]>('/courses')).data;
    return mockCourses.filter(c => c.status === 'published');
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    await delay(200);
    // Реальный API: return (await api.get<Course>(`/courses/${id}`)).data;
    return mockCourses.find(c => c.id === id);
  },

  async createCourse(dto: CreateCourseDto): Promise<Course> {
    await delay(400);
    // Реальный API: return (await api.post<Course>('/courses', dto)).data;
    const newCourse: Course = {
      ...dto,
      id: String(Date.now()),
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockCourses = [...mockCourses, newCourse];
    return newCourse;
  },

  async getEnrollments(userId: string): Promise<Enrollment[]> {
    await delay(200);
    // Реальный API: return (await api.get<Enrollment[]>(`/users/${userId}/enrollments`)).data;
    return mockEnrollments.filter(e => e.userId === userId);
  },

  async enroll(courseId: string, userId: string): Promise<Enrollment> {
    await delay(300);
    // Реальный API: return (await api.post<Enrollment>('/enrollments', { courseId, userId })).data;
    const existing = mockEnrollments.find(
      e => e.courseId === courseId && e.userId === userId,
    );
    if (existing) return existing;

    const enrollment: Enrollment = {
      courseId,
      userId,
      status: 'in_progress',
      progress: 0,
      completedLessonCount: 0,
    };
    mockEnrollments = [...mockEnrollments, enrollment];
    return enrollment;
  },

  // Назначить курс конкретному сотруднику (создаёт enrollment от его имени)
  async assignCourse(courseId: string, targetUserId: string): Promise<Enrollment> {
    await delay(300);
    // Реальный API: return (await api.post<Enrollment>('/enrollments/assign', { courseId, targetUserId })).data;
    return courseApi.enroll(courseId, targetUserId);
  },

  // Отметить урок пройденным — инкрементирует прогресс
  async completeLesson(courseId: string, userId: string, totalLessons: number): Promise<Enrollment> {
    await delay(150);
    // Реальный API: return (await api.post<Enrollment>(`/enrollments/${courseId}/lessons/complete`)).data;
    const idx = mockEnrollments.findIndex(e => e.courseId === courseId && e.userId === userId);
    if (idx === -1) throw new Error('Enrollment not found');

    const current = mockEnrollments[idx];
    if (current.status === 'completed') return current;

    const newCount = Math.min(current.completedLessonCount + 1, totalLessons);
    const newProgress = Math.round((newCount / totalLessons) * 100);
    const newStatus = newCount >= totalLessons ? 'completed' : 'in_progress';

    const updated: Enrollment = {
      ...current,
      completedLessonCount: newCount,
      progress: newProgress,
      status: newStatus,
    };
    mockEnrollments = mockEnrollments.map((e, i) => (i === idx ? updated : e));
    return updated;
  },

  // Список сотрудников доступных для назначения курса данным пользователем
  async getAssignableEmployees(opts: {
    userRole: string;
    departmentId: string;
    excludeUserId: string;
  }): Promise<EmployeeForAssignment[]> {
    await delay(200);
    // Реальный API: return (await api.get<EmployeeForAssignment[]>('/employees/assignable')).data;
    const { userRole, departmentId, excludeUserId } = opts;

    let list = MOCK_EMPLOYEES.filter(e => e.userId !== excludeUserId);

    if (userRole === 'admin') {
      // admin видит всех
      return list;
    }
    if (userRole === 'departmentHead') {
      // departmentHead — только свой отдел
      return list.filter(e => e.department.id === departmentId);
    }
    if (userRole === 'seniorManager') {
      // seniorManager — только manager'ы своего отдела
      return list.filter(e => e.department.id === departmentId && e.role.name === 'manager');
    }
    return [];
  },
};
