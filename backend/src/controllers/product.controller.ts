import { Request, Response, RequestHandler } from 'express';
import fs from 'fs';
import Product from '../models/product.model.js';
import ProductCategory from '../models/product-category.model.js';
import Supplier from '../models/supplier.model.js';
import PurchaseOrder from '../models/purchase-order.model.js';
import ExportSlip from '../models/export-slip.model.js';
import DoseTemplate from '../models/dose-template.model.js';


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
        const product = await Product.findOne({ id }).populate('categoryId').populate('supplierId');
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
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
        const updatedProduct = await Product.findOneAndUpdate({ id }, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteProduct: RequestHandler = async (req, res) => {
    try {
        const id = req.params.id as string;
        const deletedProduct = await Product.findOneAndUpdate(
            { id },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
        if (!deletedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(200).json({ message: 'Đã chuyển sản phẩm vào thùng rác' });
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
            { id: id as string },
            { isDeleted: false, deletedAt: null },
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const permanentlyDeleteProduct: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Product.findOneAndDelete({ id: id as string });
        if (!result) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(200).json({ message: 'Đã xóa vĩnh viễn sản phẩm' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkCreateProducts: RequestHandler = async (req, res) => {
    try {
        const productsRaw = req.body.products as Record<string, unknown>[];
        if (!Array.isArray(productsRaw)) {
            return res.status(400).json({ message: 'Danh sách sản phẩm phải là một mảng' });
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
                // Handle existing products by updating their info, stock, and restoring them if deleted
                const prodId = prodData.id as string;
                const existing = await Product.findOne({ id: prodId });

                // Extract and map category
                const categoryName = prodData.categoryName as string;
                if (categoryName && !prodData.categoryId) {
                    const category = await ProductCategory.findOne({ name: new RegExp(categoryName, 'i') });
                    if (category) {
                        prodData.categoryId = category._id;
                    }
                }

                // Extract and map supplier
                const supplierName = prodData.supplierName as string;
                if (supplierName && !prodData.supplierId) {
                    const supplier = await Supplier.findOne({ name: new RegExp(supplierName, 'i') });
                    if (supplier) {
                        prodData.supplierId = supplier._id;
                    } else {
                        prodData.supplierId = defaultSupplier._id;
                    }
                } else if (!prodData.supplierId) {
                    prodData.supplierId = defaultSupplier._id;
                }

                const newQty = Number(prodData.baseQuantity) || 0;

                if (existing) {
                    existing.isDeleted = false;
                    (existing as any).deletedAt = undefined;
                    existing.name = prodData.name as string || existing.name;
                    existing.unit = prodData.unit as string || existing.unit;
                    existing.importPrice = Number(prodData.importPrice) || existing.importPrice;
                    existing.retailPrice = Number(prodData.retailPrice) || existing.retailPrice;
                    existing.wholesalePrice = Number(prodData.wholesalePrice) || existing.wholesalePrice;
                    if (prodData.registrationNo !== undefined) {
                        existing.registrationNo = prodData.registrationNo as string;
                    }
                    if (prodData.manufacturer !== undefined) {
                        existing.manufacturer = prodData.manufacturer as string;
                    }
                    if (prodData.categoryId) existing.categoryId = prodData.categoryId as any;
                    if (prodData.supplierId) existing.supplierId = prodData.supplierId as any;

                    existing.baseQuantity = newQty;

                    const currentBatches = existing.batches || [];
                    if (currentBatches.length === 0) {
                        existing.batches = [{
                            batchNumber: "MẶC-ĐỊNH",
                            expiryDate: "31/12/2029",
                            quantity: newQty
                        }] as any;
                    } else {
                        currentBatches[0]!.quantity = newQty;
                        for (let j = 1; j < currentBatches.length; j++) {
                            currentBatches[j]!.quantity = 0;
                        }
                        existing.batches = currentBatches;
                    }

                    await existing.save();
                    results.success++;
                    continue;
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

export const bulkRestoreProducts = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Danh sách ID là bắt buộc' });
        }

        const result = await Product.updateMany(
            { id: { $in: ids } },
            { isDeleted: false, deletedAt: null }
        );

        res.status(200).json({ message: `Đã khôi phục ${result.modifiedCount} sản phẩm` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const bulkPermanentlyDeleteProducts = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Danh sách ID là bắt buộc' });
        }

        const result = await Product.deleteMany({ id: { $in: ids } });

        res.status(200).json({ message: `Đã xóa vĩnh viễn ${result.deletedCount} sản phẩm` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const emptyProductTrash = async (_req: Request, res: Response) => {
    try {
        const result = await Product.deleteMany({ isDeleted: true });
        res.status(200).json({ message: `Đã xóa vĩnh viễn ${result.deletedCount} sản phẩm` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteAllProducts: RequestHandler = async (req, res) => {
    try {
        const result = await Product.updateMany(
            { isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        );
        res.status(200).json({ message: `Đã chuyển ${result.modifiedCount} sản phẩm vào thùng rác` });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const reconstructProductsFromHistory: RequestHandler = async (req, res) => {
    try {
        const activeProducts = await Product.find({ isDeleted: { $ne: true } });
        const activeProductIds = new Set(activeProducts.map(p => p.id));
        const activeProductMongoIds = new Set(activeProducts.map(p => p._id.toString()));

        const deletedProducts = await Product.find({ isDeleted: true });
        const deletedProductsMap = new Map(deletedProducts.map(p => [p.id, p]));

        // Scan Dose Templates for missing components to build mapping of productCode -> original Mongo _id
        const templates = await DoseTemplate.find().populate('components.product');
        const templateCodeToMongoIdMap = new Map<string, string>();
        const missingTemplateProducts = new Map<string, { productName: string; productCode: string }>();

        for (const tpl of templates) {
            let templateModified = false;
            for (let i = 0; i < tpl.components.length; i++) {
                const c = tpl.components[i];
                if (!c) continue;
                // Access raw ObjectId even if populated field is null
                const rawObjectId = tpl.populated(`components.${i}.product`) || (c.product ? (c.product._id || c.product) : null);

                if (rawObjectId) {
                    const rawIdStr = rawObjectId.toString();
                    if (!activeProductMongoIds.has(rawIdStr)) {
                        // Check if there is an active product with the same custom code (productCode)
                        if (c.productCode) {
                            const activeProductWithSameCode = activeProducts.find(p => p.id === c.productCode);
                            if (activeProductWithSameCode) {
                                // Heal the reference in the template
                                c.product = activeProductWithSameCode._id;
                                templateModified = true;
                                continue;
                            }
                        }

                        const code = c.productCode || `SP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                        const name = c.productName || "Sản phẩm khôi phục";
                        missingTemplateProducts.set(rawIdStr, {
                            productName: name,
                            productCode: code
                        });
                        templateCodeToMongoIdMap.set(code, rawIdStr);
                    }
                }
            }
            if (templateModified) {
                const updatedComponents = tpl.components.map((comp, idx) => {
                    const rId = tpl.populated(`components.${idx}.product`) || (comp.product ? (comp.product._id || comp.product) : null);
                    return {
                        product: rId,
                        productName: comp.productName,
                        productCode: comp.productCode,
                        quantity: comp.quantity
                    };
                });
                await DoseTemplate.updateOne(
                    { _id: tpl._id },
                    { $set: { components: updatedComponents } }
                );
            }
        }

        const purchaseOrders = await PurchaseOrder.find({ isDeleted: { $ne: true } });
        const exportSlips = await ExportSlip.find({ isDeleted: { $ne: true } });

        const missingProductsInfo: {
            [id: string]: {
                mongoId?: string | undefined;
                name: string;
                unit: string;
                importPrice: number;
                retailPrice: number;
                wholesalePrice: number;
                registrationNo?: string | undefined;
                manufacturer?: string | undefined;
                categoryId?: any;
                supplierId?: any;
                batches: { [batchKey: string]: { batchNumber: string; expiryDate: string; quantity: number } }
            }
        } = {};

        let defaultCategory = await ProductCategory.findOne({ name: /Mặc định/i });
        if (!defaultCategory) {
            defaultCategory = await ProductCategory.findOne({});
        }
        let defaultSupplier = await Supplier.findOne({ name: /Ngọc Mỹ/i });
        if (!defaultSupplier) {
            defaultSupplier = await Supplier.findOne({});
        }

        // Process Purchase Orders
        for (const order of purchaseOrders) {
            if (!order.items) continue;
            for (const item of order.items) {
                const prodId = item.code || item.id;
                // Process all products from transaction history
                if (!prodId || prodId === "LIÊU") continue;

                let info = missingProductsInfo[prodId];
                if (!info) {
                    const matchedMongoId = templateCodeToMongoIdMap.get(prodId);
                    info = {
                        mongoId: matchedMongoId,
                        name: item.name,
                        unit: item.unit,
                        importPrice: item.importPrice || 0,
                        retailPrice: item.retailPrice || 0,
                        wholesalePrice: item.retailPrice || 0,
                        registrationNo: item.registrationNumber || "",
                        manufacturer: "",
                        categoryId: defaultCategory?._id,
                        supplierId: order.supplierId || defaultSupplier?._id,
                        batches: {}
                    };
                    missingProductsInfo[prodId] = info;
                }

                const batchNum = item.batchNumber || "N/A";
                const expDate = item.expiryDate || "N/A";
                const batchKey = `${batchNum}_${expDate}`;

                if (!info.batches[batchKey]) {
                    info.batches[batchKey] = {
                        batchNumber: batchNum,
                        expiryDate: expDate,
                        quantity: 0
                    };
                }
                const b = info.batches[batchKey];
                if (b) {
                    b.quantity += (Number(item.quantity) || 0);
                }
            }
        }

        // Process Export Slips
        for (const slip of exportSlips) {
            if (!slip.items) continue;
            for (const item of slip.items) {
                const prodId = item.code || item.id;
                // Process all products from transaction history
                if (!prodId || prodId === "LIÊU") continue;

                let cleanName = item.name;
                if (cleanName.startsWith("[Trong liều] ")) {
                    cleanName = cleanName.replace("[Trong liều] ", "");
                }

                let info = missingProductsInfo[prodId];
                if (!info) {
                    const matchedMongoId = templateCodeToMongoIdMap.get(prodId);
                    info = {
                        mongoId: matchedMongoId,
                        name: cleanName,
                        unit: item.unit,
                        importPrice: item.importPrice || 0,
                        retailPrice: item.retailPrice || 0,
                        wholesalePrice: item.retailPrice || 0,
                        registrationNo: "",
                        manufacturer: "",
                        categoryId: defaultCategory?._id,
                        supplierId: defaultSupplier?._id,
                        batches: {}
                    };
                    missingProductsInfo[prodId] = info;
                }

                const batchNum = item.batchNumber || "N/A";
                const expDate = item.expiryDate || "N/A";
                const batchKey = `${batchNum}_${expDate}`;

                if (!info.batches[batchKey]) {
                    info.batches[batchKey] = {
                        batchNumber: batchNum,
                        expiryDate: expDate,
                        quantity: 0
                    };
                }
                const b = info.batches[batchKey];
                if (b) {
                    b.quantity -= (Number(item.quantity) || 0);
                }
            }
        }

        // Add any template components that are missing from DB and NOT found in transaction history
        for (const [mongoId, info] of missingTemplateProducts.entries()) {
            const alreadyAdded = Object.values(missingProductsInfo).some(mpi => mpi && mpi.mongoId === mongoId);
            if (!alreadyAdded) {
                const prodId = info.productCode;
                missingProductsInfo[prodId] = {
                    mongoId: mongoId,
                    name: info.productName,
                    unit: "Viên",
                    importPrice: 0,
                    retailPrice: 0,
                    wholesalePrice: 0,
                    registrationNo: "",
                    manufacturer: "",
                    categoryId: defaultCategory?._id,
                    supplierId: defaultSupplier?._id,
                    batches: {}
                };
            }
        }

        let count = 0;
        for (const [prodId, info] of Object.entries(missingProductsInfo)) {
            const batchesList = Object.values(info.batches).map(b => ({
                batchNumber: b.batchNumber,
                expiryDate: b.expiryDate,
                quantity: Math.max(0, b.quantity)
            }));

            const baseQuantity = batchesList.reduce((sum, b) => sum + b.quantity, 0);

            // Find if the product already exists in the database by either custom code or MongoDB ObjectId
            let existingProduct = await Product.findOne({ id: prodId });
            if (!existingProduct && info.mongoId) {
                existingProduct = await Product.findById(info.mongoId);
            }

            if (existingProduct) {
                // Restore and update existing product (handles soft-deleted and reference mapping)
                const wasDeleted = existingProduct.isDeleted;
                existingProduct.isDeleted = false;
                (existingProduct as any).deletedAt = undefined;

                if (wasDeleted || !existingProduct.name) {
                    existingProduct.name = info.name;
                }
                if (wasDeleted || !existingProduct.unit) {
                    existingProduct.unit = info.unit;
                }

                // Only update prices if they are provided (not zero)
                if (info.importPrice > 0) existingProduct.importPrice = info.importPrice;
                if (info.retailPrice > 0) existingProduct.retailPrice = info.retailPrice;
                if (info.wholesalePrice > 0) existingProduct.wholesalePrice = info.wholesalePrice;

                // Merge batches: preserve existing stock and add/merge computed batches from history
                const currentBatches = existingProduct.batches || [];
                const mergedBatches = [...currentBatches];

                for (const computedBatch of batchesList) {
                    const existingBatchIndex = mergedBatches.findIndex(
                        b => b.batchNumber === computedBatch.batchNumber &&
                            b.expiryDate === computedBatch.expiryDate
                    );

                    if (existingBatchIndex >= 0) {
                        const existingBatch = mergedBatches[existingBatchIndex];
                        if (existingBatch) {
                            // If the existing batch has 0 quantity, update it with history quantity
                            if (existingBatch.quantity === 0 && computedBatch.quantity > 0) {
                                existingBatch.quantity = computedBatch.quantity;
                            }
                        }
                    } else {
                        // If it doesn't exist, add it
                        mergedBatches.push(computedBatch as any);
                    }
                }

                existingProduct.batches = mergedBatches as any;
                existingProduct.baseQuantity = mergedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);

                await existingProduct.save();
            } else {
                // Create a new product
                const productData: any = {
                    id: prodId,
                    name: info.name,
                    unit: info.unit,
                    importPrice: info.importPrice,
                    retailPrice: info.retailPrice,
                    wholesalePrice: info.wholesalePrice,
                    registrationNo: info.registrationNo,
                    manufacturer: info.manufacturer,
                    categoryId: info.categoryId,
                    supplierId: info.supplierId,
                    baseQuantity: baseQuantity,
                    batches: batchesList,
                    isDeleted: false
                };

                if (info.mongoId) {
                    productData._id = info.mongoId;
                }

                const newProduct = new Product(productData);
                await newProduct.save();
            }
            count++;
        }

        res.status(200).json({ message: `Đã khôi phục thành công ${count} sản phẩm từ lịch sử giao dịch và liều mẫu.`, count });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};




