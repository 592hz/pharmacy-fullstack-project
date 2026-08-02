import { Request, Response } from 'express';
import ExportSlip from '../models/export-slip.model.js';
import PurchaseOrder from '../models/purchase-order.model.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

// ── UTC+7 helpers (không cần plugin timezone) ─────────────────────────────────
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const toVN = (d: Date | string | number) => {
    if (!d) return new Date(0);
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return new Date(0);
    return new Date(dateObj.getTime() + VN_OFFSET_MS);
};
const isSameDay = (a: Date | string | number, b: Date | string | number) => {
    const av = toVN(a), bv = toVN(b);
    return av.getUTCFullYear() === bv.getUTCFullYear() && av.getUTCMonth() === bv.getUTCMonth() && av.getUTCDate() === bv.getUTCDate();
};
const isSameMonth = (a: Date | string | number, b: Date | string | number) => {
    const av = toVN(a), bv = toVN(b);
    return av.getUTCFullYear() === bv.getUTCFullYear() && av.getUTCMonth() === bv.getUTCMonth();
};
const startOfDayVN = (d: Date) => { const v = toVN(d); return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()) - VN_OFFSET_MS); };
const startOfMonthVN = (d: Date) => { const v = toVN(d); return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), 1) - VN_OFFSET_MS); };
const startOfYearVN = (d: Date) => { const v = toVN(d); return new Date(Date.UTC(v.getUTCFullYear(), 0, 1) - VN_OFFSET_MS); };
const getDayOfMonthVN = (d: Date) => toVN(d).getUTCDate();
const formatDayMonthVN = (d: Date | string | number) => { const v = toVN(d); return `${String(v.getUTCDate()).padStart(2,'0')}/${String(v.getUTCMonth()+1).padStart(2,'0')}`; };

