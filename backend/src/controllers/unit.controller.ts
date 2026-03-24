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
