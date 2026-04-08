import { Request, Response } from 'express';
import ExportSlip from '../models/export-slip.model.js';
import Product from '../models/product.model.js';

export const getExportSlips = async (req: Request, res: Response) => {
    try {
        const slips = await ExportSlip.find().sort({ exportDate: -1 });
        res.status(200).json(slips);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getExportSlipById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const slip = await ExportSlip.findOne({ id } as any);
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
        for (const item of savedSlip.items) {
            const product = await Product.findOne({ id: item.code } as any);
            if (product && product.batches && product.batches.length > 0) {
                let remainingToSubtract = Number(item.quantity) || 0;
                console.log(`[ExportSlip] Reducing stock for Product: ${product.id} (${product.name}), Quantity: ${remainingToSubtract}`);

                // 1. Try exact batch match first
                const exactBatch = product.batches.find(b => 
                    b.batchNumber === item.batchNumber && 
                    b.expiryDate === item.expiryDate
                );

                if (exactBatch && exactBatch.quantity > 0) {
                    const subtractAmount = Math.min(exactBatch.quantity, remainingToSubtract);
                    exactBatch.quantity -= subtractAmount;
                    remainingToSubtract -= subtractAmount;
                    console.log(`  - Subtracted ${subtractAmount} from EXACT batch ${exactBatch.batchNumber}`);
                }

                // 2. Greedy approach if still remaining or if no exact match found
                if (remainingToSubtract > 0) {
                    // Sort batches by expiry date (earliest first - FEFO)
                    product.batches.sort((a, b) => {
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

                    for (const batch of product.batches) {
                        if (remainingToSubtract <= 0) break;
                        if (batch.quantity <= 0) continue;

                        const subtractAmount = Math.min(batch.quantity, remainingToSubtract);
                        batch.quantity -= subtractAmount;
                        remainingToSubtract -= subtractAmount;
                        console.log(`  - Subtracted ${subtractAmount} from batch ${batch.batchNumber} (Greedy)`);
                    }
                }

                if (remainingToSubtract > 0) {
                    console.warn(`[ExportSlip] Warning: Product ${product.id} still has ${remainingToSubtract} to subtract but no more batches with stock!`);
                    // Optionally: could even go to Negative stock if your business rules allow, 
                    // or just leave it at 0. Here we'll just log it.
                }
                
                // Recalculate total quantity
                product.baseQuantity = product.batches.reduce((sum, b) => sum + b.quantity, 0);
                
                // CRITICAL: Mark batches as modified so Mongoose detects changes in subdocuments
                product.markModified('batches');
                await product.save();
                console.log(`[ExportSlip] Updated Product: ${product.id}, New baseQuantity: ${product.baseQuantity}`);
            } else {
                console.warn(`[ExportSlip] Product not found or has no batches: ${item.code}`);
            }
        }
        
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

export const deleteExportSlip = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedSlip = await ExportSlip.findOneAndDelete({ id } as any);
        if (!deletedSlip) return res.status(404).json({ message: 'Export slip not found' });
        res.status(200).json({ message: 'Export slip deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
