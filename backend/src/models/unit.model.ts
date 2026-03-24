import mongoose, { Schema, Document } from 'mongoose';

export interface IUnit extends Document {
    name: string;
}

const UnitSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true }
}, { timestamps: true });

export default mongoose.model<IUnit>('Unit', UnitSchema);
