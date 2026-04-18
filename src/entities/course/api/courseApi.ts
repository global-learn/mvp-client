import type { Course, Enrollment, CreateCourseDto } from '../model/types';

// ================================================================
// API СЛОЙ — интерфейс к бэкенду
// ================================================================
// Сейчас: возвращает мок-данные с симуляцией задержки.
// Когда появится бэкенд — меняешь реализацию функций, НЕ их сигнатуры.
//
// Для реального API раскомментируй:
// import { api } from '@shared/api/axios';

let mockCourses: Course[] = [
  {
    id: '1',
    title: 'Основы JavaScript',
    description: 'Переменные, функции, объекты, асинхронность. Обязательный базовый курс для всех разработчиков компании.',
    authorId: 'user-admin',
    status: 'published',
    courseType: 'employee',
    createdAt: '2024-01-15',
    lessonsCount: 12,
  },
  {
    id: '2',
    title: 'React для начинающих',
    description: 'Компоненты, хуки, роутинг. Практический курс — строим реальный портал обучения.',
    authorId: 'user-admin',
    status: 'published',
    courseType: 'employee',
    createdAt: '2024-02-10',
    lessonsCount: 8,
  },
  {
    id: '3',
    title: 'Git и командная разработка',
    description: 'Ветки, мёрж, конфликты, pull requests. Как продуктивно работать в команде.',
    authorId: 'user-admin',
    status: 'published',
    courseType: 'all',
    createdAt: '2024-03-05',
    lessonsCount: 6,
  },
  {
    id: '4',
    title: 'Введение в продукт для клиентов',
    description: 'Обзор возможностей платформы. Как пользоваться порталом обучения и отслеживать прогресс.',
    authorId: 'user-admin',
    status: 'published',
    courseType: 'client',
    createdAt: '2024-04-01',
    lessonsCount: 4,
  },
];

let mockEnrollments: Enrollment[] = [];

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
    const existing = mockEnrollments.find(e => e.courseId === courseId && e.userId === userId);
    if (existing) return existing;

    const enrollment: Enrollment = { courseId, userId, status: 'in_progress', progress: 0 };
    mockEnrollments = [...mockEnrollments, enrollment];
    return enrollment;
  },

  // Назначение курса другому пользователю (только admin)
  async assignCourse(courseId: string, userId: string): Promise<Enrollment> {
    await delay(200);
    // Реальный API: return (await api.post<Enrollment>('/enrollments/assign', { courseId, userId })).data;
    return this.enroll(courseId, userId);
  },
};
