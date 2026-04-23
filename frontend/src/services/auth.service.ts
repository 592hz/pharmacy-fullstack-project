import { api } from './api';
import { type Login, type Signup } from '@/lib/schemas';
import { type User } from '@/context/auth-context-type';

export interface AuthResponse {
    token: string;
    user: NonNullable<User>;
}

export const authService = {
    login: (credentials: Login) => api.post<AuthResponse>('/auth/login', credentials),
    register: (userData: Signup) => api.post<AuthResponse>('/auth/signup', userData),
    getMe: () => api.get<NonNullable<User>>('/auth/me'),
};
