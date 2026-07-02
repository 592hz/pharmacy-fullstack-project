import { Request, Response } from 'express';
import DoseTemplate from '../models/dose-template.model.js';
import Product from '../models/product.model.js';

export const getTemplates = async (req: Request, res: Response) => {
    try {
        let templates = await DoseTemplate.find().populate('components.product').sort({ createdAt: -1 });
        
        let anyTemplateHealed = false;
        // Self-healing: if some old templates are missing backup fields but the product exists, update them in background.
        for (const tpl of templates) {
            let needsUpdate = false;
            for (let idx = 0; idx < tpl.components.length; idx++) {
                const c = tpl.components[idx];
                if (!c) continue;

                const rawProductRef = tpl.populated(`components.${idx}.product`) || (c.product ? (c.product._id || c.product) : null);

                // Case 1: Product exists and populated successfully, but backup fields are missing
                if (c.product && (!c.productName || !c.productCode)) {
                    c.productName = c.product.name;
                    c.productCode = c.product.id;
                    needsUpdate = true;
                }

                // Case 2: Product populated as null (possibly soft-deleted), but we can find it directly in DB
                if (!c.product && rawProductRef && (!c.productName || !c.productCode)) {
                    const dbProduct = await Product.findById(rawProductRef);
                    if (dbProduct) {
                        c.productName = dbProduct.name;
                        c.productCode = dbProduct.id;
                        needsUpdate = true;
                    }
                }

                // Case 3: Product reference is null, but we have productCode and an active product with that code exists in the database
                if (!c.product && c.productCode) {
                    const activeProduct = await Product.findOne({ id: c.productCode, isDeleted: { $ne: true } });
                    if (activeProduct) {
                        c.product = activeProduct._id;
                        needsUpdate = true;
                        anyTemplateHealed = true;
                    }
                }
            }
            if (needsUpdate) {
                const updatedComponents = tpl.components.map((c, idx) => {
                    const rawId = tpl.populated(`components.${idx}.product`) || (c.product ? (c.product._id || c.product) : null);
                    return {
                        product: rawId,
                        productName: c.productName,
                        productCode: c.productCode,
                        quantity: c.quantity
                    };
                });
                await DoseTemplate.updateOne(
                    { _id: tpl._id },
                    { $set: { components: updatedComponents } }
                );
            }
        }

        if (anyTemplateHealed) {
            templates = await DoseTemplate.find().populate('components.product').sort({ createdAt: -1 });
        }

        res.status(200).json(templates);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createTemplate = async (req: Request, res: Response) => {
    try {
        const { name, price, components } = req.body;
        
        // Fetch products to set backups
        const enrichedComponents = [];
        for (const c of components) {
            const product = await Product.findById(c.product);
            enrichedComponents.push({
                product: c.product,
                productName: product ? product.name : "",
                productCode: product ? product.id : "",
                quantity: c.quantity
            });
        }

        const newTemplate = new DoseTemplate({ name, price, components: enrichedComponents });
        const savedTemplate = await newTemplate.save();
        
        await savedTemplate.populate('components.product');
        res.status(201).json(savedTemplate);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await DoseTemplate.findByIdAndDelete(id);
        res.status(200).json({ message: 'Xóa liều mẫu thành công' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
