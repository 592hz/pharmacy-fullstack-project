// Script kiểm tra lợi nhuận ngày 8/7/2026
// Chạy: node check-profit-july8.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const ExportSlipItemSchema = new mongoose.Schema({
    code: String, name: String, unit: String,
    quantity: Number, retailPrice: Number, importPrice: Number,
    totalAmount: Number, remainingAmount: Number,
    discountPercent: { type: Number, default: 0 },
}, { _id: false });

const ExportSlipSchema = new mongoose.Schema({
    id: String, exportDate: Date, customerName: String,
    totalAmount: Number, grandTotal: Number,
    items: [ExportSlipItemSchema], isDeleted: { type: Boolean, default: false }
});

const ExportSlip = mongoose.model('ExportSlip', ExportSlipSchema);

async function checkProfitJuly8() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Kết nối MongoDB thành công\n');

        const start = new Date('2026-07-08T00:00:00+07:00');
        const end   = new Date('2026-07-08T23:59:59+07:00');

        const slips = await ExportSlip.find({
            exportDate: { $gte: start, $lte: end },
            isDeleted: { $ne: true }
        }).sort({ exportDate: 1 });

        console.log(`📋 Số phiếu xuất ngày 08/07/2026: ${slips.length}\n`);

        const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

        let totalRevenue = 0;
        let totalProfit  = 0;
        let totalCost    = 0;

        slips.forEach((slip, i) => {
            let slipProfit = 0;
            let slipCost   = 0;

            slip.items.forEach(item => {
                const profit = (item.retailPrice - item.importPrice) * item.quantity;
                const cost   = item.importPrice * item.quantity;
                slipProfit += profit;
                slipCost   += cost;
            });

            totalRevenue += slip.totalAmount || 0;
            totalProfit  += slipProfit;
            totalCost    += slipCost;

            const time = new Date(slip.exportDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
            console.log(`[${String(i+1).padStart(2,'0')}] ${slip.id} | ${time} | KH: ${slip.customerName?.padEnd(20,' ')} | DT: ${fmt(slip.totalAmount).padStart(12,' ')} đ | LN: ${fmt(slipProfit).padStart(12,' ')} đ | Giá vốn: ${fmt(slipCost).padStart(12,' ')} đ`);

            // Chi tiết item
            slip.items.forEach(item => {
                const p = (item.retailPrice - item.importPrice) * item.quantity;
                console.log(`        └─ ${item.name?.substring(0,30).padEnd(32,' ')} | SL: ${String(item.quantity).padStart(4,' ')} | Giá bán: ${fmt(item.retailPrice).padStart(10,' ')} | Giá nhập: ${fmt(item.importPrice).padStart(10,' ')} | LN: ${fmt(p).padStart(10,' ')}`);
            });
        });

        console.log('\n' + '═'.repeat(100));
        console.log(`📊 TỔNG KẾT NGÀY 08/07/2026`);
        console.log(`   Số đơn hàng : ${slips.length}`);
        console.log(`   Doanh thu   : ${fmt(totalRevenue)} đ`);
        console.log(`   Giá vốn     : ${fmt(totalCost)} đ`);
        console.log(`   Lợi nhuận   : ${fmt(totalProfit)} đ`);
        console.log(`   Tỷ lệ LN    : ${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%`);
        console.log('═'.repeat(100));

    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkProfitJuly8();
