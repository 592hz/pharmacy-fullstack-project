import { api } from './api';
import type { Product } from '@/lib/schemas';

export const productService = {
    getAll: () => api.get<Product[]>('/products'),
    getById: (id: string) => api.get<Product>(`/products/${id}`),
    create: (data: Partial<Product>) => api.post<Product>('/products', data),
    update: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
    delete: (id: string) => api.delete<void>(`/products/${id}`),
    bulkCreate: (products: Partial<Product>[]) => api.post<{ success: number; skipped: number; errors: string[] }>('/products/bulk', { products })
};
