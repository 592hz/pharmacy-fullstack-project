import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
    title: string;
    content: string;
    date: Date;
    color?: string;
}

const NoteSchema: Schema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    color: { type: String }
}, { timestamps: true });

export default mongoose.model<INote>('Note', NoteSchema);
