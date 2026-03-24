import { api } from './api';
import { type Category } from '@/lib/schemas';

export const categoryService = {
    getAll: () => api.get('/categories'),
    create: (data: Partial<Category>) => api.post('/categories', data),
    update: (id: string, data: Partial<Category>) => api.put(`/categories/${id}`, data),
    delete: (id: string) => api.delete(`/categories/${id}`)
};
