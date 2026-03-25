import mongoose, { Schema, Document } from 'mongoose';

export interface IUnit extends Document {
    name: string;
}

const UnitSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
 });

UnitSchema.virtual('id').get(function() {
    return (this as any)._id.toHexString();
});

export default mongoose.model<IUnit>('Unit', UnitSchema);
