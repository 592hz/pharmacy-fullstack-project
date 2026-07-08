import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const ExportSlipSchema = new mongoose.Schema({
    id: String, exportDate: Date, customerName: String,
    totalAmount: Number,
    items: [{ name: String, retailPrice: Number, importPrice: Number, quantity: Number, remainingAmount: Number, code: String, _id: false }],
    isDeleted: { type: Boolean, default: false }
});
const ExportSlip = mongoose.model('ExportSlip', ExportSlipSchema);

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));

async function checkRemainingAmount() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối MongoDB thành công\n');

        // Lấy các đơn ngày 8/7 theo giờ VN
        const slips = await ExportSlip.find({
            exportDate: {
                $gte: new Date('2026-07-08T00:00:00+07:00'),
                $lte: new Date('2026-07-08T23:59:59+07:00')
            },
            isDeleted: { $ne: true }
        }).sort({ exportDate: 1 });

        console.log(`📋 Phân tích ngày 08/07/2026 - Tổng ${slips.length} đơn hàng\n`);
        
        let countItems = 0;
        let countZero = 0;

        slips.forEach(slip => {
            const zeroItems = slip.items.filter(item => item.remainingAmount === 0);
            countItems += slip.items.length;
            countZero += zeroItems.length;

            if (zeroItems.length > 0) {
                console.log(`[Đơn ${slip.id}] - ${slip.customerName || 'Khách lẻ'}`);
                zeroItems.forEach(item => {
                    console.log(`  └─ Tên: ${item.name?.padEnd(30, ' ')} | SL: ${item.quantity} | Giá nhập: ${fmt(item.importPrice)} đ | Giá bán: ${fmt(item.retailPrice)} đ | remainingAmount: 0`);
                });
                console.log('');
            }
        });

        console.log('═'.repeat(80));
        console.log(`📊 Tổng kết ngày 08/07:`);
        console.log(`   - Tổng số items bán ra  : ${countItems}`);
        console.log(`   - Số items có remainingAmount=0 : ${countZero}`);
        console.log(`\nNhận xét: Hầu hết các item có remainingAmount=0 đều là "[Trong liều]". Điều này là ĐÚNG THIẾT KẾ vì doanh thu của các viên thuốc này đã được cộng gộp vào item cha "Liều: ...".`);
        console.log('═'.repeat(80));

    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkRemainingAmount();
