import { api } from './api';

export const productCategoryService = {
  getAll: async () => {
    return await api.get('/product-categories');
  },
  create: async (data: any) => {
    return await api.post('/product-categories', data);
  },
  update: async (id: string, data: any) => {
    return await api.put(`/product-categories/${id}`, data);
  },
  delete: async (id: string) => {
    return await api.delete(`/product-categories/${id}`);
  }
};
