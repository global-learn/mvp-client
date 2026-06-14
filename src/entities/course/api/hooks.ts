import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib/query/queryKeys';
import { courseRealApi, fileApi, testDefApi, certificateApi, myApplicationApi, questionApi, mapTestDefinitionToQuestions } from './courseRealApi';
import type { CourseAnalyticsDto, EnrollmentDto, CertificateDto, CourseApplicationDto, CourseQuestionDto, QuestionBankStatsDto } from '@shared/api/schemas';
import type { TestQuestion } from '../model/types';

export function useCoursesQuery(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.courses.list(includeArchived),
    queryFn:  () => courseRealApi.list({ includeArchived }),
    staleTime: 60_000,
  });
}

export function useCourseAnalyticsQuery(id: string, enabled = true) {
  return useQuery<CourseAnalyticsDto>({
    queryKey: queryKeys.courses.analytics(id),
    queryFn:  () => courseRealApi.getAnalytics(id),
    enabled:  enabled && !!id,
    staleTime: 120_000,
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

export function useCourseQuestionsQuery(courseId: string, enabled = true) {
  return useQuery<CourseQuestionDto[]>({
    queryKey: queryKeys.courses.questions(courseId),
    queryFn:  () => questionApi.list(courseId),
    enabled:  enabled && !!courseId,
    staleTime: 30_000,
  });
}

export function useQuestionBankStatsQuery(courseId: string, enabled = true) {
  return useQuery<QuestionBankStatsDto>({
    queryKey: queryKeys.courses.questionStats(courseId),
    queryFn:  () => questionApi.stats(courseId),
    enabled:  enabled && !!courseId,
    staleTime: 30_000,
  });
}

export function useMyApplicationsQuery() {
  return useQuery<CourseApplicationDto[]>({
    queryKey: queryKeys.courses.myApplications(),
    queryFn:  () => myApplicationApi.getMine(),
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

export function useMyCertificatesQuery() {
  return useQuery<CertificateDto[]>({
    queryKey: queryKeys.certificates.mine(),
    queryFn:  () => certificateApi.getMine(),
    staleTime: 60_000,
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
