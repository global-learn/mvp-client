import { z } from 'zod';
import { api } from '@shared/api/axios';
import {
  IdResponseSchema, EmployeeDtoSchema, RoleDtoSchema, paginatedSchema,
  SubordinateTreeNodeDtoSchema, ManagerDashboardResponseDtoSchema,
} from '@shared/api/schemas';
import type { EmployeeDto, RoleDto, SubordinateTreeNodeDto, ManagerDashboardResponseDto } from '@shared/api/schemas';

export const employeeApi = {
  list: async (params: { page: number; limit: number; divisionId?: string; departmentId?: string; roleId?: string }) => {
    const { data } = await api.get('/employees', { params });
    return paginatedSchema(EmployeeDtoSchema).parse(data);
  },

  getById: async (id: string): Promise<EmployeeDto> => {
    const { data } = await api.get(`/employees/${id}`);
    return EmployeeDtoSchema.parse(data);
  },

  getSubordinates: async (): Promise<EmployeeDto[]> => {
    const { data } = await api.get('/employees/me/subordinates');
    return EmployeeDtoSchema.array().parse(data);
  },

  create: async (payload: {
    email: string;
    fullname: string;
    divisionId: string;
    employmentDate: string;
    positionId?: string | null;
  }) => {
    const { data } = await api.post('/employees', payload);
    return IdResponseSchema.parse(data);
  },

  update: async (id: string, payload: {
    fullname?: string;
    biography?: string | null;
    divisionId?: string;
    positionId?: string | null;
    avatarId?: string | null;
  }): Promise<void> => {
    await api.patch(`/employees/${id}`, payload);
  },

  promote: async (id: string, positionId: string): Promise<void> => {
    await api.patch(`/employees/${id}/promote`, { positionId });
  },

  dismiss: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },

  getSubordinateTree: async (): Promise<SubordinateTreeNodeDto[]> => {
    const { data } = await api.get('/employees/me/subordinates/tree');
    return z.array(SubordinateTreeNodeDtoSchema).parse(data);
  },

  getTeamDashboard: async (): Promise<ManagerDashboardResponseDto> => {
    const { data } = await api.get('/employees/me/team-dashboard');
    return ManagerDashboardResponseDtoSchema.parse(data);
  },
};

export const roleApi = {
  list: async (params: { page: number; limit: number }): Promise<{ data: RoleDto[] }> => {
    const { data } = await api.get('/roles', { params });
    return paginatedSchema(RoleDtoSchema).parse(data);
  },
};
