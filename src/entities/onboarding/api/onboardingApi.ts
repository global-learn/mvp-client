import type {
  OnboardingTemplate,
  OnboardingAssignment,
  OnboardingStep,
  OnboardingMessage,
  StepFeedback,
} from '../model/types';

// ================================================================
// Mock-данные: шаблоны онбординга
// ================================================================

let mockTemplates: OnboardingTemplate[] = [
  {
    id: 'tmpl-sales',
    title: 'Онбординг: Отдел продаж',
    description: 'Базовый онбординг для новых менеджеров отдела продаж.',
    targetDivisionId: 'div-sales',
    targetDivisionName: 'Отдел продаж',
    targetDepartmentId: 'dept-sales',
    targetDepartmentName: 'Департамент продаж',
    targetRole: 'manager',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: '2024-01-10',
    steps: [
      { id: 'tmpl-s-1', order: 1, required: true,  type: 'document', title: 'Прочитать регламент отдела',       description: 'Ознакомьтесь с внутренними правилами и процессами отдела продаж. Документ в папке Team Docs.' },
      { id: 'tmpl-s-2', order: 2, required: true,  type: 'meeting',  title: 'Встреча с руководителем',           description: 'Индивидуальная встреча с непосредственным руководителем — знакомство и постановка первых задач.' },
      { id: 'tmpl-s-3', order: 3, required: true,  type: 'course',   title: 'Курс «Основы продаж»',             description: 'Пройдите базовый курс по техникам продаж на платформе. Тест в конце обязателен.', courseId: '1' },
      { id: 'tmpl-s-4', order: 4, required: false, type: 'task',     title: 'Настроить рабочее место',           description: 'Установите CRM, корпоративную почту и мессенджер. Инструкция в папке IT / Onboarding.' },
      { id: 'tmpl-s-5', order: 5, required: true,  type: 'task',     title: 'Провести первый звонок клиенту',   description: 'Под наблюдением ментора проведите первый звонок по скрипту. Запишите итоги в CRM.' },
      { id: 'tmpl-s-6', order: 6, required: false, type: 'video',    title: 'Посмотреть запись тренинга Q4',    description: 'Обязательно для понимания квартальных целей. Ссылка в корпоративном YouTube.' },
    ],
  },
  {
    id: 'tmpl-monitoring',
    title: 'Онбординг: Департамент мониторинга',
    description: 'Общий онбординг для новых сотрудников департамента мониторинга.',
    targetDepartmentId: 'dept-monitoring',
    targetDepartmentName: 'Департамент мониторинга',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: '2024-02-01',
    steps: [
      { id: 'tmpl-m-1', order: 1, required: true,  type: 'document', title: 'Регламент мониторинга рынка',      description: 'Ознакомьтесь с методологией и инструментами мониторинга.' },
      { id: 'tmpl-m-2', order: 2, required: true,  type: 'meeting',  title: 'Знакомство с командой',             description: 'Участие в еженедельном командном созвоне. Расписание у руководителя.' },
      { id: 'tmpl-m-3', order: 3, required: true,  type: 'course',   title: 'Курс «Основы JavaScript»',         description: 'Необходим для работы с внутренними аналитическими скриптами.', courseId: '1' },
      { id: 'tmpl-m-4', order: 4, required: false, type: 'task',     title: 'Подготовить первый мониторинговый отчёт', description: 'Используйте шаблон отчёта в Google Sheets. Срок — конец первой недели.' },
    ],
  },
  {
    id: 'tmpl-general',
    title: 'Общий онбординг компании',
    description: 'Универсальный онбординг для всех новых сотрудников.',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: '2024-01-01',
    steps: [
      { id: 'tmpl-g-1', order: 1, required: true,  type: 'document', title: 'Корпоративный кодекс',              description: 'Прочитайте кодекс корпоративной этики и подпишите электронную форму.' },
      { id: 'tmpl-g-2', order: 2, required: true,  type: 'task',     title: 'Заполнить профиль сотрудника',      description: 'Обновите данные в HR-системе: фото, контакты, информацию об образовании.' },
      { id: 'tmpl-g-3', order: 3, required: false, type: 'video',    title: 'Видео-экскурсия по офису',          description: 'Посмотрите короткое видео с описанием офисного пространства и правилами.' },
      { id: 'tmpl-g-4', order: 4, required: true,  type: 'meeting',  title: 'Встреча с HR',                      description: 'Расскажем об условиях работы, льготах и отвечаем на вопросы.' },
    ],
  },
];

