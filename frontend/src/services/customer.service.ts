import { api } from './api';
import { type Customer } from '@/lib/schemas';

export const customerService = {
    getAll: () => api.get<Customer[]>('/customers'),
    getById: (id: string) => api.get<Customer>(`/customers/${id}`),
    create: (data: Customer) => api.post<Customer>('/customers', data),
    update: (id: string, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),
    delete: (id: string) => api.delete(`/customers/${id}`)
};
