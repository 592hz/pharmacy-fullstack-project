import { Request, Response } from 'express';
import ExportSlip from '../models/export-slip.model.js';

export const getExportSlips = async (req: Request, res: Response) => {
    try {
        const slips = await ExportSlip.find().sort({ exportDate: -1 });
        res.status(200).json(slips);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createExportSlip = async (req: Request, res: Response) => {
    try {
        const newSlip = new ExportSlip(req.body);
        const savedSlip = await newSlip.save();
        res.status(201).json(savedSlip);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteExportSlip = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedSlip = await ExportSlip.findOneAndDelete({ id });
        if (!deletedSlip) return res.status(404).json({ message: 'Export slip not found' });
        res.status(200).json({ message: 'Export slip deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
