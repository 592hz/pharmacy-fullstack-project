import { Request, Response } from 'express';
import ProductCategory from '../models/product-category.model.js';
import Product from '../models/product.model.js';

export const getProductCategories = async (req: Request, res: Response) => {
    try {
        const categories = await ProductCategory.find({ isDeleted: { $ne: true } }).sort({ name: 1 });
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

        // Soft delete the category
        const deletedCategory = await ProductCategory.findByIdAndUpdate(
            categoryId, 
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!deletedCategory) return res.status(404).json({ message: 'Product category not found' });

        // Cascading soft delete for all products in this category
        await Product.updateMany(
            { categoryId },
            { isDeleted: true, deletedAt: new Date() }
        );

        res.status(200).json({ message: 'Product category and its products moved to trash' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getDeletedProductCategories = async (req: Request, res: Response) => {
    try {
        const categories = await ProductCategory.find({ isDeleted: true }).sort({ deletedAt: -1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const restoreProductCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const restoredCategory = await ProductCategory.findByIdAndUpdate(
            id,
            { isDeleted: false, deletedAt: null },
            { new: true }
        );

        if (!restoredCategory) return res.status(404).json({ message: 'Category not found' });

        // Restore all products in this category that were deleted
        await Product.updateMany(
            { categoryId: id as string, isDeleted: true },
            { isDeleted: false, deletedAt: null }
        );

        res.status(200).json(restoredCategory);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const permanentlyDeleteProductCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Check if there are products still in this category (even if deleted)
        // If we want to hard delete the category, we must hard delete or reassign products first.
        // User said "khi xóa danh mục các sản phẩm thuộc danh mục đó được xóa hết", 
        // so permanent delete of category should probably also permanent delete products.
        
        await Product.deleteMany({ categoryId: id as string });
        const deletedCategory = await ProductCategory.findByIdAndDelete(id);

        if (!deletedCategory) return res.status(404).json({ message: 'Category not found' });
        
        res.status(200).json({ message: 'Category and its products permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkRestoreProductCategories = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'IDs array is required' });
        }

        const restoredCategories = await ProductCategory.updateMany(
            { _id: { $in: ids } },
            { isDeleted: false, deletedAt: null }
        );

        // Also restore products in these categories
        await Product.updateMany(
            { categoryId: { $in: ids }, isDeleted: true },
            { isDeleted: false, deletedAt: null }
        );

        res.status(200).json({ message: `${restoredCategories.modifiedCount} categories restored` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkPermanentlyDeleteProductCategories = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'IDs array is required' });
        }

        // Permanently delete products in these categories first
        await Product.deleteMany({ categoryId: { $in: ids } });
        
        const deletedCategories = await ProductCategory.deleteMany({ _id: { $in: ids } });

        res.status(200).json({ message: `${deletedCategories.deletedCount} categories and their products permanently deleted` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const emptyProductCategoryTrash = async (_req: Request, res: Response) => {
    try {
        // Find all deleted categories first to delete their products
        const deletedCategories = await ProductCategory.find({ isDeleted: true }, '_id');
        const categoryIds = deletedCategories.map(c => c._id.toString());

        await Product.deleteMany({ categoryId: { $in: categoryIds } });
        const result = await ProductCategory.deleteMany({ isDeleted: true });

        res.status(200).json({ message: `${result.deletedCount} categories and their products permanently deleted` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
