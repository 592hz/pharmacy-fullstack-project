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
    id: { type: String, required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    batchNumber: { type: String },
    expiryDate: { type: String },
    quantity: { type: Number, required: true },
    importPrice: { type: Number, required: true },
    retailPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    vatPercent: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    registrationNumber: { type: String }
});

const PurchaseOrderSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    importDate: { type: Date, required: true },
    supplierId: { type: String, required: true },
    supplierName: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    notes: { type: String },
    createdBy: { type: String, required: true },
    invoiceNumber: { type: String },
    paymentMethod: { type: String },
    items: [PurchaseOrderItemSchema],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
