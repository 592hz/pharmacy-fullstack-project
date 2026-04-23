import { Request, Response } from 'express';
import PurchaseOrder from '../models/purchase-order.model.js';
import Product from '../models/product.model.js';
import { IPurchaseOrderItem } from '../models/purchase-order.model.js';

const adjustStock = async (items: IPurchaseOrderItem[], multiplier: number) => {
    for (const item of items) {
        const product = await Product.findOne({ id: item.code });
        if (product) {
            if (!product.batches) product.batches = [];

            const existingBatch = product.batches.find(b =>
                b.batchNumber === item.batchNumber &&
                b.expiryDate === item.expiryDate
            );

            if (existingBatch) {
                existingBatch.quantity += (item.quantity * multiplier);
            } else if (multiplier > 0) {
                product.batches.push({
                    batchNumber: item.batchNumber,
                    expiryDate: item.expiryDate,
                    quantity: item.quantity * multiplier
                });
            }

            product.baseQuantity = product.batches.reduce((sum, b) => sum + b.quantity, 0);
            await product.save();
        }
    }
};

export const getPurchaseOrders = async (_req: Request, res: Response) => {
    try {
        const orders = await PurchaseOrder.find({ isDeleted: { $ne: true } }).sort({ importDate: -1 });
        res.status(200).json(orders);
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getDeletedOrders = async (_req: Request, res: Response) => {
    try {
        const orders = await PurchaseOrder.find({ isDeleted: true }).sort({ deletedAt: -1 });
        res.status(200).json(orders);
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getPurchaseOrderById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const order = await PurchaseOrder.findOne({ id, isDeleted: { $ne: true } });
        if (!order) return res.status(404).json({ message: 'Purchase order not found' });
        res.status(200).json(order);
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
    try {
        const newOrder = new PurchaseOrder(req.body);
        const savedOrder = await newOrder.save();
        
        // Update product stock and batches
        await adjustStock(savedOrder.items, 1);
        
        res.status(201).json(savedOrder);
    } catch (error: unknown) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        // 1. Get old order to reverse stock
        const oldOrder = await PurchaseOrder.findOne({ id, isDeleted: { $ne: true } });
        if (!oldOrder) return res.status(404).json({ message: 'Purchase order not found' });

        // 2. Reverse old stock
        await adjustStock(oldOrder.items, -1);

        // 3. Update order
        const updatedOrder = await PurchaseOrder.findOneAndUpdate(
            { id }, 
            req.body, 
            { new: true }
        );
        
        if (!updatedOrder) {
            // Rollback if update fails (though unlikely with findOne first)
            await adjustStock(oldOrder.items, 1);
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        // 4. Apply new stock
        await adjustStock(updatedOrder.items, 1);

        res.status(200).json(updatedOrder);
    } catch (error: unknown) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deletePurchaseOrder = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedOrder = await PurchaseOrder.findOneAndUpdate(
            { id },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
        if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });

        // Reverse stock when moving to trash
        await adjustStock(deletedOrder.items, -1);

        res.status(200).json({ message: 'Order moved to trash' });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const restoreOrder = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const restoredOrder = await PurchaseOrder.findOneAndUpdate(
            { id },
            { isDeleted: false, deletedAt: undefined },
            { new: true }
        );
        if (!restoredOrder) return res.status(404).json({ message: 'Order not found' });

        // Re-apply stock when restoring
        await adjustStock(restoredOrder.items, 1);

        res.status(200).json(restoredOrder);
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const permanentlyDeleteOrder = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedOrder = await PurchaseOrder.findOneAndDelete({ id });
        if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json({ message: 'Order permanently deleted' });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkRestoreOrders = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'IDs array is required' });
        }

        const ordersToRestore = await PurchaseOrder.find({ id: { $in: ids }, isDeleted: true });
        
        for (const order of ordersToRestore) {
            order.isDeleted = false;
            // @ts-ignore
            order.deletedAt = null;
            await order.save();
            // @ts-ignore - adjustStock exists in this file
            await adjustStock(order.items, 1);
        }

        res.status(200).json({ message: `${ordersToRestore.length} orders restored and stock adjusted` });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkPermanentlyDeleteOrders = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'IDs array is required' });
        }

        const result = await PurchaseOrder.deleteMany({ id: { $in: ids } });

        res.status(200).json({ message: `${result.deletedCount} orders permanently deleted` });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const emptyOrderTrash = async (_req: Request, res: Response) => {
    try {
        const result = await PurchaseOrder.deleteMany({ isDeleted: true });
        res.status(200).json({ message: `${result.deletedCount} orders permanently deleted` });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};
