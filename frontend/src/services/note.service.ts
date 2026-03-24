import { api } from './api';

export const noteService = {
  getAll: async () => {
    const response = await api.get('/notes');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/notes', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/notes/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  }
};
