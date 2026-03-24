import { api } from './api';

export const unitService = {
  getAll: async () => {
    const response = await api.get('/units');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/units', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/units/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/units/${id}`);
    return response.data;
  }
};
