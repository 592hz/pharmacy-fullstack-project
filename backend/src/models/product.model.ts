import mongoose, { Schema, Document } from 'mongoose';

export interface IProductBatch {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
}

export interface IProduct extends Document {
    id: string; // SKU or Barcode
    name: string;
    unit: string;
    importPrice: number;
    retailPrice: number;
    wholesalePrice: number;
    registrationNo?: string;
    isDQG?: boolean;
    manufacturer?: string;
    categoryId?: string;
    supplierId?: string;
    baseQuantity: number;
    baseUnitName?: string;
    conversionRate?: number;
    batches?: IProductBatch[];
}

const ProductBatchSchema = new Schema({
    batchNumber: { type: String, required: true },
    expiryDate: { type: String, required: true },
    quantity: { type: Number, required: true }
});

const ProductSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    importPrice: { type: Number, required: true },
    retailPrice: { type: Number, required: true },
    wholesalePrice: { type: Number, required: true },
    registrationNo: { type: String },
    isDQG: { type: Boolean, default: false },
    manufacturer: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    baseQuantity: { type: Number, required: true },
    baseUnitName: { type: String },
    conversionRate: { type: Number, default: 1 },
    batches: [ProductBatchSchema]
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
