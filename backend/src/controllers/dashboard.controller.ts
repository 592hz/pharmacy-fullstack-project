import { Request, Response } from 'express';
import ExportSlip from '../models/export-slip.model.js';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';

// ── UTC+7 helpers (không cần plugin timezone) ─────────────────────────────────
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const toVN = (d: Date | string | number) => {
    if (!d) return new Date(0);
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return new Date(0);
    return new Date(dateObj.getTime() + VN_OFFSET_MS);
};

const getVNKeyDay = (d: Date | string | number) => {
    const v = toVN(d);
    return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, '0')}-${String(v.getUTCDate()).padStart(2, '0')}`;
};

const getVNKeyMonth = (d: Date | string | number) => {
    const v = toVN(d);
    return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, '0')}`;
};

const startOfYearVN = (d: Date) => { const v = toVN(d); return new Date(Date.UTC(v.getUTCFullYear(), 0, 1) - VN_OFFSET_MS); };
const getDayOfMonthVN = (d: Date) => toVN(d).getUTCDate();
const formatDayMonthVN = (d: Date | string | number) => { const v = toVN(d); return `${String(v.getUTCDate()).padStart(2,'0')}/${String(v.getUTCMonth()+1).padStart(2,'0')}`; };

// Ultra-fast native date parser replacement for dayjs multi-format loop
const parseExpiryDateFast = (dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const s = dateStr.trim();
    if (!s) return null;

    if (s.length >= 10 && (s[4] === '-' || s[4] === '/')) {
        const parts = s.split(/[-/]/);
        if (parts.length >= 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
        }
    }

    const parts = s.split(/[-/]/);
    if (parts.length >= 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        let y = parseInt(parts[2], 10);
        if (y < 100) y += 2000;
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m, d);
    }

    const native = new Date(s);
    return isNaN(native.getTime()) ? null : native;
};