// ================================================================
// Mock-назначения
// ================================================================

let mockAssignments: OnboardingAssignment[] = [
  {
    id: 'asgn-1',
    templateId: 'tmpl-sales',
    templateTitle: 'Онбординг: Отдел продаж',
    employeeId: 'user-current',   // текущий авторизованный пользователь
    employeeName: 'Мария Иванова',
    employeeEmail: 'user@test.com',
    assignedBy: 'user-admin',
    assignedByName: 'Администратор',
    divisionId: 'div-sales',
    divisionName: 'Отдел продаж',
    departmentId: 'dept-sales',
    departmentName: 'Департамент продаж',
    steps: [
      { id: 's-1', order: 1, required: true,  type: 'document', title: 'Прочитать регламент отдела',     description: 'Ознакомьтесь с внутренними правилами и процессами отдела продаж.', dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0] },
      { id: 's-2', order: 2, required: true,  type: 'meeting',  title: 'Встреча с руководителем',         description: 'Индивидуальная встреча — знакомство и постановка первых задач.', dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0] },
      { id: 's-3', order: 3, required: true,  type: 'course',   title: 'Курс «Основы JavaScript»',       description: 'Базовый курс. Тест в конце обязателен.', courseId: '1', dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0] },
      { id: 's-4', order: 4, required: false, type: 'task',     title: 'Настроить рабочее место',         description: 'Установите необходимые приложения по инструкции IT.' },
      { id: 's-5', order: 5, required: true,  type: 'task',     title: 'Провести первый звонок клиенту', description: 'Под наблюдением ментора. Запишите итоги в CRM.', dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0] },
    ],
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    completedSteps: ['s-1'],
    feedbacks: [
      { stepId: 's-1', text: 'Прочитал регламент, всё понятно. Особенно полезен раздел про процессы согласования.', submittedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
    ],
    status: 'in_progress',
    startedAt: '2024-05-01',
    messages: [
      {
        id: 'msg-1',
        senderId: 'user-admin',
        senderName: 'Администратор',
        text: 'Добро пожаловать в команду! 👋 Если возникнут вопросы по онбордингу — пиши сюда.',
        sentAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'asgn-2',
    templateId: 'tmpl-monitoring',
    templateTitle: 'Онбординг: Департамент мониторинга',
    employeeId: 'emp-10',
    employeeName: 'Павел Зайцев',
    employeeEmail: 'pavel@corp.ru',
    assignedBy: 'user-current',
    assignedByName: 'Мария Иванова',
    divisionId: 'div-meat',
    divisionName: 'Отдел мясной промышленности',
    departmentId: 'dept-monitoring',
    departmentName: 'Департамент мониторинга',
    steps: [
      { id: 'am-1', order: 1, required: true,  type: 'document', title: 'Регламент мониторинга рынка',  description: 'Ознакомьтесь с методологией.' },
      { id: 'am-2', order: 2, required: true,  type: 'meeting',  title: 'Знакомство с командой',         description: 'Участие в еженедельном созвоне.' },
      { id: 'am-3', order: 3, required: true,  type: 'course',   title: 'Курс «Основы JavaScript»',     description: 'Необходим для аналитических скриптов.', courseId: '1' },
      { id: 'am-4', order: 4, required: false, type: 'task',     title: 'Подготовить первый отчёт',     description: 'Шаблон в Google Sheets. Срок — конец первой недели.' },
    ],
    completedSteps: ['am-1', 'am-2'],
    feedbacks: [
      { stepId: 'am-1', text: 'Изучил методологию мониторинга и основные инструменты. Вопросов нет.', submittedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
      { stepId: 'am-2', text: 'Познакомился с командой на еженедельном созвоне, все очень приветливые!', submittedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
    ],
    status: 'in_progress',
    startedAt: '2024-05-03',
    messages: [
      {
        id: 'msg-2',
        senderId: 'user-current',
        senderName: 'Мария Иванова',
        text: 'Павел, привет! Начинай с регламента — там всё подробно расписано.',
        sentAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'msg-3',
        senderId: 'emp-10',
        senderName: 'Павел Зайцев',
        text: 'Спасибо! Уже прочитал, всё понятно. Когда встреча с командой?',
        sentAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'asgn-3',
    templateId: 'tmpl-general',
    templateTitle: 'Общий онбординг компании',
    employeeId: 'emp-11',
    employeeName: 'Екатерина Морозова',
    employeeEmail: 'kate@corp.ru',
    assignedBy: 'user-current',
    assignedByName: 'Мария Иванова',
    divisionId: 'div-retail',
    divisionName: 'Отдел сетевого ретейла',
    departmentId: 'dept-monitoring',
    departmentName: 'Департамент мониторинга',
    steps: [
      { id: 'ag-1', order: 1, required: true,  type: 'document', title: 'Корпоративный кодекс',       description: 'Прочитайте и подпишите форму.' },
      { id: 'ag-2', order: 2, required: true,  type: 'task',     title: 'Заполнить профиль',           description: 'Обновите данные в HR-системе.' },
      { id: 'ag-3', order: 3, required: false, type: 'video',    title: 'Видео-экскурсия по офису',   description: 'Короткое видео с описанием офиса.' },
      { id: 'ag-4', order: 4, required: true,  type: 'meeting',  title: 'Встреча с HR',               description: 'Расскажем об условиях работы.' },
    ],
    completedSteps: ['ag-1', 'ag-2', 'ag-3', 'ag-4'],
    feedbacks: [
      { stepId: 'ag-1', text: 'Ознакомилась с кодексом, подписала форму.', submittedAt: '2024-04-21T10:00:00.000Z' },
      { stepId: 'ag-2', text: 'Заполнила профиль полностью, добавила фото.', submittedAt: '2024-04-22T14:00:00.000Z' },
      { stepId: 'ag-3', text: 'Посмотрела видео, офис очень уютный.', submittedAt: '2024-04-24T11:00:00.000Z' },
      { stepId: 'ag-4', text: 'Встреча с HR прошла отлично, все вопросы прояснены.', submittedAt: '2024-04-27T16:00:00.000Z' },
    ],
    status: 'completed',
    startedAt: '2024-04-20',
    completedAt: '2024-04-27',
    messages: [
      {
        id: 'msg-4',
        senderId: 'user-current',
        senderName: 'Мария Иванова',
        text: 'Екатерина, поздравляю с завершением онбординга! 🎉',
        sentAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },

  // ── дополнительные назначения для демо-фильтрации ──────────────

  {
    id: 'asgn-4',
    templateId: 'tmpl-sales',
    templateTitle: 'Онбординг: Отдел продаж',
    employeeId: 'emp-3',
    employeeName: 'Сергей Волков',
    employeeEmail: 'serg@corp.ru',
    assignedBy: 'user-admin',
    assignedByName: 'Администратор',
    divisionId: 'div-sales',
    divisionName: 'Отдел продаж',
    departmentId: 'dept-sales',
    departmentName: 'Департамент продаж',
    steps: [
      { id: 'as4-1', order: 1, required: true,  type: 'document', title: 'Прочитать регламент отдела', description: 'Ознакомьтесь с внутренними правилами.' },
      { id: 'as4-2', order: 2, required: true,  type: 'meeting',  title: 'Встреча с руководителем',   description: 'Знакомство и постановка задач.' },
      { id: 'as4-3', order: 3, required: true,  type: 'course',   title: 'Курс «Основы продаж»',      description: 'Базовый курс по техникам продаж.', courseId: '1' },
      { id: 'as4-4', order: 4, required: false, type: 'task',     title: 'Настроить рабочее место',   description: 'Установить CRM и корпоративную почту.' },
      { id: 'as4-5', order: 5, required: true,  type: 'task',     title: 'Первый звонок клиенту',     description: 'Под наблюдением ментора.' },
    ],
    completedSteps: ['as4-1', 'as4-2', 'as4-3', 'as4-4', 'as4-5'],
    feedbacks: [
      { stepId: 'as4-1', text: 'Регламент изучил полностью.', submittedAt: '2024-05-02T09:00:00.000Z' },
      { stepId: 'as4-2', text: 'Встреча прошла продуктивно, задачи поставлены.', submittedAt: '2024-05-04T14:00:00.000Z' },
      { stepId: 'as4-3', text: 'Курс пройден, тест сдан на 90%.', submittedAt: '2024-05-06T11:00:00.000Z' },
      { stepId: 'as4-4', text: 'CRM настроен, почта работает.', submittedAt: '2024-05-07T10:00:00.000Z' },
      { stepId: 'as4-5', text: 'Первый звонок прошёл успешно, клиент доволен.', submittedAt: '2024-05-09T15:00:00.000Z' },
    ],
    status: 'completed',
    startedAt: '2024-05-01',
    completedAt: '2024-05-09',
    messages: [],
  },

  {
    id: 'asgn-5',
    templateId: 'tmpl-sales',
    templateTitle: 'Онбординг: Отдел продаж',
    employeeId: 'emp-8',
    employeeName: 'Артём Лебедев',
    employeeEmail: 'artem@corp.ru',
    assignedBy: 'user-admin',
    assignedByName: 'Администратор',
    divisionId: 'div-sales',
    divisionName: 'Отдел продаж',
    departmentId: 'dept-sales',
    departmentName: 'Департамент продаж',
    steps: [
      { id: 'as5-1', order: 1, required: true,  type: 'document', title: 'Прочитать регламент отдела', description: 'Ознакомьтесь с внутренними правилами.' },
      { id: 'as5-2', order: 2, required: true,  type: 'meeting',  title: 'Встреча с руководителем',   description: 'Знакомство.' },
      { id: 'as5-3', order: 3, required: true,  type: 'course',   title: 'Курс «Основы продаж»',      description: 'Пройдите курс.', courseId: '1' },
      { id: 'as5-4', order: 4, required: true,  type: 'task',     title: 'Первый звонок',              description: 'Под контролем ментора.' },
    ],
    dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    completedSteps: ['as5-1'],
    feedbacks: [
      { stepId: 'as5-1', text: 'Ознакомился с регламентом.', submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
    ],
    status: 'in_progress',
    startedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    messages: [
      { id: 'msg-5', senderId: 'user-admin', senderName: 'Администратор', text: 'Артём, добро пожаловать! Начни с регламента.', sentAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
    ],
  },

  {
    id: 'asgn-6',
    templateId: 'tmpl-general',
    templateTitle: 'Общий онбординг компании',
    employeeId: 'emp-9',
    employeeName: 'Ольга Рыбакова',
    employeeEmail: 'olga.r@corp.ru',
    assignedBy: 'user-admin',
    assignedByName: 'Администратор',
    divisionId: 'div-supply',
    divisionName: 'Отдел обеспечения продаж',
    departmentId: 'dept-sales',
    departmentName: 'Департамент продаж',
    steps: [
      { id: 'as6-1', order: 1, required: true,  type: 'document', title: 'Корпоративный кодекс',     description: 'Прочитать и подписать.' },
      { id: 'as6-2', order: 2, required: true,  type: 'task',     title: 'Заполнить профиль',         description: 'HR-система.' },
      { id: 'as6-3', order: 3, required: false, type: 'video',    title: 'Видео-экскурсия по офису', description: 'Посмотреть видео.' },
      { id: 'as6-4', order: 4, required: true,  type: 'meeting',  title: 'Встреча с HR',              description: 'Вопросы и ответы.' },
    ],
    dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    completedSteps: ['as6-1', 'as6-2'],
    feedbacks: [
      { stepId: 'as6-1', text: 'Кодекс прочитан и подписан.', submittedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
      { stepId: 'as6-2', text: 'Профиль заполнен полностью.', submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
    ],
    status: 'in_progress',
    startedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    messages: [],
  },

  {
    id: 'asgn-7',
    templateId: 'tmpl-monitoring',
    templateTitle: 'Онбординг: Департамент мониторинга',
    employeeId: 'emp-12',
    employeeName: 'Николай Фёдоров',
    employeeEmail: 'nikola@corp.ru',
    assignedBy: 'user-depthead',
    assignedByName: 'Дмитрий Козлов',
    divisionId: 'div-dev',
    divisionName: 'Отдел разработки',
    departmentId: 'dept-marketing',
    departmentName: 'Департамент маркетинга',
    steps: [
      { id: 'as7-1', order: 1, required: true,  type: 'document', title: 'Регламент разработки', description: 'Ознакомиться с процессами.' },
      { id: 'as7-2', order: 2, required: true,  type: 'course',   title: 'Курс «React»',          description: 'Пройти курс по React.', courseId: '2' },
      { id: 'as7-3', order: 3, required: true,  type: 'meeting',  title: 'Встреча с тимлидом',    description: 'Знакомство с командой.' },
      { id: 'as7-4', order: 4, required: false, type: 'task',     title: 'Первый PR',              description: 'Сделать первый pull request.' },
    ],
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    completedSteps: [],
    feedbacks: [],
    status: 'in_progress',
    startedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    messages: [
      { id: 'msg-6', senderId: 'user-depthead', senderName: 'Дмитрий Козлов', text: 'Николай, добро пожаловать в отдел! Начни с регламента.', sentAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
    ],
  },
];

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ================================================================
// API
// ================================================================

export const onboardingApi = {
  // ── Шаблоны ───────────────────────────────────────────────────

  async getTemplates(): Promise<OnboardingTemplate[]> {
    await delay(200);
    return [...mockTemplates];
  },

  async createTemplate(tmpl: Omit<OnboardingTemplate, 'id' | 'createdAt'>): Promise<OnboardingTemplate> {
    await delay(300);
    const created: OnboardingTemplate = {
      ...tmpl,
      id: `tmpl-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockTemplates = [...mockTemplates, created];
    return created;
  },

  async updateTemplate(id: string, patch: Partial<OnboardingTemplate>): Promise<OnboardingTemplate> {
    await delay(200);
    const idx = mockTemplates.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Template not found');
    const updated = { ...mockTemplates[idx], ...patch };
    mockTemplates = [...mockTemplates.slice(0, idx), updated, ...mockTemplates.slice(idx + 1)];
    return updated;
  },

  // ── Назначения ─────────────────────────────────────────────────

  /** Все назначения (для администраторов / менеджеров) */
  async getAllAssignments(): Promise<OnboardingAssignment[]> {
    await delay(200);
    return [...mockAssignments];
  },

  /** Назначения, назначенные текущему сотруднику */
  async getMyAssignments(userId: string): Promise<OnboardingAssignment[]> {
    await delay(200);
    return mockAssignments.filter(a => a.employeeId === userId || a.employeeId === 'user-current');
  },

  /** Назначения, которые создал данный пользователь (для менеджера) */
  async getManagedAssignments(assignedBy: string): Promise<OnboardingAssignment[]> {
    await delay(200);
    return mockAssignments.filter(a => a.assignedBy === assignedBy || a.assignedBy === 'user-current');
  },

  async assignTemplate(
    templateId: string,
    employeeId: string,
    employeeName: string,
    employeeEmail: string,
    assignedBy: string,
    assignedByName: string,
    divisionId: string,
    divisionName: string,
    departmentId: string,
    departmentName: string,
    customSteps?: OnboardingStep[],
    dueDate?: string,
  ): Promise<OnboardingAssignment> {
    await delay(300);
    const tmpl = mockTemplates.find(t => t.id === templateId);
    if (!tmpl) throw new Error('Template not found');
    const assignment: OnboardingAssignment = {
      id: `asgn-${Date.now()}`,
      templateId,
      templateTitle: tmpl.title,
      employeeId,
      employeeName,
      employeeEmail,
      assignedBy,
      assignedByName,
      divisionId,
      divisionName,
      departmentId,
      departmentName,
      dueDate,
      steps: customSteps ?? tmpl.steps.map(s => ({ ...s })),
      completedSteps: [],
      feedbacks: [],
      status: 'in_progress',
      startedAt: new Date().toISOString().split('T')[0],
      messages: [],
    };
    mockAssignments = [...mockAssignments, assignment];
    return assignment;
  },

  /** Пометить шаг как пройденный с обязательным отзывом */
  async completeStepWithFeedback(
    assignmentId: string,
    stepId: string,
    feedbackText: string,
  ): Promise<OnboardingAssignment> {
    await delay(150);
    const idx = mockAssignments.findIndex(a => a.id === assignmentId);
    if (idx === -1) throw new Error('Assignment not found');
    const asgn = mockAssignments[idx];
    if (asgn.completedSteps.includes(stepId)) return asgn;

    const completedSteps = [...asgn.completedSteps, stepId];
    const feedback: StepFeedback = {
      stepId,
      text: feedbackText.trim(),
      submittedAt: new Date().toISOString(),
    };
    const feedbacks = [...asgn.feedbacks, feedback];

    const allDone = asgn.steps.every(s => completedSteps.includes(s.id));
    const status: OnboardingAssignment['status'] = allDone ? 'completed' : 'in_progress';

    const updated: OnboardingAssignment = {
      ...asgn,
      completedSteps,
      feedbacks,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    };
    mockAssignments = [...mockAssignments.slice(0, idx), updated, ...mockAssignments.slice(idx + 1)];
    return updated;
  },

  /** Отправить сообщение в чат онбординга */
  async sendMessage(
    assignmentId: string,
    senderId: string,
    senderName: string,
    text: string,
  ): Promise<OnboardingMessage> {
    await delay(100);
    const idx = mockAssignments.findIndex(a => a.id === assignmentId);
    if (idx === -1) throw new Error('Assignment not found');
    const message: OnboardingMessage = {
      id: `msg-${Date.now()}`,
      senderId,
      senderName,
      text,
      sentAt: new Date().toISOString(),
    };
    mockAssignments = mockAssignments.map((a, i) =>
      i === idx ? { ...a, messages: [...a.messages, message] } : a,
    );
    return message;
  },

  /** Обновить шаги конкретного назначения (менеджер редактирует) */
  async updateAssignmentSteps(assignmentId: string, steps: OnboardingStep[]): Promise<OnboardingAssignment> {
    await delay(200);
    const idx = mockAssignments.findIndex(a => a.id === assignmentId);
    if (idx === -1) throw new Error('Assignment not found');
    const updated = { ...mockAssignments[idx], steps };
    mockAssignments = [...mockAssignments.slice(0, idx), updated, ...mockAssignments.slice(idx + 1)];
    return updated;
  },
};
