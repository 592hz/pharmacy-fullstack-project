import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { applyDnsFix } from '../utils/dns-fix.js';
import User from '../models/user.model.js';
import Category from '../models/category.model.js';
import Unit from '../models/unit.model.js';
import PaymentMethod from '../models/payment-method.model.js';

dotenv.config();
applyDnsFix();

const seedData = async () => {
    try {
        await connectDB();

        // 1. Clear existing data (Optional, but good for a fresh start)
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({});
        await Category.deleteMany({});
        await Unit.deleteMany({});
        await PaymentMethod.deleteMany({});

        // 2. Seed Admin User
        console.log('👤 Seeding Admin User...');
        const adminUser = await User.create({
            username: 'admin',
            name: 'Hệ thống Admin',
            email: 'admin@pharmacy.com',
            password: 'admin123', // Will be hashed by pre-save hook
            role: 'admin'
        });
        console.log(`✅ Admin user created: ${adminUser.username}`);

        // 3. Seed Units
        console.log('📦 Seeding Units...');
        const units = [
            { name: 'Hộp' },
            { name: 'Viên' },
            { name: 'Chai' },
            { name: 'Vỉ' },
            { name: 'Tuýp' },
            { name: 'Gói' }
        ];
        await Unit.insertMany(units);
        console.log('✅ Units seeded');

        // 4. Seed Categories
        console.log('📂 Seeding Categories...');
        const categories = [
            { name: 'Thuốc kê đơn', type: 'Thu', amount: 0 },
            { name: 'Thuốc không kê đơn', type: 'Thu', amount: 0 },
            { name: 'Thực phẩm chức năng', type: 'Thu', amount: 0 },
            { name: 'Thiết bị y tế', type: 'Thu', amount: 0 },
            { name: 'Dược mỹ phẩm', type: 'Thu', amount: 0 }
        ];
        await Category.insertMany(categories);
        console.log('✅ Categories seeded');

        // 5. Seed Payment Methods
        console.log('💳 Seeding Payment Methods...');
        const paymentMethods = [
            { name: 'Tiền mặt', isDefault: true },
            { name: 'Chuyển khoản', isDefault: false },
            { name: 'Thẻ tín dụng', isDefault: false }
        ];
        await PaymentMethod.insertMany(paymentMethods);
        console.log('✅ Payment Methods seeded');

        console.log('\n🚀 --- SEEDING COMPLETED SUCCESSFULLY --- 🚀');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
};

seedData();
