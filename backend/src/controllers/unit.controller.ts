import { Request, Response } from 'express';
import Unit from '../models/unit.model.js';

export const getUnits = async (req: Request, res: Response) => {
    try {
        const units = await Unit.find();
        res.status(200).json(units);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createUnit = async (req: Request, res: Response) => {
    try {
        const newUnit = new Unit(req.body);
        const savedUnit = await newUnit.save();
        res.status(201).json(savedUnit);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateUnit = async (req: Request, res: Response) => {
    try {
        const updatedUnit = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUnit) return res.status(404).json({ message: 'Unit not found' });
        res.status(200).json(updatedUnit);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteUnit = async (req: Request, res: Response) => {
    try {
        const deletedUnit = await Unit.findByIdAndDelete(req.params.id);
        if (!deletedUnit) return res.status(404).json({ message: 'Unit not found' });
        res.status(200).json({ message: 'Unit deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
