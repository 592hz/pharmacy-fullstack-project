import { api } from './api';
import type { Note } from '@/lib/schemas';

export const noteService = {
    getAll: () => api.get<Note[]>('/notes'),
    getById: (id: string) => api.get<Note>(`/notes/${id}`),
    create: (data: Partial<Note>) => api.post<Note>('/notes', data),
    update: (id: string, data: Partial<Note>) => api.put<Note>(`/notes/${id}`, data),
    delete: (id: string) => api.delete<void>(`/notes/${id}`)
};
