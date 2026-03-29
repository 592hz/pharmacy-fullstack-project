import { api } from './api';
import type { Unit } from '@/lib/schemas';

export const unitService = {
    getAll: () => api.get<Unit[]>('/units'),
    create: (data: Partial<Unit>) => api.post<Unit>('/units', data),
    update: (id: string, data: Partial<Unit>) => api.put<Unit>(`/units/${id}`, data),
    delete: (id: string) => api.delete<void>(`/units/${id}`)
};
