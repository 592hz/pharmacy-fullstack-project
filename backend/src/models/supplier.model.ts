import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
    code: string;
    name: string;
    address?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    contactPerson?: string;
    businessLicense?: string;
    notes?: string;
    isNational: boolean;
    isDefaultImport: boolean;
    debt: number;
}

const SupplierSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String },
    taxCode: { type: String },
    phone: { type: String },
    email: { type: String },
    contactPerson: { type: String },
    businessLicense: { type: String },
    notes: { type: String },
    isNational: { type: Boolean, default: true },
    isDefaultImport: { type: Boolean, default: false },
    debt: { type: Number, default: 0 }
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

export default mongoose.model<ISupplier>('Supplier', SupplierSchema);
