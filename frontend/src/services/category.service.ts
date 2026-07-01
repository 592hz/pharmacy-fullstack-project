import { api } from './api';
import { type Category } from '@/lib/schemas';

export const categoryService = {
    getAll: () => api.get<Category[]>('/categories'),
    create: (data: Category) => api.post<Category>('/categories', data),
    update: (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
    delete: (id: string) => api.delete(`/categories/${id}`)
};
