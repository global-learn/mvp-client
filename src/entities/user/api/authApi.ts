import { api } from '@shared/api/axios';
import { IdResponseSchema, UserDtoSchema, MeResponseDtoSchema, MyProfileResponseDtoSchema } from '@shared/api/schemas';
import type { UserDto, MeResponseDto, MyProfileResponseDto } from '@shared/api/schemas';

export const authApi = {
  me: async (): Promise<MeResponseDto> => {
    const { data } = await api.get('/auth/me');
    return MeResponseDtoSchema.parse(data);
  },

  myProfile: async (): Promise<MyProfileResponseDto> => {
    const { data } = await api.get('/auth/me/profile');
    return MyProfileResponseDtoSchema.parse(data);
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return IdResponseSchema.parse(data);
  },

  register: async (payload: {
    email: string;
    password: string;
    roleId: string;
    fullname: string;
    divisionId: string;
    employmentDate: string;
    positionId?: string;
  }) => {
    const { data } = await api.post('/auth/register', payload);
    return IdResponseSchema.parse(data);
  },

  completeRegistration: async (email: string, newPassword: string) => {
    await api.post('/auth/complete-registration', { email, newPassword });
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refresh: async () => {
    const { data } = await api.post('/auth/refresh');
    return IdResponseSchema.parse(data);
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  },

  getUserById: async (id: string): Promise<UserDto> => {
    const { data } = await api.get(`/user/${id}`);
    return UserDtoSchema.parse(data);
  },
};
