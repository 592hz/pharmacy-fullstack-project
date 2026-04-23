import { Request, Response } from 'express';
import ExportSlip from '../models/export-slip.model.js';
import dayjs from 'dayjs';

export const getRevenueReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const now = dayjs();
        
        // Define ranges
        const start = startDate ? dayjs(startDate as string) : now.startOf('month');
        const end = endDate ? dayjs(endDate as string) : now.endOf('day');

        // 1. Fetch Export Slips for range
        const exportSlips = await ExportSlip.find({
            exportDate: { $gte: start.toDate(), $lte: end.toDate() }
        });

        // 2. Fetch Export Slips for PREVIOUS period of equal length (for MoM/comparison)
        const periodDiff = end.diff(start, 'day') + 1;
        const prevStart = start.subtract(periodDiff, 'day');
        const prevEnd = start.subtract(1, 'day');
        
        const prevExportSlips = await ExportSlip.find({
            exportDate: { $gte: prevStart.toDate(), $lte: prevEnd.toDate() }
        });

        const calculateStats = (slips: any[]) => {
            let revenue = 0;
            let profit = 0;
            let totalOrders = slips.length;
            
            slips.forEach(slip => {
                revenue += slip.totalAmount || 0;
                slip.items.forEach((item: any) => {
                    // Profit = (Retail - Import) * Qty
                    const itemProfit = (item.retailPrice - item.importPrice) * item.quantity;
                    profit += itemProfit;
                });
            });
            return { revenue, profit, totalOrders };
        };

        const currentStats = calculateStats(exportSlips);
        const prevStats = calculateStats(prevExportSlips);

        // 3. Monthly aggregation for the current year
        const yearStart = now.startOf('year');
        const yearSlips = await ExportSlip.find({
            exportDate: { $gte: yearStart.toDate() }
        });

        const monthlyData: any[] = [];
        for (let i = 0; i <= now.month(); i++) {
            const mStart = yearStart.add(i, 'month');
            const mEnd = mStart.endOf('month');
            
            const mSlips = yearSlips.filter(s => {
                const d = dayjs(s.exportDate);
                return (d.isAfter(mStart) || d.isSame(mStart)) && (d.isBefore(mEnd) || d.isSame(mEnd));
            });
            
            const stats = calculateStats(mSlips);
            monthlyData.push({
                month: mStart.format('MM/YYYY'),
                revenue: stats.revenue,
                profit: stats.profit,
                orders: stats.totalOrders
            });
        }

        // 4. Top Products in range
        const productStats: Record<string, { name: string; revenue: number; quantity: number }> = {};
        exportSlips.forEach(slip => {
            slip.items.forEach((item: any) => {
                const pId = item.id || item.code;
                if (!productStats[pId]) {
                    productStats[pId] = { name: item.name, revenue: 0, quantity: 0 };
                }
                const stats = productStats[pId];
                if (stats) {
                    stats.revenue += item.totalAmount || 0;
                    stats.quantity += item.quantity || 0;
                }
            });
        });

        const topProducts = Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        res.json({
            summary: {
                current: currentStats,
                previous: prevStats,
                growth: {
                    revenue: prevStats.revenue ? ((currentStats.revenue - prevStats.revenue) / prevStats.revenue) * 100 : 0,
                    profit: prevStats.profit ? ((currentStats.profit - prevStats.profit) / prevStats.profit) * 100 : 0,
                    orders: prevStats.totalOrders ? ((currentStats.totalOrders - prevStats.totalOrders) / prevStats.totalOrders) * 100 : 0
                }
            },
            monthlyData,
            topProducts
        });

    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
