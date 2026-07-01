import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrderItem {
    id: string;
    code: string;
    name: string;
    unit: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    importPrice: number;
    retailPrice: number;
    totalAmount: number;
    discountPercent: number;
    discountAmount: number;
    vatPercent: number;
    vatAmount: number;
    remainingAmount: number;
    registrationNumber: string;
}

export interface IPurchaseOrder extends Document {
    id: string;
    importDate: Date;
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    discount: number;
    vat: number;
    grandTotal: number;
    notes?: string;
    createdBy: string;
    invoiceNumber: string;
    paymentMethod?: string;
    items: IPurchaseOrderItem[];
    isDeleted: boolean;
    deletedAt?: Date;
}

const PurchaseOrderItemSchema = new Schema({
    id: { type: String, required: [true, 'Mã sản phẩm không được để trống'] },
    code: { type: String, required: [true, 'Mã vạch/Mã sản phẩm không được để trống'] },
    name: { type: String, required: [true, 'Tên sản phẩm không được để trống'] },
    unit: { type: String, required: [true, 'Đơn vị tính không được để trống'] },
    batchNumber: { type: String },
    expiryDate: { type: String },
    quantity: { type: Number, required: [true, 'Số lượng không được để trống'] },
    importPrice: { type: Number, required: [true, 'Giá nhập không được để trống'] },
    retailPrice: { type: Number, required: [true, 'Giá bán lẻ không được để trống'] },
    totalAmount: { type: Number, required: [true, 'Tổng tiền không được để trống'] },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    vatPercent: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: [true, 'Số tiền còn lại không được để trống'] },
    registrationNumber: { type: String }
});

const PurchaseOrderSchema: Schema = new Schema({
    id: { type: String, required: [true, 'Mã đơn nhập hàng không được để trống'], unique: true },
    importDate: { type: Date, required: [true, 'Ngày nhập hàng không được để trống'] },
    supplierId: { type: String, required: [true, 'Mã nhà cung cấp không được để trống'] },
    supplierName: { type: String, required: [true, 'Tên nhà cung cấp không được để trống'] },
    totalAmount: { type: Number, required: [true, 'Tổng số tiền không được để trống'] },
    discount: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    grandTotal: { type: Number, required: [true, 'Tổng cộng tiền thanh toán không được để trống'] },
    notes: { type: String },
    createdBy: { type: String, required: [true, 'Người tạo đơn nhập không được để trống'] },
    invoiceNumber: { type: String },
    paymentMethod: { type: String },
    items: [PurchaseOrderItemSchema],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
