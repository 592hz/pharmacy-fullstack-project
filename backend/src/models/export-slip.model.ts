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
}

const ExportSlipItemSchema = new Schema({
    id: { type: String, required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    batchNumber: { type: String },
    expiryDate: { type: String },
    quantity: { type: Number, required: true },
    retailPrice: { type: Number, required: true },
    importPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true }
});

const ExportSlipSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    exportDate: { type: Date, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    totalAmount: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    notes: { type: String },
    createdBy: { type: String, required: true },
    paymentMethod: { type: String },
    paymentStatus: { type: String, default: 'Đã thanh toán' },
    items: [ExportSlipItemSchema],
    isPrescription: { type: Boolean, default: false },
    doctorName: { type: String },
    symptoms: { type: String }
}, { timestamps: true });

export default mongoose.model<IExportSlip>('ExportSlip', ExportSlipSchema);
