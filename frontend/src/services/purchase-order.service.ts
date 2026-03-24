import { api } from './api';
import { type PurchaseOrder } from '@/lib/schemas';

export const purchaseOrderService = {
    getAll: () => api.get('/purchase-orders'),
    getById: (id: string) => api.get(`/purchase-orders/${id}`),
    create: (data: PurchaseOrder) => api.post('/purchase-orders', data),
    update: (id: string, data: Partial<PurchaseOrder>) => api.put(`/purchase-orders/${id}`, data),
    delete: (id: string) => api.delete(`/purchase-orders/${id}`)
};
