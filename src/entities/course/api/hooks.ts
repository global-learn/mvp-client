import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib/query/queryKeys';
import { courseRealApi, testDefApi, mapTestDefinitionToQuestions } from './courseRealApi';
import type { EnrollmentDto } from '@shared/api/schemas';
import type { TestQuestion } from '../model/types';

export function useCoursesQuery() {
  return useQuery({
    queryKey: queryKeys.courses.list(),
    queryFn:  () => courseRealApi.list(),
    staleTime: 60_000,
  });
}

export function useCourseQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn:  () => courseRealApi.getById(id),
    staleTime: 60_000,
  });
}

export function useMyEnrollmentDtosQuery(userId: string | undefined) {
  return useQuery<EnrollmentDto[]>({
    queryKey: queryKeys.courses.enrollments(userId ?? ''),
    queryFn:  () => courseRealApi.getMyEnrollmentDtos(),
    enabled:  !!userId,
    staleTime: 30_000,
  });
}

export function useTestDefinitionQuery(testId?: string) {
  return useQuery<{ questions: TestQuestion[]; passingPercent: number }>({
    queryKey: queryKeys.courses.testDefinition(testId ?? ''),
    queryFn:  async () => {
      const dto = await testDefApi.getById(testId!);
      return {
        questions:      mapTestDefinitionToQuestions(dto),
        passingPercent: dto.passingPercent ?? 80,
      };
    },
    enabled:  !!testId,
    staleTime: 300_000,
  });
}
