import { Request, Response } from 'express';
import PaymentMethod from '../models/payment-method.model.js';
import ExportSlip from '../models/export-slip.model.js';
import PurchaseOrder from '../models/purchase-order.model.js';

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

export const updatePaymentMethod = async (req: Request, res: Response) => {
    try {
        const updatedMethod = await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMethod) return res.status(404).json({ message: 'Payment method not found' });
        res.status(200).json(updatedMethod);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deletePaymentMethod = async (req: Request, res: Response) => {
    try {
        const methodId = req.params.id;
        
        // Find the method first to get its name
        const method = await PaymentMethod.findById(methodId);
        if (!method) return res.status(404).json({ message: 'Payment method not found' });

        // Check in ExportSlips
        const exportCount = await ExportSlip.countDocuments({ paymentMethod: method.name } as any);
        if (exportCount > 0) {
            return res.status(400).json({ 
                message: `Không thể xóa phương thức thanh toán này vì đang có ${exportCount} phiếu bán hàng sử dụng phương thức này.` 
            });
        }

        // Check in PurchaseOrders
        const purchaseCount = await PurchaseOrder.countDocuments({ paymentMethod: method.name } as any);
        if (purchaseCount > 0) {
            return res.status(400).json({ 
                message: `Không thể xóa phương thức thanh toán này vì đang có ${purchaseCount} phiếu nhập hàng sử dụng phương thức này.` 
            });
        }

        await PaymentMethod.findByIdAndDelete(methodId);
        res.status(200).json({ message: 'Payment method deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
