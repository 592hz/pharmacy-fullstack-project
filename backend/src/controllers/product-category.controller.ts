import { Request, Response } from 'express';
import ProductCategory from '../models/product-category.model.js';
import Product from '../models/product.model.js';

export const getProductCategories = async (req: Request, res: Response) => {
    try {
        const categories = await ProductCategory.find().sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createProductCategory = async (req: Request, res: Response) => {
    try {
        const { name, notes, code } = req.body;

        // Auto-generate code if not provided
        let finalCode = code;
        if (!finalCode) {
            const lastCategory = await ProductCategory.findOne().sort({ createdAt: -1 });
            let nextNumber = 1;
            if (lastCategory && lastCategory.code && lastCategory.code.startsWith('NSP')) {
                const lastNumber = parseInt(lastCategory.code.replace('NSP', ''));
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
            finalCode = `NSP${nextNumber.toString().padStart(3, '0')}`;
        }

        const newCategory = new ProductCategory({
            code: finalCode,
            name,
            notes
        });
        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateProductCategory = async (req: Request, res: Response) => {
    try {
        const updatedCategory = await ProductCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedCategory) return res.status(404).json({ message: 'Product category not found' });
        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteProductCategory = async (req: Request, res: Response) => {
    try {
        const { id: categoryId } = req.params;

        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required' });
        }

        // Check if there are products in this category
        const productCount = await Product.countDocuments({ categoryId } as any);
        if (productCount > 0) {
            return res.status(400).json({ 
                message: 'Không thể xóa nhóm sản phẩm vì đang có sản phẩm thuộc nhóm này. Vui lòng chuyển hoặc xóa các sản phẩm trước khi xóa nhóm.' 
            });
        }

        const deletedCategory = await ProductCategory.findByIdAndDelete(categoryId);
        if (!deletedCategory) return res.status(404).json({ message: 'Product category not found' });
        res.status(200).json({ message: 'Product category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
