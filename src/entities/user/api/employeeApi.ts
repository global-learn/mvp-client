import { api } from '@shared/api/axios';
import { IdResponseSchema, EmployeeDtoSchema, paginatedSchema } from '@shared/api/schemas';
import type { EmployeeDto } from '@shared/api/schemas';

export const employeeApi = {
  list: async (params: { page: number; limit: number; divisionId?: string }) => {
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
    password: string;
    roleId: string;
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
  }): Promise<void> => {
    await api.patch(`/employees/${id}`, payload);
  },

  promote: async (id: string, positionId: string): Promise<void> => {
    await api.patch(`/employees/${id}/promote`, { positionId });
  },

  dismiss: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },
};
