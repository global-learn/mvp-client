import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib/query/queryKeys';
import { employeeApi } from './employeeApi';

export function useEmployeesQuery(params: { page?: number; limit?: number; divisionId?: string } = {}) {
  const { page = 1, limit = 100, divisionId } = params;
  return useQuery({
    queryKey: queryKeys.employees.list({ page, limit, divisionId }),
    queryFn:  () => employeeApi.list({ page, limit, divisionId }),
  });
}

export function useEmployeeQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn:  () => employeeApi.getById(id),
    enabled:  Boolean(id),
  });
}

export function useMySubordinatesQuery() {
  return useQuery({
    queryKey: queryKeys.employees.subordinates,
    queryFn:  employeeApi.getSubordinates,
  });
}

export function useCreateEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeeApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

export function useUpdateEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Parameters<typeof employeeApi.update>[1] & { id: string }) =>
      employeeApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      void qc.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
    },
  });
}

export function usePromoteEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, positionId }: { id: string; positionId: string }) =>
      employeeApi.promote(id, positionId),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      void qc.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
    },
  });
}

export function useDismissEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeApi.dismiss(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}
