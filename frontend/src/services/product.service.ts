import { api } from './api';
import type { Product } from '@/lib/mock-data';

export const productService = {
    getAll: () => api.get('/products'),
    getById: (id: string) => api.get(`/products/${id}`),
    create: (data: Partial<Product>) => api.post('/products', data),
    update: (id: string, data: Partial<Product>) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`)
};
