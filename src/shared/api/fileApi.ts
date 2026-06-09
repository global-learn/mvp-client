import { api } from './axios';
import { FileResponseDtoSchema } from './schemas';
import type { FileResponseDto } from './schemas';

export const fileApi = {
  async upload(file: File): Promise<FileResponseDto> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return FileResponseDtoSchema.parse(data);
  },

  async getUrl(id: string): Promise<string> {
    const { data } = await api.get(`/files/${id}`);
    return FileResponseDtoSchema.parse(data).url;
  },
};
