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

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));

async function checkMorningOrders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối MongoDB thành công\n');

        // Lấy các đơn từ 00:00 đến 06:59:59 sáng ngày 9/7 theo giờ VN
        const slips = await ExportSlip.find({
            exportDate: {
                $gte: new Date('2026-07-09T00:00:00+07:00'),
                $lte: new Date('2026-07-09T06:59:59+07:00')
            },
            isDeleted: { $ne: true }
        }).sort({ exportDate: 1 });

        console.log(`📋 Các đơn hàng từ 00:00 đến 06:59 sáng ngày 09/07/2026\n`);
        
        if (slips.length === 0) {
            console.log('Khoảng thời gian này KHÔNG CÓ đơn hàng nào được tạo.');
        } else {
            console.log('═'.repeat(90));
            console.log(`${'Mã phiếu'.padEnd(16)} | ${'Giờ tạo (VN)'.padEnd(12)} | ${'Doanh thu'.padStart(12)} | ${'Lợi nhuận'.padStart(12)} | ${'Khách hàng'.padEnd(20)}`);
            console.log('═'.repeat(90));

            let totalRev = 0;
            let totalProfit = 0;

            slips.forEach(slip => {
                const vnDate = new Date(slip.exportDate.getTime() + (7 * 60 * 60 * 1000));
                const timeStr = `${String(vnDate.getUTCHours()).padStart(2, '0')}:${String(vnDate.getUTCMinutes()).padStart(2, '0')}`;
                
                let slipProfit = 0;
                slip.items.forEach(item => {
                    slipProfit += (item.retailPrice - item.importPrice) * item.quantity;
                });

                console.log(`${slip.id.padEnd(16)} | ${timeStr.padEnd(12)} | ${fmt(slip.totalAmount).padStart(10)} đ | ${fmt(slipProfit).padStart(10)} đ | ${(slip.customerName || 'Khách lẻ').substring(0,20).padEnd(20)}`);
                
                totalRev += slip.totalAmount || 0;
                totalProfit += slipProfit;
            });

            console.log('═'.repeat(90));
            console.log(`📊 Tổng cộng ${slips.length} đơn hàng:`);
            console.log(`   - Tổng Doanh thu : ${fmt(totalRev)} đ`);
            console.log(`   - Tổng Lợi nhuận : ${fmt(totalProfit)} đ`);
            console.log('═'.repeat(90));
            console.log('\n💡 ĐÂY CHÍNH LÀ NGUYÊN NHÂN:');
            console.log('Các đơn hàng này được tạo vào lúc 0h - 3h sáng ngày 9/7 (Giờ VN).');
            console.log('Nhưng theo giờ quốc tế (UTC) thì vẫn đang là buổi chiều/tối ngày 8/7.');
            console.log('Vì vậy Dashboard (khi chưa sửa lỗi) đã CỘNG NHẦM các đơn này vào báo cáo ngày 8/7!');
        }

    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkMorningOrders();
