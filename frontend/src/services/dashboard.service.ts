import { api } from './api';
import { type DashboardSummary } from '@/lib/schemas';

export const dashboardService = {
  getSummary: (params?: { month?: number; year?: number }) => {
    let url = '/dashboard/summary';
    if (params?.month && params?.year) {
      url += `?month=${params.month}&year=${params.year}`;
    }
    return api.get<DashboardSummary>(url);
  }
};
