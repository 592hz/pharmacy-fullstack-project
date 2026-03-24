import { Request, Response } from 'express';
import Product from '../models/product.model.js';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await Product.find().populate('categoryId').populate('supplierId');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const product = await Product.findOne({ id }).populate('categoryId').populate('supplierId');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const updatedProduct = await Product.findOneAndUpdate({ id }, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedProduct = await Product.findOneAndDelete({ id });
        if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
