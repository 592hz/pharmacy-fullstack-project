import { Request, Response } from 'express';
import DoseTemplate from '../models/dose-template.model.js';

export const getTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await DoseTemplate.find().populate('components.product').sort({ createdAt: -1 });
        res.status(200).json(templates);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createTemplate = async (req: Request, res: Response) => {
    try {
        const { name, price, components } = req.body;
        const newTemplate = new DoseTemplate({ name, price, components });
        const savedTemplate = await newTemplate.save();
        
        // Populate before returning so frontend has product details
        await savedTemplate.populate('components.product');
        
        res.status(201).json(savedTemplate);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await DoseTemplate.findByIdAndDelete(id);
        res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
