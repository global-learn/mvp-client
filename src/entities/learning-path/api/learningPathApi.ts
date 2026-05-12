import type { LearningPath, LearningPathStep } from '../model/types';

// ================================================================
// Mock-данные
// ================================================================

let mockPaths: LearningPath[] = [
  {
    id: 'path-dev',
    title: 'Путь разработчика',
    description: 'Последовательный маршрут для погружения в современный стек: JS → React → командная разработка. Каждый следующий курс открывается после завершения предыдущего.',
    createdBy: 'user-admin',
    createdByName: 'Администратор',
    targetType: 'all',
    steps: [
      {
        id: 'ps-dev-1', order: 1, courseId: '1',
        courseTitle: 'Основы JavaScript',
        courseDescription: 'Переменные, функции, объекты, асинхронность. Обязательный базовый курс.',
      },
      {
        id: 'ps-dev-2', order: 2, courseId: '2',
        courseTitle: 'React для начинающих',
        courseDescription: 'Компоненты, хуки, роутинг. Практический курс — строим реальный портал.',
      },
      {
        id: 'ps-dev-3', order: 3, courseId: '3',
        courseTitle: 'Git и командная разработка',
        courseDescription: 'Ветки, мёрж, конфликты, pull requests. Как продуктивно работать в команде.',
      },
    ],
    status: 'published',
    createdAt: '2024-02-01',
  },
  {
    id: 'path-sales',
    title: 'Базовый трек для продаж',
    description: 'Минимальный набор знаний для эффективной работы в команде продаж. Начинаем с командных инструментов, затем — специализированный курс.',
    createdBy: 'user-admin',
    createdByName: 'Администратор',
    targetType: 'department',
    targetDepartmentId: 'dept-sales',
    targetDepartmentName: 'Департамент продаж',
    steps: [
      {
        id: 'ps-sales-1', order: 1, courseId: '3',
        courseTitle: 'Git и командная разработка',
        courseDescription: 'Совместная работа с документами и задачами — обязательный навык.',
      },
      {
        id: 'ps-sales-2', order: 2, courseId: '1',
        courseTitle: 'Основы JavaScript',
        courseDescription: 'Базовые технические навыки для работы с внутренними скриптами CRM.',
      },
    ],
    status: 'published',
    createdAt: '2024-03-15',
  },
  {
    id: 'path-monitoring',
    title: 'Аналитика и мониторинг',
    description: 'Трек для сотрудников отдела мониторинга: от базовых инструментов до работы со скриптами.',
    createdBy: 'user-admin',
    createdByName: 'Администратор',
    targetType: 'division',
    targetDivisionId: 'div-meat',
    targetDivisionName: 'Отдел мясной промышленности',
    targetDepartmentId: 'dept-monitoring',
    targetDepartmentName: 'Департамент мониторинга',
    steps: [
      {
        id: 'ps-mon-1', order: 1, courseId: '1',
        courseTitle: 'Основы JavaScript',
        courseDescription: 'Необходим для работы с аналитическими скриптами.',
      },
      {
        id: 'ps-mon-2', order: 2, courseId: '3',
        courseTitle: 'Git и командная разработка',
        courseDescription: 'Версионирование отчётов и командная работа.',
      },
    ],
    status: 'published',
    createdAt: '2024-04-01',
  },
];

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export const learningPathApi = {
  async getPaths(): Promise<LearningPath[]> {
    await delay(200);
    return [...mockPaths];
  },

  async getPathById(id: string): Promise<LearningPath | undefined> {
    await delay(150);
    return mockPaths.find(p => p.id === id);
  },

  async createPath(data: Omit<LearningPath, 'id' | 'createdAt'>): Promise<LearningPath> {
    await delay(300);
    const path: LearningPath = {
      ...data,
      id: `path-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockPaths = [...mockPaths, path];
    return path;
  },

  async updatePath(id: string, patch: Partial<LearningPath>): Promise<LearningPath> {
    await delay(200);
    const idx = mockPaths.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Path not found');
    const updated = { ...mockPaths[idx], ...patch };
    mockPaths = [...mockPaths.slice(0, idx), updated, ...mockPaths.slice(idx + 1)];
    return updated;
  },

  async publishPath(id: string): Promise<LearningPath> {
    return this.updatePath(id, { status: 'published' });
  },

  async deletePath(id: string): Promise<void> {
    await delay(200);
    mockPaths = mockPaths.filter(p => p.id !== id);
  },

  async updateSteps(id: string, steps: LearningPathStep[]): Promise<LearningPath> {
    return this.updatePath(id, { steps });
  },
};
