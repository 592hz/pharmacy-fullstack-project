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
