import type {
  OnboardingTemplate,
  OnboardingAssignment,
  OnboardingStep,
  OnboardingMessage,
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
      { id: 's-1', order: 1, required: true,  type: 'document', title: 'Прочитать регламент отдела',     description: 'Ознакомьтесь с внутренними правилами и процессами отдела продаж.' },
      { id: 's-2', order: 2, required: true,  type: 'meeting',  title: 'Встреча с руководителем',         description: 'Индивидуальная встреча — знакомство и постановка первых задач.' },
      { id: 's-3', order: 3, required: true,  type: 'course',   title: 'Курс «Основы JavaScript»',       description: 'Базовый курс. Тест в конце обязателен.', courseId: '1' },
      { id: 's-4', order: 4, required: false, type: 'task',     title: 'Настроить рабочее место',         description: 'Установите необходимые приложения по инструкции IT.' },
      { id: 's-5', order: 5, required: true,  type: 'task',     title: 'Провести первый звонок клиенту', description: 'Под наблюдением ментора. Запишите итоги в CRM.' },
    ],
    completedSteps: ['s-1'],
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
      steps: customSteps ?? tmpl.steps.map(s => ({ ...s })),
      completedSteps: [],
      status: 'in_progress',
      startedAt: new Date().toISOString().split('T')[0],
      messages: [],
    };
    mockAssignments = [...mockAssignments, assignment];
    return assignment;
  },

  /** Пометить шаг как пройденный */
  async completeStep(assignmentId: string, stepId: string): Promise<OnboardingAssignment> {
    await delay(150);
    const idx = mockAssignments.findIndex(a => a.id === assignmentId);
    if (idx === -1) throw new Error('Assignment not found');
    const asgn = mockAssignments[idx];
    if (asgn.completedSteps.includes(stepId)) return asgn;
    const completedSteps = [...asgn.completedSteps, stepId];
    const allRequired = asgn.steps.filter(s => s.required).every(s => completedSteps.includes(s.id));
    const allDone = asgn.steps.every(s => completedSteps.includes(s.id));
    const status: OnboardingAssignment['status'] = (allRequired && allDone) || completedSteps.length === asgn.steps.length
      ? 'completed'
      : 'in_progress';
    const updated: OnboardingAssignment = {
      ...asgn,
      completedSteps,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    };
    mockAssignments = [...mockAssignments.slice(0, idx), updated, ...mockAssignments.slice(idx + 1)];
    return updated;
  },

  /** Снять отметку с шага */
  async uncompleteStep(assignmentId: string, stepId: string): Promise<OnboardingAssignment> {
    await delay(150);
    const idx = mockAssignments.findIndex(a => a.id === assignmentId);
    if (idx === -1) throw new Error('Assignment not found');
    const asgn = mockAssignments[idx];
    const completedSteps = asgn.completedSteps.filter(id => id !== stepId);
    const updated: OnboardingAssignment = {
      ...asgn,
      completedSteps,
      status: 'in_progress',
      completedAt: undefined,
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
