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
const toVN = (d: Date) => new Date(d.getTime() + VN_OFFSET_MS);
const isSameDay = (a: Date, b: Date) => { const av = toVN(a), bv = toVN(b); return av.getUTCFullYear() === bv.getUTCFullYear() && av.getUTCMonth() === bv.getUTCMonth() && av.getUTCDate() === bv.getUTCDate(); };
const isSameMonth = (a: Date, b: Date) => { const av = toVN(a), bv = toVN(b); return av.getUTCFullYear() === bv.getUTCFullYear() && av.getUTCMonth() === bv.getUTCMonth(); };
const startOfDayVN = (d: Date) => { const v = toVN(d); return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()) - VN_OFFSET_MS); };
const startOfMonthVN = (d: Date) => { const v = toVN(d); return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), 1) - VN_OFFSET_MS); };
const startOfYearVN = (d: Date) => { const v = toVN(d); return new Date(Date.UTC(v.getUTCFullYear(), 0, 1) - VN_OFFSET_MS); };
const getDayOfMonthVN = (d: Date) => toVN(d).getUTCDate();
const formatDayMonthVN = (d: Date) => { const v = toVN(d); return `${String(v.getUTCDate()).padStart(2,'0')}/${String(v.getUTCMonth()+1).padStart(2,'0')}`; };

export const getSummary = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const startOfDay = startOfDayVN(now);
        const startOfMonth = startOfMonthVN(now);
        const startOfYear = startOfYearVN(now);

        // 1. Doanh thu & Lợi nhuận (Today, Month, Year)
        const exportSlips = await ExportSlip.find({
            exportDate: { $gte: startOfYear },
            isDeleted: { $ne: true }   // Loại trừ phiếu đã xóa
        });

        const allCategories = await Category.find({
            date: { $gte: startOfYear }
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
        const todayCategories = allCategories.filter(c => isSameDay(new Date(c.date), now));

        const monthSlips = exportSlips.filter(s => isSameMonth(s.exportDate, now));
        const monthCategories = allCategories.filter(c => isSameMonth(new Date(c.date), now));

        const statsToday = calculateStats(todaySlips, todayCategories);
        const statsMonth = calculateStats(monthSlips, monthCategories);
        const statsYear = calculateStats(exportSlips, allCategories);


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
                // Nếu đơn vị chính là VIÊN -> So sánh trực tiếp tổng số viên
                currentQty = totalBaseQty;
                threshold = 100;
            } else if (unitName.includes('vỉ')) {
                // Nếu đơn vị chính là VỈ -> Tính theo số vỉ
                currentQty = Math.floor(totalBaseQty / (conversionRate || 1));
                threshold = 5;
            } else {
                // Các đơn vị khác (Hộp, Lọ, Chai,...) -> Tính theo đơn vị chính
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
        const todayDayVN = getDayOfMonthVN(now);
        for (let i = 0; i < todayDayVN; i++) {
            // Tạo Date cho ngày i+1 của tháng hiện tại theo giờ VN
            const vnNow = toVN(now);
            const dayDate = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), i + 1) - VN_OFFSET_MS);
            const dayStr = formatDayMonthVN(dayDate);
            const daySlips = monthSlips.filter(s => isSameDay(s.exportDate, dayDate));
            const dayCategories = monthCategories.filter(c => isSameDay(new Date(c.date), dayDate));
            const dayStats = calculateStats(daySlips, dayCategories);
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
                totalIncome: statsMonth.income,
                totalExpense: statsMonth.expense,
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
