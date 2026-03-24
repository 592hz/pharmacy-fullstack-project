import { api } from './api';
import { type ExportOrder } from '@/lib/schemas';

export const exportSlipService = {
  getAll: () => api.get('/export-slips'),
  getById: (id: string) => api.get(`/export-slips/${id}`),
  create: (data: ExportOrder) => api.post('/export-slips', data),
  update: (id: string, data: Partial<ExportOrder>) => api.put(`/export-slips/${id}`, data),
  delete: (id: string) => api.delete(`/export-slips/${id}`)
};
