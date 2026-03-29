import { api } from './api';
import type { PaymentMethod } from '@/lib/schemas';

export const paymentMethodService = {
    getAll: () => api.get<PaymentMethod[]>('/payment-methods'),
    create: (data: Partial<PaymentMethod>) => api.post<PaymentMethod>('/payment-methods', data),
    update: (id: string, data: Partial<PaymentMethod>) => api.put<PaymentMethod>(`/payment-methods/${id}`, data),
    delete: (id: string) => api.delete<void>(`/payment-methods/${id}`)
};
