import { Request, Response } from 'express';
import Category from '../models/category.model.js';

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Category.find().sort({ date: -1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const newCategory = new Category(req.body);
        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
