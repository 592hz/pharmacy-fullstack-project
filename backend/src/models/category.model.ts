import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    notes?: string;
    type: 'Thu' | 'Chi';
    amount: number;
    date: Date;
    purchaseOrderId?: string;
}

const CategorySchema: Schema = new Schema({
    name: { type: String, required: [true, 'Tên danh mục/giao dịch không được để trống'] },
    notes: { type: String },
    type: { type: String, enum: ['Thu', 'Chi'], required: [true, 'Loại giao dịch (Thu/Chi) là bắt buộc'] },
    amount: { type: Number, required: [true, 'Số tiền giao dịch không được để trống'] },
    date: { type: Date, default: Date.now },
    purchaseOrderId: { type: String }
}, { 
    timestamps: true,
    toJSON: {
        transform: function(doc, ret: any) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

CategorySchema.index({ date: 1, type: 1 });

export default mongoose.model<ICategory>('Category', CategorySchema);
