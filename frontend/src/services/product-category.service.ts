import { api } from './api';
import type { ProductCategory } from '@/lib/schemas';

export const productCategoryService = {
    getAll: () => api.get<ProductCategory[]>('/product-categories'),
    create: (data: Partial<ProductCategory>) => api.post<ProductCategory>('/product-categories', data),
    update: (id: string, data: Partial<ProductCategory>) => api.put<ProductCategory>(`/product-categories/${id}`, data),
    delete: (id: string) => api.delete<void>(`/product-categories/${id}`)
};
