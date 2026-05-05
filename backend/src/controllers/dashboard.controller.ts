import { Request, Response } from 'express';
import ExportSlip from '../models/export-slip.model.js';
import PurchaseOrder from '../models/purchase-order.model.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

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
        const lowStockProducts: any[] = [];
        const nearExpiryProducts: any[] = [];

        const sixMonthsFromNow = now.add(6, 'month');

        allProducts.forEach(p => {
            // Low stock check
            const totalQty = p.batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || p.baseQuantity || 0;
            const normalizedQty = Math.floor(totalQty / (p.conversionRate || 1));
            const unitName = (p.unit || p.baseUnitName || '').toLowerCase();
            //  đặt định mức cho các đơn vị tính khác nhau  
            let threshold = 1; // Mặc định là 1
            if (unitName.includes('viên')) threshold = 10;
            else if (unitName.includes('vỉ')) threshold = 5;
            else if (unitName.includes('chai') || unitName.includes('lọ') || unitName.includes('ống') || unitName.includes('gói')) threshold = 1;

            if (normalizedQty <= threshold) {
                lowStockCount++;
                lowStockProducts.push({
                    id: p.id,
                    name: p.name,
                    quantity: normalizedQty,
                    unit: p.unit || p.baseUnitName
                });
            }

            // Near expiry check
            p.batches?.forEach((b: any) => {
                if (b.expiryDate) {
                    // Cải thiện việc parse ngày tháng: hỗ trợ cả gạch chéo và gạch ngang, 1 hoặc 2 chữ số cho ngày/tháng
                    const expiry = dayjs(b.expiryDate, ['DD-MM-YYYY', 'D-M-YYYY', 'DD/MM/YYYY', 'D/M/YYYY', 'YYYY-MM-DD']);
                    if (expiry.isValid() && expiry.isBefore(sixMonthsFromNow) && b.quantity > 0) {
                        nearExpiryCount++;
                        nearExpiryProducts.push({
                            id: p.id,
                            name: p.name,
                            batchNumber: b.batchNumber,
                            expiryDate: b.expiryDate,
                            quantity: Math.floor(b.quantity / (p.conversionRate || 1)),
                            unit: p.unit || p.baseUnitName
                        });
                    }
                }
            });
        });

        // Sort by priority
        lowStockProducts.sort((a, b) => a.quantity - b.quantity);
        nearExpiryProducts.sort((a, b) => dayjs(a.expiryDate, 'DD-MM-YYYY').unix() - dayjs(b.expiryDate, 'DD-MM-YYYY').unix());

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
                lowStockProducts: lowStockProducts,
                nearExpiryProducts: nearExpiryProducts,
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
