import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const ExportSlipSchema = new mongoose.Schema({
    id: String, exportDate: Date, customerName: String,
    totalAmount: Number,
    items: [{ name: String, retailPrice: Number, importPrice: Number, quantity: Number, remainingAmount: Number, _id: false }],
    isDeleted: { type: Boolean, default: false }
});
const ExportSlip = mongoose.model('ExportSlip', ExportSlipSchema);

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));

async function checkDeletedOrders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối MongoDB thành công\n');

        // Tìm TẤT CẢ đơn hàng trong tháng 7 đã bị XÓA MỀM (isDeleted: true)
        const deletedSlips = await ExportSlip.find({
            exportDate: {
                $gte: new Date('2026-07-01T00:00:00+07:00'),
                $lte: new Date('2026-07-31T23:59:59+07:00')
            },
            isDeleted: true
        });

        console.log(`🗑️ TÌM THẤY ${deletedSlips.length} ĐƠN HÀNG ĐÃ BỊ XÓA TRONG THÁNG 7:\n`);

        if (deletedSlips.length > 0) {
            let totalDeletedRev = 0;
            let totalDeletedProfit = 0;

            deletedSlips.forEach(slip => {
                const vnDate = new Date(slip.exportDate.getTime() + (7 * 60 * 60 * 1000));
                const dateStr = `${String(vnDate.getUTCDate()).padStart(2,'0')}/${String(vnDate.getUTCMonth()+1).padStart(2,'0')} ${String(vnDate.getUTCHours()).padStart(2, '0')}:${String(vnDate.getUTCMinutes()).padStart(2, '0')}`;
                
                let slipProfitWrongFormula = 0;
                let slipProfitRightFormula = 0;

                slip.items.forEach(item => {
                    // Tính bằng công thức sai lúc đó: remainingAmount - importPrice * qty
                    slipProfitWrongFormula += (item.remainingAmount || 0) - (item.importPrice * item.quantity);
                    
                    // Tính bằng công thức chuẩn: (retailPrice - importPrice) * qty
                    slipProfitRightFormula += (item.retailPrice - item.importPrice) * item.quantity;
                });

                console.log(`[Đơn ${slip.id}] - Xóa lúc: ${dateStr}`);
                console.log(`   - Doanh thu: ${fmt(slip.totalAmount)} đ`);
                console.log(`   - Lợi nhuận (Công thức đúng) : ${fmt(slipProfitRightFormula)} đ`);
                console.log(`   - Lợi nhuận (Công thức sai)  : ${fmt(slipProfitWrongFormula)} đ`);
                console.log(`   - Chi tiết các món:`);
                slip.items.forEach(i => console.log(`      └ ${i.name?.substring(0,30)} | Nhập: ${i.importPrice} | Bán: ${i.retailPrice} | Còn lại: ${i.remainingAmount}`));
                console.log('-');

                totalDeletedRev += slip.totalAmount || 0;
            });

            console.log(`\n💡 KẾT LUẬN: Tổng doanh thu các đơn đã xóa là ${fmt(totalDeletedRev)} đ.`);
            console.log(`Nếu con số này bằng ĐÚNG 30.000 đ thì bí ẩn đã được giải quyết hoàn toàn!`);
        } else {
            console.log('Không có đơn nào bị xóa.');
        }

    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDeletedOrders();
