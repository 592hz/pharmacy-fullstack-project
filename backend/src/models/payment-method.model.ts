import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentMethod extends Document {
    name: string;
    notes?: string;
    isDefault: boolean;
}

const PaymentMethodSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    notes: { type: String },
    isDefault: { type: Boolean, default: false }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

PaymentMethodSchema.virtual('id').get(function() {
    return (this as any)._id.toHexString();
});

export default mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);
