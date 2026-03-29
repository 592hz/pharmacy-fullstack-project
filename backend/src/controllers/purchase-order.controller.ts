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

export const getPurchaseOrderById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const order = await PurchaseOrder.findOne({ id } as any);
        if (!order) return res.status(404).json({ message: 'Purchase order not found' });
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
    try {
        const newOrder = new PurchaseOrder(req.body);
        const savedOrder = await newOrder.save();
        
        // Update product stock and batches
        for (const item of savedOrder.items) {
            const product = await Product.findOne({ id: item.code } as any);
            if (product) {
                // Initialize batches if undefined
                if (!product.batches) product.batches = [];
                
                // Find matching batch (batchNumber AND expiryDate should match)
                const existingBatch = product.batches.find(b => 
                    b.batchNumber === item.batchNumber && 
                    b.expiryDate === item.expiryDate
                );
                
                if (existingBatch) {
                    existingBatch.quantity += item.quantity;
                } else {
                    product.batches.push({
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate,
                        quantity: item.quantity
                    });
                }
                
                // Recalculate total quantity
                product.baseQuantity = product.batches.reduce((sum, b) => sum + b.quantity, 0);
                
                await product.save();
            }
        }
        
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const updatedOrder = await PurchaseOrder.findOneAndUpdate({ id } as any, req.body, { new: true });
        if (!updatedOrder) return res.status(404).json({ message: 'Purchase order not found' });
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deletePurchaseOrder = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedOrder = await PurchaseOrder.findOneAndDelete({ id } as any);
        if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