export const getSummary = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const startOfDay = startOfDayVN(now);
        const startOfMonth = startOfMonthVN(now);
        const startOfYear = startOfYearVN(now);

        const currentVN = toVN(now);
        const reqMonth = req.query.month ? parseInt(req.query.month as string, 10) : (currentVN.getUTCMonth() + 1);
        const reqYear = req.query.year ? parseInt(req.query.year as string, 10) : currentVN.getUTCFullYear();

        const reqMonthIdx = reqMonth - 1;
        const startOfReqMonth = new Date(Date.UTC(reqYear, reqMonthIdx, 1) - VN_OFFSET_MS);
        const endOfReqMonth = new Date(Date.UTC(reqYear, reqMonthIdx + 1, 0, 23, 59, 59, 999) - VN_OFFSET_MS);

        // Fetch for past 7 days, start of year, or requested month, whichever is earliest
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let earliestDate = sevenDaysAgo < startOfYear ? sevenDaysAgo : startOfYear;
        if (startOfReqMonth < earliestDate) {
            earliestDate = startOfReqMonth;
        }

        let latestDate = now;
        if (endOfReqMonth > latestDate) {
            latestDate = endOfReqMonth;
        }

        // 1. Doanh thu & Lợi nhuận (Today, Selected/Current Month, Year)
        const exportSlips = await ExportSlip.find({
            exportDate: { $gte: earliestDate, $lte: latestDate },
            isDeleted: { $ne: true }   // Loại trừ phiếu đã xóa
        });

        const allCategories = await Category.find({
            date: { $gte: earliestDate, $lte: latestDate }
        });

        const calculateStats = (slips: any[], categories: any[]) => {
            let revenue = 0;
            let profit = 0;
            slips.forEach(slip => {
                revenue += slip.totalAmount || 0;
                slip.items.forEach((item: any) => {
                    const itemProfit = (item.retailPrice - item.importPrice) * item.quantity;
                    profit += itemProfit;
                });
            });

            const income = categories.filter(c => c.type === 'Thu').reduce((sum, c) => sum + (c.amount || 0), 0);
            const expense = categories.filter(c => c.type === 'Chi').reduce((sum, c) => sum + (c.amount || 0), 0);

            return { revenue, profit, income, expense, netProfit: profit + income - expense };
        };

        const todaySlips = exportSlips.filter(s => isSameDay(s.exportDate, now));
        const todayCategories = allCategories.filter(c => isSameDay(c.date, now));

        const selectedMonthSlips = exportSlips.filter(s => {
            const sv = toVN(s.exportDate);
            return sv.getUTCFullYear() === reqYear && sv.getUTCMonth() === reqMonthIdx;
        });
        const selectedMonthCategories = allCategories.filter(c => {
            const cv = toVN(c.date);
            return cv.getUTCFullYear() === reqYear && cv.getUTCMonth() === reqMonthIdx;
        });

        const yearSlips = exportSlips.filter(s => {
            const sv = toVN(s.exportDate);
            return sv.getUTCFullYear() === reqYear;
        });
        const yearCategories = allCategories.filter(c => {
            const cv = toVN(c.date);
            return cv.getUTCFullYear() === reqYear;
        });

        const statsToday = calculateStats(todaySlips, todayCategories);
        const statsMonth = calculateStats(selectedMonthSlips, selectedMonthCategories);
        const statsYear = calculateStats(yearSlips, yearCategories);


        // 3. Hàng sắp hết & Cận date
        const allProducts = await Product.find();
        let lowStockCount = 0;
        let nearExpiryCount = 0;
        const lowStockProducts: any[] = [];
        const nearExpiryProducts: any[] = [];

        const sixMonthsFromNow = new Date(now.getTime());
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        allProducts.forEach(p => {
            // 1. Tính tổng tồn kho (theo đơn vị cơ bản - viên/gói/...)
            const totalBaseQty = p.batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || p.baseQuantity || 0;
            const conversionRate = p.conversionRate || 1;

            const unitName = (p.unit || '').toLowerCase();
            const baseUnitName = (p.baseUnitName || '').toLowerCase();

            // 2. Xác định số lượng hiển thị và định mức (Threshold)
            let currentQty = 0;
            let threshold = 2; // Mặc định là 2 (Hộp/Lọ/Chai)

            if (unitName.includes('viên') || unitName === 'v') {
                currentQty = totalBaseQty;
                threshold = 100;
            } else if (unitName.includes('vỉ')) {
                currentQty = Math.floor(totalBaseQty / (conversionRate || 1));
                threshold = 5;
            } else {
                currentQty = Math.floor(totalBaseQty / (conversionRate || 1));
                threshold = 2;
            }

            // 3. Kiểm tra định mức
            if (currentQty <= threshold) {
                lowStockCount++;
                lowStockProducts.push({
                    id: p.id,
                    name: p.name,
                    quantity: currentQty,
                    unit: p.unit || p.baseUnitName
                });
            }

            // Near expiry check
            p.batches?.forEach((b: any) => {
                if (b.expiryDate) {
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

        // 4. Dữ liệu biểu đồ

        // 4a. 7 ngày gần nhất (Week)
        const chartDataWeek: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStr = formatDayMonthVN(dayDate);
            const daySlips = exportSlips.filter(s => isSameDay(s.exportDate, dayDate));
            const dayCategories = allCategories.filter(c => isSameDay(c.date, dayDate));
            const dayStats = calculateStats(daySlips, dayCategories);
            chartDataWeek.push({
                name: dayStr,
                DoanhThu: dayStats.revenue,
                LoiNhuan: dayStats.profit
            });
        }

        // 4b. Tháng hiện tại theo ngày (Month)
        const currentMonthSlipsForChart = exportSlips.filter(s => isSameMonth(s.exportDate, now));
        const currentMonthCategoriesForChart = allCategories.filter(c => isSameMonth(c.date, now));
        const chartDataMonth: any[] = [];
        const todayDayVN = getDayOfMonthVN(now);
        for (let i = 0; i < todayDayVN; i++) {
            const vnNow = toVN(now);
            const dayDate = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), i + 1) - VN_OFFSET_MS);
            const dayStr = formatDayMonthVN(dayDate);
            const daySlips = currentMonthSlipsForChart.filter(s => isSameDay(s.exportDate, dayDate));
            const dayCategories = currentMonthCategoriesForChart.filter(c => isSameDay(c.date, dayDate));
            const dayStats = calculateStats(daySlips, dayCategories);
            chartDataMonth.push({
                name: dayStr,
                DoanhThu: dayStats.revenue,
                LoiNhuan: dayStats.profit
            });
        }

        // 4c. 12 Tháng trong năm được chọn (Year)
        const chartDataYear: any[] = [];
        for (let m = 0; m < 12; m++) {
            const mSlips = yearSlips.filter(s => {
                const sv = toVN(s.exportDate);
                return sv.getUTCMonth() === m;
            });
            const mCategories = yearCategories.filter(c => {
                const cv = toVN(c.date);
                return cv.getUTCMonth() === m;
            });
            const mStats = calculateStats(mSlips, mCategories);
            chartDataYear.push({
                name: `Tháng ${m + 1}`,
                DoanhThu: mStats.revenue,
                LoiNhuan: mStats.profit
            });
        }

        // 4d. Tháng/Năm tùy chọn (Custom Month)
        const daysInReqMonth = new Date(reqYear, reqMonth, 0).getDate();
        const chartDataCustomMonth: any[] = [];

        for (let d = 1; d <= daysInReqMonth; d++) {
            const dayDate = new Date(Date.UTC(reqYear, reqMonthIdx, d) - VN_OFFSET_MS);
            const dayStr = `${String(d).padStart(2, '0')}/${String(reqMonth).padStart(2, '0')}`;
            const daySlips = selectedMonthSlips.filter(s => isSameDay(s.exportDate, dayDate));
            const dayCategories = selectedMonthCategories.filter(c => isSameDay(c.date, dayDate));
            const dayStats = calculateStats(daySlips, dayCategories);
            chartDataCustomMonth.push({
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
                totalIncome: statsMonth.income,
                totalExpense: statsMonth.expense,
                lowStockCount,
                nearExpiryCount,
                lowStockProducts: lowStockProducts,
                nearExpiryProducts: nearExpiryProducts,
                billCountToday: todaySlips.length
            },
            chartData: {
                week: chartDataWeek,
                month: chartDataMonth,
                year: chartDataYear,
                customMonth: chartDataCustomMonth,
                selectedMonth: reqMonth,
                selectedYear: reqYear
            }
        });


    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
