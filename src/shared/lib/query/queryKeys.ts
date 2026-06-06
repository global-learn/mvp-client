// Централизованные ключи для TanStack Query.
// Один источник правды — проще делать invalidate() из мутаций.
//
// Использование:
//   useQuery({ queryKey: queryKeys.courses.list(), queryFn: ... })
//   queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  courses: {
    all:    ['courses'] as const,
    list:   () => ['courses', 'list'] as const,
    detail: (id: string) => ['courses', 'detail', id] as const,
    enrollments: (userId: string) => ['courses', 'enrollments', userId] as const,
    courseEnrollments: (courseId: string) => ['courses', 'enrollments', 'by-course', courseId] as const,
    requests: (courseId: string) => ['courses', 'requests', courseId] as const,
    assignable: ['courses', 'assignable-employees'] as const,
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
  },
  company: {
    org: ['company', 'org'] as const,
  },
} as const;
