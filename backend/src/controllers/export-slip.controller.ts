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
        if (!slip) return res.status(404).json({ message: 'Không tìm thấy hóa đơn xuất kho' });
        res.status(200).json(slip);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createExportSlip = async (req: Request, res: Response) => {
    try {
        let slipData = { ...req.body };
        let savedSlip: any = null;
        let retries = 5;

        const generateId = () => {
            const now = new Date();
            const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
            const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
            const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
            return `PX${datePart}${timePart}${randomPart}`;
        };

        while (retries > 0) {
            try {
                if (!slipData.id) {
                    slipData.id = generateId();
                }
                const newSlip = new ExportSlip(slipData);
                savedSlip = await newSlip.save();
                break;
            } catch (err: any) {
                if ((err.code === 11000 || err.message?.includes('duplicate')) && retries > 1) {
                    console.warn(`[ExportSlip] Duplicate ID ${slipData.id}. Regenerating ID and retrying... (${retries - 1} retries left)`);
                    slipData.id = generateId();
                    retries--;
                } else {
                    throw err;
                }
            }
        }

        console.log(`[ExportSlip] Created slip ${savedSlip.id} with ${savedSlip.items.length} items. Updating stock...`);

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
        if (!updatedSlip) return res.status(404).json({ message: 'Không tìm thấy hóa đơn xuất kho' });
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
        if (!deletedSlip) return res.status(404).json({ message: 'Không tìm thấy hóa đơn xuất kho' });

        // Restore stock when moving to trash
        await restoreExportStock(deletedSlip.items);

        res.status(200).json({ message: 'Đã chuyển hóa đơn xuất kho vào thùng rác' });
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
        if (!restoredSlip) return res.status(404).json({ message: 'Không tìm thấy hóa đơn xuất kho' });

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
        if (!deletedSlip) return res.status(404).json({ message: 'Không tìm thấy hóa đơn xuất kho' });
        res.status(200).json({ message: 'Đã xóa vĩnh viễn hóa đơn xuất kho' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Bulk soft delete (move to trash)
export const bulkDeleteExportSlips = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Danh sách ID là bắt buộc' });
        }

        const slipsToDelete = await ExportSlip.find({ id: { $in: ids }, isDeleted: { $ne: true } });
        for (const slip of slipsToDelete) {
            slip.isDeleted = true;
            slip.deletedAt = new Date();
            await slip.save();
            await restoreExportStock(slip.items);
        }

        res.status(200).json({ message: `Đã chuyển ${slipsToDelete.length} hóa đơn xuất kho vào thùng rác` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Bulk restore
export const bulkRestoreExportSlips = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Danh sách ID là bắt buộc' });
        }

        const slipsToRestore = await ExportSlip.find({ id: { $in: ids }, isDeleted: true });
        for (const slip of slipsToRestore) {
            slip.isDeleted = false;
            // @ts-ignore
            slip.deletedAt = null;
            await slip.save();
            await reduceExportStock(slip.items);
        }

        res.status(200).json({ message: `Đã khôi phục ${slipsToRestore.length} hóa đơn xuất kho` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Bulk permanent delete
export const bulkPermanentlyDeleteExportSlips = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Danh sách ID là bắt buộc' });
        }

        const result = await ExportSlip.deleteMany({ id: { $in: ids } });
        res.status(200).json({ message: `Đã xóa vĩnh viễn ${result.deletedCount} hóa đơn xuất kho` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Empty trash
export const emptyExportSlipTrash = async (_req: Request, res: Response) => {
    try {
        const result = await ExportSlip.deleteMany({ isDeleted: true });
        res.status(200).json({ message: `Đã xóa vĩnh viễn ${result.deletedCount} hóa đơn xuất kho khỏi thùng rác` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
