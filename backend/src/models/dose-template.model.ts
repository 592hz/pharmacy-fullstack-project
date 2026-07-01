import mongoose, { Schema, Document } from 'mongoose';

export interface IDoseTemplateComponent {
    product: mongoose.Types.ObjectId;
    quantity: number;
}

export interface IDoseTemplate extends Document {
    name: string;
    price: number;
    components: IDoseTemplateComponent[];
}

const DoseTemplateSchema: Schema = new Schema({
    name: { type: String, required: [true, 'Tên liều mẫu không được để trống'] },
    price: { type: Number, required: [true, 'Giá liều mẫu không được để trống'] },
    components: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: [true, 'Mã sản phẩm trong liều mẫu là bắt buộc'] },
        quantity: { type: Number, required: [true, 'Số lượng sản phẩm trong liều mẫu là bắt buộc'] }
    }]
}, { timestamps: true });

export default mongoose.model<IDoseTemplate>('DoseTemplate', DoseTemplateSchema);
