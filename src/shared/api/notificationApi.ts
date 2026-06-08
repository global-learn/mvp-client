import { api } from './axios';
import { NotificationDtoSchema } from './schemas';
import type { NotificationDto } from './schemas';

export const notificationApi = {
  async list(): Promise<NotificationDto[]> {
    const { data } = await api.get('/me/notifications');
    return NotificationDtoSchema.array().parse(data);
  },

  async markRead(id: string): Promise<void> {
    await api.post(`/me/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.post('/me/notifications/read-all');
  },
};

export type { NotificationDto };
