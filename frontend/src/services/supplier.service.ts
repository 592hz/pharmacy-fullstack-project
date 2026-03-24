import { api } from './api';
import { type Supplier } from '@/lib/schemas';

export const supplierService = {
    getAll: () => api.get('/suppliers'),
    getById: (id: string) => api.get(`/suppliers/${id}`),
    create: (data: Partial<Supplier>) => api.post('/suppliers', data),
    update: (id: string, data: Partial<Supplier>) => api.put(`/suppliers/${id}`, data),
    delete: (id: string) => api.delete(`/suppliers/${id}`)
};
