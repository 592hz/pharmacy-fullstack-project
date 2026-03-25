import { api } from './api';
import { type Unit } from '@/lib/schemas';

export const unitService = {
  getAll: () => api.get('/units'),
  create: (data: Partial<Unit>) => api.post('/units', data),
  update: (id: string, data: Partial<Unit>) => api.put(`/units/${id}`, data),
  delete: (id: string) => api.delete(`/units/${id}`)
};
