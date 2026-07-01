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
    isDeleted?: boolean;
    deletedAt?: Date;
}

const ProductBatchSchema = new Schema({
    batchNumber: { type: String, required: [true, 'Số lô sản xuất không được để trống'] },
    expiryDate: { type: String, required: [true, 'Hạn sử dụng không được để trống'] },
    quantity: { type: Number, required: [true, 'Số lượng trong lô không được để trống'] }
});

const ProductSchema: Schema = new Schema({
    id: { type: String, required: [true, 'Mã sản phẩm không được để trống'], unique: true },
    name: { type: String, required: [true, 'Tên sản phẩm không được để trống'] },
    unit: { type: String, required: [true, 'Đơn vị tính không được để trống'] },
    importPrice: { type: Number, required: [true, 'Giá nhập không được để trống'] },
    retailPrice: { type: Number, required: [true, 'Giá bán lẻ không được để trống'] },
    wholesalePrice: { type: Number, required: [true, 'Giá bán buôn không được để trống'] },
    registrationNo: { type: String },
    isDQG: { type: Boolean, default: false },
    manufacturer: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    baseQuantity: { type: Number, required: [true, 'Số lượng tồn kho ban đầu là bắt buộc'] },
    baseUnitName: { type: String },
    conversionRate: { type: Number, default: 1 },
    batches: [ProductBatchSchema],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
