// Централизованные ключи для TanStack Query.
// Один источник правды — проще делать invalidate() из мутаций.
//
// Использование:
//   useQuery({ queryKey: queryKeys.departments.list(), queryFn: ... })
//   queryClient.invalidateQueries({ queryKey: queryKeys.departments.all })

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },

  departments: {
    all:    ['departments'] as const,
    list:   (params?: { page?: number; limit?: number }) => ['departments', 'list', params] as const,
    detail: (id: string) => ['departments', id] as const,
  },

  divisions: {
    all:    ['divisions'] as const,
    list:   (params?: { page?: number; limit?: number; departmentId?: string }) => ['divisions', 'list', params] as const,
    detail: (id: string) => ['divisions', id] as const,
  },

  positions: {
    all:    ['positions'] as const,
    list:   (params?: { page?: number; limit?: number }) => ['positions', 'list', params] as const,
    tree:   () => ['positions', 'tree'] as const,
    detail: (id: string) => ['positions', id] as const,
  },

  employees: {
    all:          ['employees'] as const,
    list:         (params?: { page?: number; limit?: number; divisionId?: string }) => ['employees', 'list', params] as const,
    detail:       (id: string) => ['employees', id] as const,
    subordinates: ['employees', 'subordinates'] as const,
  },

  courses: {
    all:               ['courses'] as const,
    list:              (includeArchived?: boolean) => ['courses', 'list', { includeArchived }] as const,
    detail:            (id: string) => ['courses', 'detail', id] as const,
    analytics:         (id: string) => ['courses', 'analytics', id] as const,
    enrollments:       (userId: string) => ['courses', 'enrollments', userId] as const,
    courseEnrollments: (courseId: string) => ['courses', 'enrollments', 'by-course', courseId] as const,
    requests:          (courseId: string) => ['courses', 'requests', courseId] as const,
    assignable:        ['courses', 'assignable-employees'] as const,
    testDefinition:    (id: string) => ['courses', 'test-definition', id] as const,
  },

  control: {
    enrollments: ['control', 'enrollments'] as const,
  },

  onboarding: {
    all:                ['onboarding'] as const,
    templates:          () => ['onboarding', 'templates'] as const,
    myAssignments:      (userId: string) => ['onboarding', 'assignments', 'mine', userId] as const,
    managedAssignments: (userId: string) => ['onboarding', 'assignments', 'managed', userId] as const,
    assignment:         (id: string) => ['onboarding', 'assignments', id] as const,
    messages:           (assignmentId: string) => ['onboarding', 'messages', assignmentId] as const,
  },

  company: {
    org: ['company', 'org'] as const,
  },
} as const;
