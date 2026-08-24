import { api } from './api';
import { type ExportOrder } from '@/lib/schemas';

export const exportSlipService = {
    getAll: () => api.get<ExportOrder[]>('/export-slips'),
    getDeleted: () => api.get<ExportOrder[]>('/export-slips/trash'),
    getById: (id: string) => api.get<ExportOrder>(`/export-slips/${id}`),
    create: (data: ExportOrder) => api.post<ExportOrder>('/export-slips', data),
    update: (id: string, data: Partial<ExportOrder>) => api.put<ExportOrder>(`/export-slips/${id}`, data),
    delete: (id: string) => api.delete(`/export-slips/${id}`),
    restore: (id: string) => api.put<ExportOrder>(`/export-slips/${id}/restore`, {}),
    permanentDelete: (id: string) => api.delete<{ message: string }>(`/export-slips/${id}/permanent`),
    bulkDelete: (ids: string[]) => api.put<{ message: string }>('/export-slips/trash/delete-bulk', { ids }),
    bulkRestore: (ids: string[]) => api.put<{ message: string }>('/export-slips/trash/restore-bulk', { ids }),
    bulkPermanentDelete: (ids: string[]) => api.delete<{ message: string }>('/export-slips/trash/permanent-bulk', { ids }, true),
    emptyTrash: () => api.delete<{ message: string }>('/export-slips/trash/empty'),
};
