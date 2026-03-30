import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkCreateProducts } from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/bulk', bulkCreateProducts);

export default router;
