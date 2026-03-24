import { api } from './api';

export const authService = {
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (userData: any) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me')
};
