import { api } from './api';
import { type DashboardSummary } from '@/lib/schemas';

export const dashboardService = {
  getSummary: () => api.get<DashboardSummary>('/dashboard/summary')
};
