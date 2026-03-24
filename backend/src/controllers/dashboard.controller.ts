import { Request, Response } from 'express';
import ExportSlip from '../models/export-slip.model.js';
import PurchaseOrder from '../models/purchase-order.model.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import dayjs from 'dayjs';

export const getSummary = async (req: Request, res: Response) => {
    try {
        const now = dayjs();
        const startOfDay = now.startOf('day').toDate();
        const startOfMonth = now.startOf('month').toDate();
        const startOfYear = now.startOf('year').toDate();

        // 1. Doanh thu & Lợi nhuận (Today, Month, Year)
        const exportSlips = await ExportSlip.find({
            exportDate: { $gte: startOfYear }
        });

        const calculateStats = (slips: any[]) => {
            let revenue = 0;
            let profit = 0;
            slips.forEach(slip => {
                revenue += slip.totalAmount || 0;
                slip.items.forEach((item: any) => {
                    const itemProfit = (item.retailPrice - item.importPrice) * item.quantity;
                    profit += itemProfit;
                });
            });
            return { revenue, profit };
        };

        const todaySlips = exportSlips.filter(s => dayjs(s.exportDate).isAfter(startOfDay));
        const monthSlips = exportSlips.filter(s => dayjs(s.exportDate).isAfter(startOfMonth));

        const statsToday = calculateStats(todaySlips);
        const statsMonth = calculateStats(monthSlips);
        const statsYear = calculateStats(exportSlips);

        // 2. Thu & Chi (Current Month)
        const categories = await Category.find({
            date: { $gte: startOfMonth }
        });

        const totalIncome = categories.filter(c => c.type === 'Thu').reduce((sum, c) => sum + (c.amount || 0), 0);
        const totalExpense = categories.filter(c => c.type === 'Chi').reduce((sum, c) => sum + (c.amount || 0), 0);

        // 3. Hàng sắp hết & Cận date
        const allProducts = await Product.find();
        let lowStockCount = 0;
        let nearExpiryCount = 0;

        const threeMonthsFromNow = now.add(3, 'month');

        allProducts.forEach(p => {
            // Low stock
            const totalQty = p.batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || p.baseQuantity || 0;
            if (totalQty <= 10) lowStockCount++;

            // Near expiry
            p.batches?.forEach((b: any) => {
                if (b.expiryDate) {
                    const expiry = dayjs(b.expiryDate, ['DD-MM-YYYY', 'YYYY-MM-DD']);
                    if (expiry.isValid() && expiry.isBefore(threeMonthsFromNow)) {
                        nearExpiryCount++;
                    }
                }
            });
        });

        // 4. Dữ liệu biểu đồ (Tháng hiện tại - theo ngày)
        const chartDataMonth: any[] = [];
        for (let i = 0; i < now.date(); i++) {
            const date = now.startOf('month').add(i, 'day');
            const dayStr = date.format('DD/MM');
            const daySlips = monthSlips.filter(s => dayjs(s.exportDate).isSame(date, 'day'));
            const dayStats = calculateStats(daySlips);
            chartDataMonth.push({
                name: dayStr,
                DoanhThu: dayStats.revenue,
                LoiNhuan: dayStats.profit
            });
        }

        res.json({
            stats: {
                today: statsToday,
                month: statsMonth,
                year: statsYear,
                totalIncome,
                totalExpense,
                lowStockCount,
                nearExpiryCount,
                billCountToday: todaySlips.length
            },
            chartData: {
                month: chartDataMonth
            }
        });

    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
