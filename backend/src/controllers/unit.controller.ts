import { Request, Response } from 'express';
import Unit from '../models/unit.model.js';
import Product from '../models/product.model.js';

export const getUnits = async (req: Request, res: Response) => {
    try {
        const units = await Unit.find().sort({ name: 1 });
        res.status(200).json(units);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createUnit = async (req: Request, res: Response) => {
    try {
        const newUnit = new Unit(req.body);
        const savedUnit = await newUnit.save();
        res.status(201).json(savedUnit);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateUnit = async (req: Request, res: Response) => {
    try {
        const updatedUnit = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUnit) return res.status(404).json({ message: 'Unit not found' });
        res.status(200).json(updatedUnit);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteUnit = async (req: Request, res: Response) => {
    try {
        const unitId = req.params.id;
        
        // Find the unit first to get its name
        const unit = await Unit.findById(unitId);
        if (!unit) return res.status(404).json({ message: 'Unit not found' });

        // Check if there are products using this unit (either as main unit or base unit)
        const productCount = await Product.countDocuments({ 
            $or: [
                { unit: unit.name },
                { baseUnitName: unit.name }
            ]
        });

        if (productCount > 0) {
            return res.status(400).json({ 
                message: 'Không thể xóa đơn vị tính vì đang có sản phẩm sử dụng đơn vị này. Vui lòng cập nhật sản phẩm trước khi xóa đơn vị.' 
            });
        }

        await Unit.findByIdAndDelete(unitId);
        res.status(200).json({ message: 'Unit deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
