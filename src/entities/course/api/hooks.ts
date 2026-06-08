import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib/query/queryKeys';
import { courseRealApi, fileApi, testDefApi, mapTestDefinitionToQuestions } from './courseRealApi';
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

export function useMyEnrollmentDtosQuery() {
  return useQuery<EnrollmentDto[]>({
    queryKey: queryKeys.courses.enrollments('me'),
    queryFn:  () => courseRealApi.getMyEnrollmentDtos(),
    staleTime: 30_000,
  });
}

export function useCoverUrl(fileId?: string) {
  return useQuery({
    queryKey: ['file-url', fileId],
    queryFn:  () => fileApi.getUrl(fileId!),
    enabled:  !!fileId,
    staleTime: 600_000,
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
