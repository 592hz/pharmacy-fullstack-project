import { api } from './api';
import { type ExportOrder } from '@/lib/schemas';

export const exportSlipService = {
    getAll: () => api.get<ExportOrder[]>('/export-slips'),
    getById: (id: string) => api.get<ExportOrder>(`/export-slips/${id}`),
    create: (data: ExportOrder) => api.post<ExportOrder>('/export-slips', data),
    update: (id: string, data: Partial<ExportOrder>) => api.put<ExportOrder>(`/export-slips/${id}`, data),
    delete: (id: string) => api.delete(`/export-slips/${id}`),
};
