import { api } from './api';
import type { Supplier } from '@/lib/schemas';

export const supplierService = {
    getAll: () => api.get<Supplier[]>('/suppliers'),
    getById: (id: string) => api.get<Supplier>(`/suppliers/${id}`),
    create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data),
    update: (id: string, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, data),
    delete: (id: string) => api.delete<void>(`/suppliers/${id}`)
};
