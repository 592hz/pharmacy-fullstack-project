import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
    title: string;
    content: string;
    date: Date;
    color?: string;
    isPinned: boolean;
}

const NoteSchema: Schema = new Schema({
    title: { type: String, required: [true, 'Tiêu đề ghi chú không được để trống'] },
    content: { type: String, required: [true, 'Nội dung ghi chú không được để trống'] },
    date: { type: Date, default: Date.now },
    color: { type: String },
    isPinned: { type: Boolean, default: false }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

NoteSchema.virtual('id').get(function() {
    return (this as any)._id.toHexString();
});

export default mongoose.model<INote>('Note', NoteSchema);
