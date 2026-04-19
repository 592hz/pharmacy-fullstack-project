import { api } from './api';

export interface RevenueReportData {
    summary: {
        current: {
            revenue: number;
            profit: number;
            totalOrders: number;
        };
        previous: {
            revenue: number;
            profit: number;
            totalOrders: number;
        };
        growth: {
            revenue: number;
            profit: number;
            orders: number;
        };
    };
    monthlyData: {
        month: string;
        revenue: number;
        profit: number;
        orders: number;
    }[];
    topProducts: {
        name: string;
        revenue: number;
        quantity: number;
    }[];
}

export const reportService = {
    getRevenueReport: (startDate?: string, endDate?: string) => {
        let url = '/reports/revenue';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const query = params.toString();
        if (query) url += `?${query}`;
        return api.get<RevenueReportData>(url);
    }
};
