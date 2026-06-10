import { z } from 'zod';
import { api } from '@shared/api/axios';
import { paginatedSchema } from '@shared/api/schemas';
import type { Notification } from '../model/types';

const NotificationSchema = z.object({
  id:        z.string(),
  type:      z.string(),
  payload:   z.record(z.string(), z.unknown()).optional().default({}),
  readAt:    z.string().nullable().optional(),
  createdAt: z.string(),
});

const NotificationPageSchema = paginatedSchema(NotificationSchema);

export const notificationApi = {
  async list(params: { page: number; limit: number }): Promise<Notification[]> {
    const { data } = await api.get('/me/notifications', { params });
    const parsed = NotificationPageSchema.parse(data);
    return parsed.data as Notification[];
  },

  async markRead(id: string): Promise<void> {
    await api.post(`/me/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.post('/me/notifications/read-all');
  },
};
