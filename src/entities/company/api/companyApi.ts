import { api } from '@shared/api/axios';
import {
  IdResponseSchema,
  DepartmentDtoSchema,
  DivisionDtoSchema,
  PositionDtoSchema,
  PositionTreeDtoSchema,
  paginatedSchema,
} from '@shared/api/schemas';
import type { DepartmentDto, DivisionDto, PositionDto, PositionTreeDto } from '@shared/api/schemas';

// ── Departments ──────────────────────────────────────────────────

export const departmentApi = {
  list: async (params: { page: number; limit: number }) => {
    const { data } = await api.get('/departments', { params });
    return paginatedSchema(DepartmentDtoSchema).parse(data);
  },

  getById: async (id: string): Promise<DepartmentDto> => {
    const { data } = await api.get(`/departments/${id}`);
    return DepartmentDtoSchema.parse(data);
  },

  create: async (name: string) => {
    const { data } = await api.post('/departments', { name });
    return IdResponseSchema.parse(data);
  },

  update: async (id: string, name: string): Promise<void> => {
    await api.patch(`/departments/${id}`, { name });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/departments/${id}`);
  },
};

// ── Divisions ────────────────────────────────────────────────────

export const divisionApi = {
  list: async (params: { page: number; limit: number; departmentId?: string }) => {
    const { data } = await api.get('/divisions', { params });
    return paginatedSchema(DivisionDtoSchema).parse(data);
  },

  getById: async (id: string): Promise<DivisionDto> => {
    const { data } = await api.get(`/divisions/${id}`);
    return DivisionDtoSchema.parse(data);
  },

  create: async (payload: { name: string; departmentId: string }) => {
    const { data } = await api.post('/divisions', payload);
    return IdResponseSchema.parse(data);
  },

  update: async (id: string, payload: { name: string; departmentId: string }): Promise<void> => {
    await api.patch(`/divisions/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/divisions/${id}`);
  },
};

// ── Positions ────────────────────────────────────────────────────

export const positionApi = {
  list: async (params: { page: number; limit: number }) => {
    const { data } = await api.get('/positions', { params });
    return paginatedSchema(PositionDtoSchema).parse(data);
  },

  tree: async (): Promise<PositionTreeDto[]> => {
    const { data } = await api.get('/positions/tree');
    return PositionTreeDtoSchema.array().parse(data);
  },

  getById: async (id: string): Promise<PositionDto> => {
    const { data } = await api.get(`/positions/${id}`);
    return PositionDtoSchema.parse(data);
  },

  create: async (payload: { name: string; parentId?: string | null }) => {
    const { data } = await api.post('/positions', payload);
    return IdResponseSchema.parse(data);
  },

  update: async (id: string, payload: { name: string; parentId?: string | null }): Promise<void> => {
    await api.patch(`/positions/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/positions/${id}`);
  },
};