export const getSummary = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const startOfYear = startOfYearVN(now);

        const currentVN = toVN(now);
        const rawMonth = req.query.month;
        const rawYear = req.query.year;
        const reqMonth = typeof rawMonth === 'string' ? parseInt(rawMonth, 10) : (currentVN.getUTCMonth() + 1);
        const reqYear = typeof rawYear === 'string' ? parseInt(rawYear, 10) : currentVN.getUTCFullYear();

        const reqMonthIdx = reqMonth - 1;
        const startOfReqMonth = new Date(Date.UTC(reqYear, reqMonthIdx, 1) - VN_OFFSET_MS);
        const endOfReqMonth = new Date(Date.UTC(reqYear, reqMonthIdx + 1, 0, 23, 59, 59, 999) - VN_OFFSET_MS);

        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let earliestDate = sevenDaysAgo < startOfYear ? sevenDaysAgo : startOfYear;
        if (startOfReqMonth < earliestDate) {
            earliestDate = startOfReqMonth;
        }

        let latestDate = now;
        if (endOfReqMonth > latestDate) {
            latestDate = endOfReqMonth;
        }

        // 1. Parallelized lean queries with strict field selection and MongoDB indexes
        const [exportSlips, allCategories, allProducts] = await Promise.all([
            ExportSlip.find({
                exportDate: { $gte: earliestDate, $lte: latestDate },
                isDeleted: { $ne: true }
            })
                .select('exportDate totalAmount items.retailPrice items.importPrice items.quantity')
                .lean(),

            Category.find({
                date: { $gte: earliestDate, $lte: latestDate }
            })
                .select('type amount date')
                .lean(),

            Product.find({ isDeleted: { $ne: true } })
                .select('_id id name unit baseUnitName conversionRate baseQuantity batches.batchNumber batches.expiryDate batches.quantity')
                .lean()
        ]);

        // 2. Pre-index slips & categories into O(1) Hash Maps by Day & Month
        const todayKey = getVNKeyDay(now);
        const reqMonthKey = `${reqYear}-${String(reqMonth).padStart(2, '0')}`;
        const currentYearKey = `${reqYear}`;

        const daySlipsMap = new Map<string, { slips: any[]; revenue: number; profit: number }>();
        const dayCatMap = new Map<string, { income: number; expense: number }>();
        const monthSlipsMap = new Map<string, { slips: any[]; revenue: number; profit: number }>();
        const monthCatMap = new Map<string, { income: number; expense: number }>();

        const statsToday = { revenue: 0, profit: 0, income: 0, expense: 0, netProfit: 0, totalOrders: 0 };
        const statsMonth = { revenue: 0, profit: 0, income: 0, expense: 0, netProfit: 0, totalOrders: 0 };
        const statsYear = { revenue: 0, profit: 0, income: 0, expense: 0, netProfit: 0, totalOrders: 0 };

        // Process Export Slips in a single O(N) pass
        exportSlips.forEach((slip: any) => {
            const dayKey = getVNKeyDay(slip.exportDate);
            const monthKey = getVNKeyMonth(slip.exportDate);
            const yearStr = `${toVN(slip.exportDate).getUTCFullYear()}`;

            let slipProfit = 0;
            const rev = slip.totalAmount || 0;
            if (slip.items) {
                for (let i = 0; i < slip.items.length; i++) {
                    const item = slip.items[i];
                    slipProfit += ((item.retailPrice || 0) - (item.importPrice || 0)) * (item.quantity || 0);
                }
            }

            // Day map update
            let dEntry = daySlipsMap.get(dayKey);
            if (!dEntry) {
                dEntry = { slips: [], revenue: 0, profit: 0 };
                daySlipsMap.set(dayKey, dEntry);
            }
            dEntry.slips.push(slip);
            dEntry.revenue += rev;
            dEntry.profit += slipProfit;

            // Month map update
            let mEntry = monthSlipsMap.get(monthKey);
            if (!mEntry) {
                mEntry = { slips: [], revenue: 0, profit: 0 };
                monthSlipsMap.set(monthKey, mEntry);
            }
            mEntry.slips.push(slip);
            mEntry.revenue += rev;
            mEntry.profit += slipProfit;

            // Accumulate stats
            if (dayKey === todayKey) {
                statsToday.revenue += rev;
                statsToday.profit += slipProfit;
                statsToday.totalOrders += 1;
            }
            if (monthKey === reqMonthKey) {
                statsMonth.revenue += rev;
                statsMonth.profit += slipProfit;
                statsMonth.totalOrders += 1;
            }
            if (yearStr === currentYearKey) {
                statsYear.revenue += rev;
                statsYear.profit += slipProfit;
                statsYear.totalOrders += 1;
            }
        });

        // Process Categories in a single O(N) pass
        allCategories.forEach((c: any) => {
            const dayKey = getVNKeyDay(c.date);
            const monthKey = getVNKeyMonth(c.date);
            const yearStr = `${toVN(c.date).getUTCFullYear()}`;
            const amt = c.amount || 0;
            const isThu = c.type === 'Thu';

            // Day map
            let dEntry = dayCatMap.get(dayKey);
            if (!dEntry) {
                dEntry = { income: 0, expense: 0 };
                dayCatMap.set(dayKey, dEntry);
            }
            if (isThu) dEntry.income += amt;
            else dEntry.expense += amt;

            // Month map
            let mEntry = monthCatMap.get(monthKey);
            if (!mEntry) {
                mEntry = { income: 0, expense: 0 };
                monthCatMap.set(monthKey, mEntry);
            }
            if (isThu) mEntry.income += amt;
            else mEntry.expense += amt;

            // Accumulate stats
            if (dayKey === todayKey) {
                if (isThu) statsToday.income += amt;
                else statsToday.expense += amt;
            }
            if (monthKey === reqMonthKey) {
                if (isThu) statsMonth.income += amt;
                else statsMonth.expense += amt;
            }
            if (yearStr === currentYearKey) {
                if (isThu) statsYear.income += amt;
                else statsYear.expense += amt;
            }
        });

        statsToday.netProfit = statsToday.profit + statsToday.income - statsToday.expense;
        statsMonth.netProfit = statsMonth.profit + statsMonth.income - statsMonth.expense;
        statsYear.netProfit = statsYear.profit + statsYear.income - statsYear.expense;

        // 3. Low Stock & Near Expiry check with optimized fast date parser
        let lowStockCount = 0;
        let nearExpiryCount = 0;
        const lowStockProducts: any[] = [];
        const nearExpiryProducts: any[] = [];

        const sixMonthsFromNow = new Date(now.getTime());
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        for (let pIdx = 0; pIdx < allProducts.length; pIdx++) {
            const p: any = allProducts[pIdx];
            const productId = p.id || p._id?.toString();
            const totalBaseQty = p.batches?.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0) || p.baseQuantity || 0;
            const conversionRate = p.conversionRate || 1;
            const unitName = (p.unit || '').toLowerCase();

            let currentQty = 0;
            let threshold = 2;

            if (unitName.includes('viên') || unitName === 'v') {
                currentQty = totalBaseQty;
                threshold = 100;
            } else if (unitName.includes('vỉ')) {
                currentQty = Math.floor(totalBaseQty / conversionRate);
                threshold = 5;
            } else {
                currentQty = Math.floor(totalBaseQty / conversionRate);
                threshold = 2;
            }

            if (currentQty <= threshold) {
                lowStockCount++;
                lowStockProducts.push({
                    id: productId,
                    name: p.name,
                    quantity: currentQty,
                    unit: p.unit || p.baseUnitName
                });
            }

            if (p.batches) {
                for (let bIdx = 0; bIdx < p.batches.length; bIdx++) {
                    const b = p.batches[bIdx];
                    if (b.expiryDate && (b.quantity || 0) > 0) {
                        const expiry = parseExpiryDateFast(b.expiryDate);
                        if (expiry && expiry < sixMonthsFromNow) {
                            nearExpiryCount++;
                            nearExpiryProducts.push({
                                id: productId,
                                name: p.name,
                                batchNumber: b.batchNumber,
                                expiryDate: b.expiryDate,
                                quantity: Math.floor((b.quantity || 0) / conversionRate),
                                unit: p.unit || p.baseUnitName
                            });
                        }
                    }
                }
            }
        }

        lowStockProducts.sort((a, b) => a.quantity - b.quantity);

        // 4. Build chart data instantly using O(1) hash maps

        // 4a. 7 ngày gần nhất (Week)
        const chartDataWeek: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayKey = getVNKeyDay(dayDate);
            const dayStr = formatDayMonthVN(dayDate);
            const slipEntry = daySlipsMap.get(dayKey);

            chartDataWeek.push({
                name: dayStr,
                DoanhThu: slipEntry ? slipEntry.revenue : 0,
                LoiNhuan: slipEntry ? slipEntry.profit : 0,
                SoDon: slipEntry ? slipEntry.slips.length : 0
            });
        }

        // 4b. Tháng hiện tại (Month)
        const chartDataMonth: any[] = [];
        const todayDayVN = getDayOfMonthVN(now);
        for (let i = 0; i < todayDayVN; i++) {
            const vnNow = toVN(now);
            const dayDate = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), i + 1) - VN_OFFSET_MS);
            const dayKey = getVNKeyDay(dayDate);
            const dayStr = formatDayMonthVN(dayDate);
            const slipEntry = daySlipsMap.get(dayKey);

            chartDataMonth.push({
                name: dayStr,
                DoanhThu: slipEntry ? slipEntry.revenue : 0,
                LoiNhuan: slipEntry ? slipEntry.profit : 0,
                SoDon: slipEntry ? slipEntry.slips.length : 0
            });
        }

        // 4c. 12 Tháng trong năm (Year)
        const chartDataYear: any[] = [];
        for (let m = 0; m < 12; m++) {
            const monthKey = `${reqYear}-${String(m + 1).padStart(2, '0')}`;
            const slipEntry = monthSlipsMap.get(monthKey);

            chartDataYear.push({
                name: `Tháng ${m + 1}`,
                DoanhThu: slipEntry ? slipEntry.revenue : 0,
                LoiNhuan: slipEntry ? slipEntry.profit : 0,
                SoDon: slipEntry ? slipEntry.slips.length : 0
            });
        }

        // 4d. Tháng/Năm tùy chọn (Custom Month)
        const daysInReqMonth = new Date(reqYear, reqMonth, 0).getDate();
        const chartDataCustomMonth: any[] = [];

        for (let d = 1; d <= daysInReqMonth; d++) {
            const dayDate = new Date(Date.UTC(reqYear, reqMonthIdx, d) - VN_OFFSET_MS);
            const dayKey = getVNKeyDay(dayDate);
            const dayStr = `${String(d).padStart(2, '0')}/${String(reqMonth).padStart(2, '0')}`;
            const slipEntry = daySlipsMap.get(dayKey);

            chartDataCustomMonth.push({
                name: dayStr,
                DoanhThu: slipEntry ? slipEntry.revenue : 0,
                LoiNhuan: slipEntry ? slipEntry.profit : 0,
                SoDon: slipEntry ? slipEntry.slips.length : 0
            });
        }

        // Add Cache-Control header to enable browser/client fast revalidations
        res.setHeader('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');

        res.json({
            stats: {
                today: statsToday,
                month: statsMonth,
                year: statsYear,
                totalIncome: statsMonth.income,
                totalExpense: statsMonth.expense,
                lowStockCount,
                nearExpiryCount,
                lowStockProducts,
                nearExpiryProducts,
                billCountToday: statsToday.totalOrders
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
