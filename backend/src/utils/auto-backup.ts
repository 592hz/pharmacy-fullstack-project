import fs from 'fs';
import path from 'path';
import User from '../models/user.model.js';
import Category from '../models/category.model.js';
import Unit from '../models/unit.model.js';
import PaymentMethod from '../models/payment-method.model.js';
import Product from '../models/product.model.js';
import ProductCategory from '../models/product-category.model.js';
import Supplier from '../models/supplier.model.js';
import Customer from '../models/customer.model.js';
import PurchaseOrder from '../models/purchase-order.model.js';
import ExportSlip from '../models/export-slip.model.js';
import Note from '../models/note.model.js';
import DoseTemplate from '../models/dose-template.model.js';

export const runAutoBackup = async () => {
    try {
        console.log('🛡️  [AutoBackup] Đang tiến hành tự động sao lưu dữ liệu...');
        
        const [
            users,
            categories,
            units,
            paymentMethods,
            products,
            productCategories,
            suppliers,
            customers,
            purchaseOrders,
            exportSlips,
            notes,
            doseTemplates
        ] = await Promise.all([
            User.find({}).select('+password'),
            Category.find({}),
            Unit.find({}),
            PaymentMethod.find({}),
            Product.find({}),
            ProductCategory.find({}),
            Supplier.find({}),
            Customer.find({}),
            PurchaseOrder.find({}),
            ExportSlip.find({}),
            Note.find({}),
            DoseTemplate.find({})
        ]);

        const backupData = {
            version: '1.0',
            type: 'auto',
            timestamp: new Date().toISOString(),
            data: {
                users,
                categories,
                units,
                paymentMethods,
                products,
                productCategories,
                suppliers,
                customers,
                purchaseOrders,
                exportSlips,
                notes,
                doseTemplates
            }
        };

        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const dateStr = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
        const filename = `autobackup_${dateStr}.json`;
        const filePath = path.join(backupDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
        console.log(`🛡️  [AutoBackup] Đã tạo bản sao lưu tự động thành công: backups/${filename}`);

        // Cleanup: Keep only the 10 most recent auto backups to save disk space
        const files = fs.readdirSync(backupDir);
        const autoBackups = files
            .filter(f => f.startsWith('autobackup_') && f.endsWith('.json'))
            .map(f => ({
                name: f,
                path: path.join(backupDir, f),
                stat: fs.statSync(path.join(backupDir, f))
            }))
            .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()); // Sort descending by modification time

        const maxAutoBackups = 10;
        if (autoBackups.length > maxAutoBackups) {
            const filesToDelete = autoBackups.slice(maxAutoBackups);
            for (const file of filesToDelete) {
                fs.unlinkSync(file.path);
                console.log(`🧹 [AutoBackup] Đã dọn dẹp bản sao lưu tự động cũ: ${file.name}`);
            }
        }
    } catch (error) {
        console.error('⚠️  [AutoBackup] Lỗi trong quá trình tự động sao lưu:', error);
    }
};
