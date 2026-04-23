import { api } from './api';
import { type Customer } from '@/lib/schemas';

export const customerService = {
    getAll: (trash?: boolean) => api.get<Customer[]>(`/customers${trash ? '?trash=true' : ''}`),
    getById: (id: string) => api.get<Customer>(`/customers/${id}`),
    create: (data: Customer) => api.post<Customer>('/customers', data),
    update: (id: string, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),
    delete: (id: string) => api.delete(`/customers/${id}`),
    restore: (id: string) => api.put<Customer>(`/customers/${id}`, { isDeleted: false })
};
