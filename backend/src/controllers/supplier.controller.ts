import { Request, Response } from 'express';
import Supplier from '../models/supplier.model.js';
import Product from '../models/product.model.js';
import PurchaseOrder from '../models/purchase-order.model.js';

export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await Supplier.find();
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const newSupplier = new Supplier(req.body);
        const savedSupplier = await newSupplier.save();
        res.status(201).json(savedSupplier);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const updatedSupplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedSupplier) return res.status(404).json({ message: 'Supplier not found' });
        res.status(200).json(updatedSupplier);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        // Check for linked products
        const linkedProductsCount = await Product.countDocuments({ supplierId: id });
        if (linkedProductsCount > 0) {
            return res.status(400).json({ 
                message: `Không thể xóa nhà cung cấp này vì đang có ${linkedProductsCount} sản phẩm liên kết. Vui lòng chuyển các sản phẩm này sang nhà cung cấp khác trước.` 
            });
        }

        // Check for linked purchase orders
        const linkedOrdersCount = await PurchaseOrder.countDocuments({ supplierId: id });
        if (linkedOrdersCount > 0) {
            return res.status(400).json({ 
                message: `Không thể xóa nhà cung cấp này vì đã có ${linkedOrdersCount} phiếu nhập hàng liên kết. Để bảo toàn lịch sử nhập hàng, bạn nên giữ lại thông tin nhà cung cấp này.` 
            });
        }

        const deletedSupplier = await Supplier.findByIdAndDelete(id);
        if (!deletedSupplier) return res.status(404).json({ message: 'Supplier not found' });
        res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
