import { api } from './api';

export const dashboardService = {
    getSummary: async () => {
        const { data } = await api.get('/dashboard/summary');
        return data;
    }
};
