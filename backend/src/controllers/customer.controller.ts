import { Request, Response } from 'express';
import Customer from '../models/customer.model.js';
import ExportSlip from '../models/export-slip.model.js';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await Customer.find();
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const newCustomer = new Customer(req.body);
        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const updatedCustomer = await Customer.findOneAndUpdate({ id }, req.body, { new: true });
        if (!updatedCustomer) return res.status(404).json({ message: 'Customer not found' });
        res.status(200).json(updatedCustomer);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        // Check if customer has export slips
        const exportSlipsCount = await ExportSlip.countDocuments({ customerId: id } as any);
        if (exportSlipsCount > 0) {
            return res.status(400).json({ 
                message: `Không thể xóa khách hàng này vì đang có ${exportSlipsCount} phiếu bán hàng liên kết. Vui lòng giữ lại thông tin khách hàng để bảo toàn lịch sử bán hàng.` 
            });
        }

        const deletedCustomer = await Customer.findOneAndDelete({ id } as any);
        if (!deletedCustomer) return res.status(404).json({ message: 'Customer not found' });
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
