import { Request, Response, RequestHandler } from 'express';
import Product from '../models/product.model.js';
import ProductCategory from '../models/product-category.model.js';
import Supplier from '../models/supplier.model.js';

export const getProducts: RequestHandler = async (req, res) => {
    try {
        const products = await Product.find({ isDeleted: { $ne: true } }).populate('categoryId').populate('supplierId');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getProductById: RequestHandler = async (req, res) => {
    try {
        const id = req.params.id as string;
        const product = await Product.findOne({ id, isDeleted: { $ne: true } } as any).populate('categoryId').populate('supplierId');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createProduct: RequestHandler = async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateProduct: RequestHandler = async (req, res) => {
    try {
        const id = req.params.id as string;
        const updatedProduct = await Product.findOneAndUpdate({ id } as any, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteProduct: RequestHandler = async (req, res) => {
    try {
        const id = req.params.id as string;
        const deletedProduct = await Product.findOneAndUpdate(
            { id } as any,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
        if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ message: 'Product moved to trash' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getDeletedProducts: RequestHandler = async (req, res) => {
    try {
        const products = await Product.find({ isDeleted: true })
            .populate('categoryId')
            .populate('supplierId')
            .sort({ deletedAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const restoreProduct: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOneAndUpdate(
            { id } as any,
            { isDeleted: false, deletedAt: null },
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const permanentlyDeleteProduct: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Product.findOneAndDelete({ id } as any);
        if (!result) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ message: 'Product permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkCreateProducts: RequestHandler = async (req, res) => {
    try {
        const productsRaw = req.body.products as any[];
        if (!Array.isArray(productsRaw)) {
            return res.status(400).json({ message: 'Products should be an array' });
        }

        // 1. Get or Create Default Supplier "Ngọc Mỹ"
        let defaultSupplier = await Supplier.findOne({ name: /Ngọc Mỹ/i });
        if (!defaultSupplier) {
            defaultSupplier = new Supplier({
                code: 'NCC_NGOCMY',
                name: 'Ngọc Mỹ',
                isNational: true,
                isDefaultImport: true
            });
            await defaultSupplier.save();
        }

        const results = {
            success: 0,
            skipped: 0,
            errors: [] as string[]
        };

        for (const prodData of productsRaw) {
            try {
                // Check for duplicates
                const existing = await Product.findOne({ id: prodData.id });
                if (existing) {
                    results.skipped++;
                    continue;
                }

                // Handle Category ID mapping (if only name is provided)
                if (prodData.categoryName && !prodData.categoryId) {
                    const category = await ProductCategory.findOne({ name: new RegExp(prodData.categoryName, 'i') });
                    if (category) {
                        prodData.categoryId = category._id;
                    }
                }

                // Handle Supplier ID mapping/default
                if (prodData.supplierName && !prodData.supplierId) {
                    const supplier = await Supplier.findOne({ name: new RegExp(prodData.supplierName, 'i') });
                    if (supplier) {
                        prodData.supplierId = supplier._id;
                    } else {
                        prodData.supplierId = defaultSupplier._id;
                    }
                } else if (!prodData.supplierId) {
                    prodData.supplierId = defaultSupplier._id;
                }

                // Ensure baseQuantity is set if missing
                if (prodData.baseQuantity === undefined) {
                    prodData.baseQuantity = 0;
                }

                const newProduct = new Product(prodData);
                await newProduct.save();
                results.success++;
            } catch (err) {
                results.errors.push(`Error saving ${prodData.name}: ${(err as Error).message}`);
            }
        }

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
