import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib/query/queryKeys';
import { departmentApi, divisionApi, positionApi } from './companyApi';

// ── Departments ──────────────────────────────────────────────────

export function useDepartmentsQuery(params: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 100 } = params;
  return useQuery({
    queryKey: queryKeys.departments.list({ page, limit }),
    queryFn:  () => departmentApi.list({ page, limit }),
  });
}

export function useDepartmentQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.departments.detail(id),
    queryFn:  () => departmentApi.getById(id),
    enabled:  Boolean(id),
  });
}

export function useCreateDepartmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => departmentApi.create(name),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
}

export function useUpdateDepartmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => departmentApi.update(id, name),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.all });
      void qc.invalidateQueries({ queryKey: queryKeys.departments.detail(id) });
    },
  });
}

export function useDeleteDepartmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
}

// ── Divisions ────────────────────────────────────────────────────

export function useDivisionsQuery(params: { page?: number; limit?: number; departmentId?: string } = {}) {
  const { page = 1, limit = 100, departmentId } = params;
  return useQuery({
    queryKey: queryKeys.divisions.list({ page, limit, departmentId }),
    queryFn:  () => divisionApi.list({ page, limit, departmentId }),
  });
}

export function useDivisionQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.divisions.detail(id),
    queryFn:  () => divisionApi.getById(id),
    enabled:  Boolean(id),
  });
}

export function useCreateDivisionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; departmentId: string }) => divisionApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.divisions.all });
    },
  });
}

export function useUpdateDivisionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name: string; departmentId: string }) =>
      divisionApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.divisions.all });
      void qc.invalidateQueries({ queryKey: queryKeys.divisions.detail(id) });
    },
  });
}

export function useDeleteDivisionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => divisionApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.divisions.all });
    },
  });
}

// ── Positions ────────────────────────────────────────────────────

export function usePositionsQuery(params: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 100 } = params;
  return useQuery({
    queryKey: queryKeys.positions.list({ page, limit }),
    queryFn:  () => positionApi.list({ page, limit }),
  });
}

export function usePositionTreeQuery() {
  return useQuery({
    queryKey: queryKeys.positions.tree(),
    queryFn:  positionApi.tree,
  });
}

export function usePositionQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.positions.detail(id),
    queryFn:  () => positionApi.getById(id),
    enabled:  Boolean(id),
  });
}

export function useCreatePositionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; parentId?: string | null }) => positionApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.positions.all });
    },
  });
}

export function useUpdatePositionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name: string; parentId?: string | null }) =>
      positionApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.positions.all });
      void qc.invalidateQueries({ queryKey: queryKeys.positions.detail(id) });
    },
  });
}

export function useDeletePositionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => positionApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.positions.all });
    },
  });
}
