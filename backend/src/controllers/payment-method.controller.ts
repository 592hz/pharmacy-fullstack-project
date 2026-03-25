import { Request, Response } from 'express';
import PaymentMethod from '../models/payment-method.model.js';

export const getPaymentMethods = async (req: Request, res: Response) => {
    try {
        const methods = await PaymentMethod.find();
        res.status(200).json(methods);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createPaymentMethod = async (req: Request, res: Response) => {
    try {
        const newMethod = new PaymentMethod(req.body);
        const savedMethod = await newMethod.save();
        res.status(201).json(savedMethod);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
    try {
        const updatedMethod = await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMethod) return res.status(404).json({ message: 'Payment method not found' });
        res.status(200).json(updatedMethod);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deletePaymentMethod = async (req: Request, res: Response) => {
    try {
        const deletedMethod = await PaymentMethod.findByIdAndDelete(req.params.id);
        if (!deletedMethod) return res.status(404).json({ message: 'Payment method not found' });
        res.status(200).json({ message: 'Payment method deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
