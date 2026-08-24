// Script phân tích lệch múi giờ UTC vs UTC+7 cho ngày 8/7/2026
// Chạy: npx tsx check-timezone-shift.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const ExportSlipSchema = new mongoose.Schema({
    id: String, exportDate: Date, customerName: String,
    totalAmount: Number,
    items: [{ retailPrice: Number, importPrice: Number, quantity: Number, _id: false }],
    isDeleted: { type: Boolean, default: false }
});
const ExportSlip = mongoose.model('ExportSlip', ExportSlipSchema);

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const toVNTime = (utcDate) => new Date(utcDate.getTime() + VN_OFFSET_MS);

async function analyze() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công\n');

    // Lấy tất cả đơn của tháng 7 (không bị xóa)
    const slips = await ExportSlip.find({
        exportDate: {
            $gte: new Date('2026-07-01T00:00:00+07:00'),
            $lte: new Date('2026-07-09T23:59:59+07:00')
        },
        isDeleted: { $ne: true }
    }).sort({ exportDate: 1 });

    console.log(`📋 Tổng đơn hàng từ 1/7 - 9/7: ${slips.length}\n`);

    // Phân tích các đơn trong khoảng 00:00 - 06:59 giờ VN
    // (= 17:00 - 23:59 UTC ngày hôm trước)
    // → Nếu server UTC: bị đếm vào NGÀY TRƯỚC
    const boundary = [];

    for (const slip of slips) {
        const vnDate = toVNTime(slip.exportDate);
        const vnHour = vnDate.getUTCHours(); // giờ trong ngày theo VN

        if (vnHour < 7) { // 00:00 - 06:59 VN = thuộc ngày trước nếu tính UTC
            const profit = slip.items.reduce((s, i) =>
                s + (i.retailPrice - i.importPrice) * i.quantity, 0);

            boundary.push({
                id: slip.id,
                exportDate: slip.exportDate,
                vnDay: `${String(vnDate.getUTCDate()).padStart(2,'0')}/${String(vnDate.getUTCMonth()+1).padStart(2,'0')} ${String(vnHour).padStart(2,'0')}:${String(vnDate.getUTCMinutes()).padStart(2,'0')}`,
                utcDay: `${String(slip.exportDate.getUTCDate()).padStart(2,'0')}/${String(slip.exportDate.getUTCMonth()+1).padStart(2,'0')} ${String(slip.exportDate.getUTCHours()).padStart(2,'0')}:${String(slip.exportDate.getUTCMinutes()).padStart(2,'0')}`,
                revenue: slip.totalAmount,
                profit,
                customer: slip.customerName
            });
        }
    }

    if (boundary.length === 0) {
        console.log('✅ Không có đơn nào trong khoảng 00:00-06:59 VN → Không bị lệch ngày!\n');
    } else {
        console.log(`⚠️  Số đơn bị lệch ngày (00:00-06:59 giờ VN): ${boundary.length} đơn`);
        console.log('   (Nếu server UTC → các đơn này bị tính vào NGÀY TRƯỚC)\n');
        console.log('─'.repeat(100));
        console.log(`${'Mã phiếu'.padEnd(18)} | ${'Giờ VN (đúng)'.padEnd(14)} | ${'Giờ UTC (sai)'.padEnd(14)} | ${'Khách'.padEnd(20)} | ${'Doanh thu'.padStart(12)} | ${'Lợi nhuận'.padStart(12)}`);
        console.log('─'.repeat(100));

        let totalRevShift = 0, totalProfitShift = 0;
        boundary.forEach(b => {
            console.log(`${b.id?.padEnd(18)} | ${b.vnDay.padEnd(14)} | ${b.utcDay.padEnd(14)} | ${(b.customer||'').substring(0,20).padEnd(20)} | ${fmt(b.revenue).padStart(12)} đ | ${fmt(b.profit).padStart(12)} đ`);
            totalRevShift += b.revenue;
            totalProfitShift += b.profit;
        });

        console.log('─'.repeat(100));
        console.log(`\n📊 Tổng ảnh hưởng nếu server UTC:`);
        console.log(`   Số đơn bị lệch    : ${boundary.length} đơn`);
        console.log(`   Doanh thu bị lệch : ${fmt(totalRevShift)} đ`);
        console.log(`   Lợi nhuận bị lệch : ${fmt(totalProfitShift)} đ`);
        console.log(`\n   → Ngày đúng (VN) thiếu ${boundary.length} đơn = -${fmt(totalRevShift)} đ doanh thu`);
        console.log(`   → Ngày trước (VN) thừa ${boundary.length} đơn = +${fmt(totalRevShift)} đ doanh thu`);
    }

    await mongoose.disconnect();
}

analyze().catch(console.error);
