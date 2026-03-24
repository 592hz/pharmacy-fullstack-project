import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import connectDB from './config/db.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import customerRoutes from './routes/customer.routes.js';
import purchaseOrderRoutes from './routes/purchase-order.routes.js';
import exportSlipRoutes from './routes/export-slip.routes.js';
import unitRoutes from './routes/unit.routes.js';
import paymentMethodRoutes from './routes/payment-method.routes.js';
import noteRoutes from './routes/note.routes.js';
import productCategoryRoutes from './routes/product-category.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import authRoutes from './routes/auth.routes.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/export-slips', exportSlipRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Pharmacy API is running...');
});

// Connect to Database
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
