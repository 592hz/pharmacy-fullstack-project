import { Request, Response } from 'express';
import ExportSlip from '../models/export-slip.model.js';
import Product from '../models/product.model.js';

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

// Helper to restore stock when export slip is deleted
const restoreExportStock = async (items: any[]) => {
    const itemsByProduct: { [code: string]: any[] } = {};
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
                    existingBatch.quantity += (Number(item.quantity) || 0);
                } else {
                    product.batches!.push({
                        batchNumber: batchNum,
                        expiryDate: expDate,
                        quantity: Number(item.quantity) || 0
                    });
                }
            }
        });
    }
};

// Helper to reduce stock when export slip is restored
const reduceExportStock = async (items: any[]) => {
    const itemsByProduct: { [code: string]: any[] } = {};
    for (const item of items) {
        if (!itemsByProduct[item.code]) {
            itemsByProduct[item.code] = [];
        }
        itemsByProduct[item.code]!.push(item);
    }

    for (const [code, productItems] of Object.entries(itemsByProduct)) {
        await saveProductWithRetry(code, (product) => {
            if (!product.batches || product.batches.length === 0) return;

            for (const item of productItems) {
                let remainingToSubtract = Number(item.quantity) || 0;
                const batchNum = item.batchNumber || 'N/A';
                const expDate = item.expiryDate || 'N/A';

                // 1. Try exact batch match first
                const exactBatch = product.batches!.find((b: any) => 
                    b.batchNumber === batchNum && 
                    b.expiryDate === expDate
                );

                if (exactBatch && exactBatch.quantity > 0) {
                    const subtractAmount = Math.min(exactBatch.quantity, remainingToSubtract);
                    exactBatch.quantity -= subtractAmount;
                    remainingToSubtract -= subtractAmount;
                }

                // 2. Greedy approach if still remaining
                if (remainingToSubtract > 0) {
                    product.batches!.sort((a: any, b: any) => {
                        const parseDate = (d: string | undefined) => {
                            if (!d) return Infinity;
                            const parts = d.split(/[-/]/);
                            if (parts.length === 3) {
                                return new Date(parseInt(parts[2] || "0", 10), parseInt(parts[1] || "1", 10) - 1, parseInt(parts[0] || "1", 10)).getTime();
                            }
                            return Infinity;
                        };
                        return parseDate(a.expiryDate) - parseDate(b.expiryDate);
                    });

                    for (const batch of product.batches!) {
                        if (remainingToSubtract <= 0) break;
                        if (batch.quantity <= 0) continue;

                        const subtractAmount = Math.min(batch.quantity, remainingToSubtract);
                        batch.quantity -= subtractAmount;
                        remainingToSubtract -= subtractAmount;
                    }
                }
            }
        });
    }
};

export const getExportSlips = async (req: Request, res: Response) => {
    try {
        const slips = await ExportSlip.find({ isDeleted: { $ne: true } }).sort({ exportDate: -1 });
        res.status(200).json(slips);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getDeletedExportSlips = async (_req: Request, res: Response) => {
    try {
        const slips = await ExportSlip.find({ isDeleted: true }).sort({ deletedAt: -1 });
        res.status(200).json(slips);
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getExportSlipById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const slip = await ExportSlip.findOne({ id, isDeleted: { $ne: true } } as any);
        if (!slip) return res.status(404).json({ message: 'Export slip not found' });
        res.status(200).json(slip);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createExportSlip = async (req: Request, res: Response) => {
    try {
        const newSlip = new ExportSlip(req.body);
        const savedSlip = await newSlip.save();
        
        console.log(`[ExportSlip] Created slip with ${savedSlip.items.length} items. Updating stock...`);

        // Update product stock and batches (reduction)
        await reduceExportStock(savedSlip.items);
        
        res.status(201).json(savedSlip);
    } catch (error) {
        console.error(`[ExportSlip] Error in createExportSlip:`, error);
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateExportSlip = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const updatedSlip = await ExportSlip.findOneAndUpdate({ id } as any, req.body, { new: true });
        if (!updatedSlip) return res.status(404).json({ message: 'Export slip not found' });
        res.status(200).json(updatedSlip);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

// Soft delete / Move to trash
export const deleteExportSlip = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedSlip = await ExportSlip.findOneAndUpdate(
            { id } as any,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
        if (!deletedSlip) return res.status(404).json({ message: 'Export slip not found' });

        // Restore stock when moving to trash
        await restoreExportStock(deletedSlip.items);

        res.status(200).json({ message: 'Export slip moved to trash' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Restore export slip from trash
export const restoreExportSlip = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const restoredSlip = await ExportSlip.findOneAndUpdate(
            { id } as any,
            { isDeleted: false, deletedAt: undefined },
            { new: true }
        );
        if (!restoredSlip) return res.status(404).json({ message: 'Export slip not found' });

        // Re-reduce stock when restored
        await reduceExportStock(restoredSlip.items);

        res.status(200).json(restoredSlip);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Permanently delete export slip
export const permanentlyDeleteExportSlip = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedSlip = await ExportSlip.findOneAndDelete({ id } as any);
        if (!deletedSlip) return res.status(404).json({ message: 'Export slip not found' });
        res.status(200).json({ message: 'Export slip permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Bulk soft delete (move to trash)
export const bulkDeleteExportSlips = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'IDs array is required' });
        }

        const slipsToDelete = await ExportSlip.find({ id: { $in: ids }, isDeleted: { $ne: true } });
        for (const slip of slipsToDelete) {
            slip.isDeleted = true;
            slip.deletedAt = new Date();
            await slip.save();
            await restoreExportStock(slip.items);
        }

        res.status(200).json({ message: `${slipsToDelete.length} export slips moved to trash` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Bulk restore
export const bulkRestoreExportSlips = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'IDs array is required' });
        }

        const slipsToRestore = await ExportSlip.find({ id: { $in: ids }, isDeleted: true });
        for (const slip of slipsToRestore) {
            slip.isDeleted = false;
            // @ts-ignore
            slip.deletedAt = null;
            await slip.save();
            await reduceExportStock(slip.items);
        }

        res.status(200).json({ message: `${slipsToRestore.length} export slips restored` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Bulk permanent delete
export const bulkPermanentlyDeleteExportSlips = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'IDs array is required' });
        }

        const result = await ExportSlip.deleteMany({ id: { $in: ids } });
        res.status(200).json({ message: `${result.deletedCount} export slips permanently deleted` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Empty trash
export const emptyExportSlipTrash = async (_req: Request, res: Response) => {
    try {
        const result = await ExportSlip.deleteMany({ isDeleted: true });
        res.status(200).json({ message: `${result.deletedCount} export slips permanently deleted from trash` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
