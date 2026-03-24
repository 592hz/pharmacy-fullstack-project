import { Request, Response } from 'express';
import Supplier from '../models/supplier.model.js';

export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await Supplier.find();
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const newSupplier = new Supplier(req.body);
        const savedSupplier = await newSupplier.save();
        res.status(201).json(savedSupplier);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const updatedSupplier = await Supplier.findOneAndUpdate({ id }, req.body, { new: true });
        if (!updatedSupplier) return res.status(404).json({ message: 'Supplier not found' });
        res.status(200).json(updatedSupplier);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedSupplier = await Supplier.findOneAndDelete({ id });
        if (!deletedSupplier) return res.status(404).json({ message: 'Supplier not found' });
        res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
