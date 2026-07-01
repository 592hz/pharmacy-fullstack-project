import { Request, Response } from 'express';
import Supplier from '../models/supplier.model.js';
import Product from '../models/product.model.js';
import PurchaseOrder from '../models/purchase-order.model.js';

export const getSuppliers = async (_req: Request, res: Response) => {
    try {
        const suppliers = await Supplier.find({ isDeleted: { $ne: true } });
        res.status(200).json(suppliers);
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getDeletedSuppliers = async (_req: Request, res: Response) => {
    try {
        const suppliers = await Supplier.find({ isDeleted: true });
        res.status(200).json(suppliers);
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const newSupplier = new Supplier(req.body);
        const savedSupplier = await newSupplier.save();
        res.status(201).json(savedSupplier);
    } catch (error: unknown) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const updatedSupplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedSupplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
        res.status(200).json(updatedSupplier);
    } catch (error: unknown) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        // 1. Soft delete supplier
        const deletedSupplier = await Supplier.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
        if (!deletedSupplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });

        // 2. Cascade soft delete to Products
        await Product.updateMany(
            { supplierId: id },
            { isDeleted: true, deletedAt: new Date() }
        );

        // 3. Cascade soft delete to PurchaseOrders
        await PurchaseOrder.updateMany(
            { supplierId: id },
            { isDeleted: true, deletedAt: new Date() }
        );

        res.status(200).json({ message: 'Đã chuyển nhà cung cấp và các mặt hàng liên quan vào thùng rác' });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const restoreSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const restoredSupplier = await Supplier.findByIdAndUpdate(
            id,
            { isDeleted: false, deletedAt: undefined },
            { new: true }
        );
        if (!restoredSupplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
        res.status(200).json(restoredSupplier);
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const permanentlyDeleteSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedSupplier = await Supplier.findByIdAndDelete(id);
        if (!deletedSupplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
        res.status(200).json({ message: 'Đã xóa vĩnh viễn nhà cung cấp' });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkRestoreSuppliers = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Danh sách ID là bắt buộc' });
        }

        const result = await Supplier.updateMany(
            { _id: { $in: ids } },
            { isDeleted: false, deletedAt: null }
        );

        res.status(200).json({ message: `Đã khôi phục ${result.modifiedCount} nhà cung cấp` });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkPermanentlyDeleteSuppliers = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Danh sách ID là bắt buộc' });
        }

        const result = await Supplier.deleteMany({ _id: { $in: ids } });

        res.status(200).json({ message: `Đã xóa vĩnh viễn ${result.deletedCount} nhà cung cấp` });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const emptySupplierTrash = async (_req: Request, res: Response) => {
    try {
        const result = await Supplier.deleteMany({ isDeleted: true });
        res.status(200).json({ message: `Đã xóa vĩnh viễn ${result.deletedCount} nhà cung cấp` });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};
