import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    notes?: string;
    type: 'Thu' | 'Chi';
    amount: number;
    date: Date;
}

const CategorySchema: Schema = new Schema({
    name: { type: String, required: true },
    notes: { type: String },
    type: { type: String, enum: ['Thu', 'Chi'], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<ICategory>('Category', CategorySchema);
