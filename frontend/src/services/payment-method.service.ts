import { api } from './api';
import { type PaymentMethod } from '@/lib/schemas';

export const paymentMethodService = {
  getAll: () => api.get('/payment-methods'),
  create: (data: Partial<PaymentMethod>) => api.post('/payment-methods', data),
  update: (id: string, data: Partial<PaymentMethod>) => api.put(`/payment-methods/${id}`, data),
  delete: (id: string) => api.delete(`/payment-methods/${id}`)
};
