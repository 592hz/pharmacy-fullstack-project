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
    name: { type: String, required: true },
    price: { type: Number, required: true },
    components: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true }
    }]
}, { timestamps: true });

export default mongoose.model<IDoseTemplate>('DoseTemplate', DoseTemplateSchema);
