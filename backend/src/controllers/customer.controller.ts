import { Request, Response } from 'express';
import Customer from '../models/customer.model.js';
import ExportSlip from '../models/export-slip.model.js';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const { trash } = req.query;
        const filter = trash === 'true' ? { isDeleted: true } : { isDeleted: { $ne: true } };
        const customers = await Customer.find(filter).sort({ updatedAt: -1 });
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const newCustomer = new Customer(req.body);
        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const updatedCustomer = await Customer.findOneAndUpdate({ id }, req.body, { new: true });
        if (!updatedCustomer) return res.status(404).json({ message: 'Customer not found' });
        res.status(200).json(updatedCustomer);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        // Perform soft delete
        const deletedCustomer = await Customer.findOneAndUpdate(
            { id } as any, 
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!deletedCustomer) return res.status(404).json({ message: 'Customer not found' });
        res.status(200).json({ message: 'Customer moved to trash successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
