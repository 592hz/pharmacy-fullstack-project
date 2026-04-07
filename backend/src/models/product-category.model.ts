import mongoose, { Schema, Document } from 'mongoose';

export interface IProductCategory extends Document {
    code: string;
    name: string;
    notes?: string;
    isDeleted?: boolean;
    deletedAt?: Date;
}

const ProductCategorySchema: Schema = new Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { 
    timestamps: true,
    toJSON: {
        transform: function(_doc, ret: Record<string, unknown>) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

export default mongoose.model<IProductCategory>('ProductCategory', ProductCategorySchema);
