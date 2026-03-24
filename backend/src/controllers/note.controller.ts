import { Request, Response } from 'express';
import Note from '../models/note.model.js';

export const getNotes = async (req: Request, res: Response) => {
    try {
        const notes = await Note.find().sort({ date: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createNote = async (req: Request, res: Response) => {
    try {
        const newNote = new Note(req.body);
        const savedNote = await newNote.save();
        res.status(201).json(savedNote);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteNote = async (req: Request, res: Response) => {
    try {
        const deletedNote = await Note.findByIdAndDelete(req.params.id);
        if (!deletedNote) return res.status(404).json({ message: 'Note not found' });
        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
