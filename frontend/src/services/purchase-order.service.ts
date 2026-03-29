import { api } from './api';
import { type PurchaseOrder } from '@/lib/schemas';

export const purchaseOrderService = {
    getAll: () => api.get<PurchaseOrder[]>('/purchase-orders'),
    getById: (id: string) => api.get<PurchaseOrder>(`/purchase-orders/${id}`),
    create: (data: PurchaseOrder) => api.post<PurchaseOrder>('/purchase-orders', data),
    update: (id: string, data: Partial<PurchaseOrder>) => api.put<PurchaseOrder>(`/purchase-orders/${id}`, data),
    delete: (id: string) => api.delete(`/purchase-orders/${id}`),
};
