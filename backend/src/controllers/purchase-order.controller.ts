import { Request, Response } from 'express';
import PurchaseOrder from '../models/purchase-order.model.js';
import Product from '../models/product.model.js';
import { IPurchaseOrderItem } from '../models/purchase-order.model.js';
import Category from '../models/category.model.js';

// Helper to save product with version conflict retry mechanism
const saveProductWithRetry = async (id: string, updateFn: (product: any) => void, retries = 5): Promise<any> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const product = await Product.findOne({ id });
        if (!product) return null;
        try {
            updateFn(product);
            product.baseQuantity = (product.batches || []).reduce((sum: number, b: any) => sum + b.quantity, 0);
            product.markModified('batches');
            return await product.save();
        } catch (error: any) {
            if (error.name === 'VersionError' && attempt < retries) {
                console.warn(`[Mongoose] Version conflict for product ${id}. Retrying... (Attempt ${attempt}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
            } else {
                throw error;
            }
        }
    }
};

const adjustStock = async (items: IPurchaseOrderItem[], multiplier: number) => {
    // Group items by product code
    const itemsByProduct: { [code: string]: IPurchaseOrderItem[] } = {};
    for (const item of items) {
        if (!itemsByProduct[item.code]) {
            itemsByProduct[item.code] = [];
        }
        itemsByProduct[item.code]!.push(item);
    }

    for (const [code, productItems] of Object.entries(itemsByProduct)) {
        await saveProductWithRetry(code, (product) => {
            if (!product.batches) product.batches = [];

            for (const item of productItems) {
                const batchNum = item.batchNumber || 'N/A';
                const expDate = item.expiryDate || 'N/A';

                const existingBatch = product.batches!.find((b: any) =>
                    b.batchNumber === batchNum &&
                    b.expiryDate === expDate
                );

                if (existingBatch) {
                    existingBatch.quantity += (item.quantity * multiplier);
                } else if (multiplier > 0) {
                    product.batches!.push({
                        batchNumber: batchNum,
                        expiryDate: expDate,
                        quantity: item.quantity * multiplier
                    });
                }
            }
        });
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
        if (!order) return res.status(404).json({ message: 'Không tìm thấy phiếu nhập hàng' });
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
        
        // Auto create expense category entry
        try {
            const expenseCategory = new Category({
                name: `Chi tiền nhập hàng: ${savedOrder.supplierName}`,
                notes: `Mã đơn nhập: ${savedOrder.id}. Người tạo: ${savedOrder.createdBy || 'Hệ thống'}`,
                type: 'Chi',
                amount: savedOrder.grandTotal || savedOrder.totalAmount || 0,
                date: savedOrder.importDate || new Date(),
                purchaseOrderId: savedOrder.id
            });
            await expenseCategory.save();
        } catch (catErr) {
            console.error('Failed to create automatic expense category entry:', catErr);
        }
        
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
        if (!oldOrder) return res.status(404).json({ message: 'Không tìm thấy phiếu nhập hàng' });

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
            return res.status(404).json({ message: 'Không tìm thấy phiếu nhập hàng' });
        }

        // 4. Apply new stock
        await adjustStock(updatedOrder.items, 1);

        // Update corresponding expense category entry
        try {
            await Category.findOneAndUpdate(
                { purchaseOrderId: id },
                {
                    name: `Chi tiền nhập hàng: ${updatedOrder.supplierName}`,
                    notes: `Mã đơn nhập: ${updatedOrder.id}. Người tạo: ${updatedOrder.createdBy || 'Hệ thống'}`,
                    type: 'Chi',
                    amount: updatedOrder.grandTotal || updatedOrder.totalAmount || 0,
                    date: updatedOrder.importDate || new Date()
                },
                { upsert: true, new: true }
            );
        } catch (catErr) {
            console.error('Failed to update expense category entry:', catErr);
        }

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
        if (!deletedOrder) return res.status(404).json({ message: 'Không tìm thấy phiếu' });

        // Reverse stock when moving to trash
        await adjustStock(deletedOrder.items, -1);

        // Delete corresponding expense category entry (as the order is moved to trash)
        try {
            await Category.findOneAndDelete({ purchaseOrderId: id });
        } catch (catErr) {
            console.error('Failed to delete expense category entry on trash:', catErr);
        }

        res.status(200).json({ message: 'Đã chuyển phiếu nhập hàng vào thùng rác' });
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
        if (!restoredOrder) return res.status(404).json({ message: 'Không tìm thấy phiếu' });

        // Re-apply stock when restoring
        await adjustStock(restoredOrder.items, 1);

        // Re-create corresponding expense category entry on restore
        try {
            const expenseCategory = new Category({
                name: `Chi tiền nhập hàng: ${restoredOrder.supplierName}`,
                notes: `Mã đơn nhập: ${restoredOrder.id}. Người tạo: ${restoredOrder.createdBy || 'Hệ thống'}`,
                type: 'Chi',
                amount: restoredOrder.grandTotal || restoredOrder.totalAmount || 0,
                date: restoredOrder.importDate || new Date(),
                purchaseOrderId: restoredOrder.id
            });
            await expenseCategory.save();
        } catch (catErr) {
            console.error('Failed to recreate expense category entry on restore:', catErr);
        }

        res.status(200).json(restoredOrder);
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const permanentlyDeleteOrder = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedOrder = await PurchaseOrder.findOneAndDelete({ id });
        if (!deletedOrder) return res.status(404).json({ message: 'Không tìm thấy phiếu' });

        // Delete corresponding expense category entry
        try {
            await Category.findOneAndDelete({ purchaseOrderId: id });
        } catch (catErr) {
            console.error('Failed to delete expense category entry on permanent delete:', catErr);
        }

        res.status(200).json({ message: 'Đã xóa vĩnh viễn phiếu nhập hàng' });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkDeletePurchaseOrders = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Danh sách ID là bắt buộc' });
        }

        const ordersToDelete = await PurchaseOrder.find({ id: { $in: ids }, isDeleted: { $ne: true } });
        
        for (const order of ordersToDelete) {
            order.isDeleted = true;
            order.deletedAt = new Date();
            await order.save();
            // @ts-ignore - adjustStock exists in this file
            await adjustStock(order.items, -1);

            // Delete corresponding expense category
            try {
                await Category.findOneAndDelete({ purchaseOrderId: order.id });
            } catch (catErr) {
                console.error(`Failed to delete category for bulk-deleted order ${order.id}:`, catErr);
            }
        }

        res.status(200).json({ message: `Đã chuyển ${ordersToDelete.length} phiếu nhập hàng vào thùng rác` });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkRestoreOrders = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Danh sách ID là bắt buộc' });
        }

        const ordersToRestore = await PurchaseOrder.find({ id: { $in: ids }, isDeleted: true });
        
        for (const order of ordersToRestore) {
            order.isDeleted = false;
            // @ts-ignore
            order.deletedAt = null;
            await order.save();
            // @ts-ignore - adjustStock exists in this file
            await adjustStock(order.items, 1);

            // Re-create expense category
            try {
                const expenseCategory = new Category({
                    name: `Chi tiền nhập hàng: ${order.supplierName}`,
                    notes: `Mã đơn nhập: ${order.id}. Người tạo: ${order.createdBy || 'Hệ thống'}`,
                    type: 'Chi',
                    amount: order.grandTotal || order.totalAmount || 0,
                    date: order.importDate || new Date(),
                    purchaseOrderId: order.id
                });
                await expenseCategory.save();
            } catch (catErr) {
                console.error(`Failed to recreate category for bulk-restored order ${order.id}:`, catErr);
            }
        }

        res.status(200).json({ message: `Đã khôi phục ${ordersToRestore.length} phiếu nhập hàng và cập nhật tồn kho` });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkPermanentlyDeleteOrders = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Danh sách ID là bắt buộc' });
        }

        const result = await PurchaseOrder.deleteMany({ id: { $in: ids } });
        
        try {
            await Category.deleteMany({ purchaseOrderId: { $in: ids } });
        } catch (catErr) {
            console.error('Failed to delete categories for bulk permanently deleted orders:', catErr);
        }

        res.status(200).json({ message: `Đã xóa vĩnh viễn ${result.deletedCount} phiếu nhập hàng` });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const emptyOrderTrash = async (_req: Request, res: Response) => {
    try {
        const deletedOrders = await PurchaseOrder.find({ isDeleted: true });
        const deletedIds = deletedOrders.map(o => o.id);

        const result = await PurchaseOrder.deleteMany({ isDeleted: true });

        try {
            await Category.deleteMany({ purchaseOrderId: { $in: deletedIds } });
        } catch (catErr) {
            console.error('Failed to empty category trash:', catErr);
        }

        res.status(200).json({ message: `Đã xóa vĩnh viễn ${result.deletedCount} phiếu nhập hàng` });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};
