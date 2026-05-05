import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    id: string;
    name: string;
    phone?: string;
    dob?: string;
    address?: string;
    gender?: 'Nam' | 'Nữ' | 'Khác';
    weight?: string;
    age?: string;
    notes?: string;
    isDeleted?: boolean;
    deletedAt?: Date;
}

const CustomerSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String },
    dob: { type: String },
    address: { type: String },
    gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: 'Nam' },
    weight: { type: String },
    age: { type: String },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
