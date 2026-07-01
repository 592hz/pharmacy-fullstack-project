import mongoose, { Schema, Document } from 'mongoose';

export interface IExportSlipItem {
    id: string;
    code: string;
    name: string;
    unit: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    retailPrice: number;
    importPrice: number;
    totalAmount: number;
    discountPercent: number;
    discountAmount: number;
    remainingAmount: number;
}

export interface IExportSlip extends Document {
    id: string;
    exportDate: Date;
    customerId: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    grandTotal: number;
    notes?: string;
    createdBy: string;
    paymentMethod?: string;
    paymentStatus?: string;
    items: IExportSlipItem[];
    isPrescription?: boolean;
    doctorName?: string;
    symptoms?: string;
    isDeleted: boolean;
    deletedAt?: Date;
}

const ExportSlipItemSchema = new Schema({
    id: { type: String, required: [true, 'Mã sản phẩm không được để trống'] },
    code: { type: String, required: [true, 'Mã vạch/Mã sản phẩm không được để trống'] },
    name: { type: String, required: [true, 'Tên sản phẩm không được để trống'] },
    unit: { type: String, required: [true, 'Đơn vị tính không được để trống'] },
    batchNumber: { type: String },
    expiryDate: { type: String },
    quantity: { type: Number, required: [true, 'Số lượng không được để trống'] },
    retailPrice: { type: Number, required: [true, 'Giá bán lẻ không được để trống'] },
    importPrice: { type: Number, required: [true, 'Giá nhập không được để trống'] },
    totalAmount: { type: Number, required: [true, 'Tổng tiền không được để trống'] },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: [true, 'Số tiền còn lại không được để trống'] }
});

const ExportSlipSchema: Schema = new Schema({
    id: { type: String, required: [true, 'Mã hóa đơn xuất không được để trống'], unique: true },
    exportDate: { type: Date, required: [true, 'Ngày xuất hóa đơn không được để trống'] },
    customerId: { type: String, required: [true, 'Mã khách hàng không được để trống'] },
    customerName: { type: String, required: [true, 'Tên khách hàng không được để trống'] },
    customerPhone: { type: String },
    totalAmount: { type: Number, required: [true, 'Tổng số tiền không được để trống'] },
    grandTotal: { type: Number, required: [true, 'Tổng cộng tiền thanh toán không được để trống'] },
    notes: { type: String },
    createdBy: { type: String, required: [true, 'Người tạo hóa đơn không được để trống'] },
    paymentMethod: { type: String },
    paymentStatus: { type: String, default: 'Đã thanh toán' },
    items: [ExportSlipItemSchema],
    isPrescription: { type: Boolean, default: false },
    doctorName: { type: String },
    symptoms: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IExportSlip>('ExportSlip', ExportSlipSchema);
