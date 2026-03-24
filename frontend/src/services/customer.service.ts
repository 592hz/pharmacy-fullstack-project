import { api } from './api';
import { type Customer } from '@/lib/schemas';

export const customerService = {
    getAll: () => api.get('/customers'),
    getById: (id: string) => api.get(`/customers/${id}`),
    create: (data: Partial<Customer>) => api.post('/customers', data),
    update: (id: string, data: Partial<Customer>) => api.put(`/customers/${id}`, data),
    delete: (id: string) => api.delete(`/customers/${id}`)
};
