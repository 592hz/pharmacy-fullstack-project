import { Request, Response } from 'express';
import PurchaseOrder from '../models/purchase-order.model.js';
import Product from '../models/product.model.js';

export const getPurchaseOrders = async (req: Request, res: Response) => {
    try {
        const orders = await PurchaseOrder.find().sort({ importDate: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
    try {
        const newOrder = new PurchaseOrder(req.body);
        const savedOrder = await newOrder.save();
        
        // Optional: Update product stock/batches logic here
        
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deletePurchaseOrder = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedOrder = await PurchaseOrder.findOneAndDelete({ id });
        if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
