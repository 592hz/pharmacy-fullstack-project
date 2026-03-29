import { Router } from 'express';
import { getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory } from '../controllers/product-category.controller.js';

const router = Router();

router.get('/', getProductCategories);
router.post('/', createProductCategory);
router.put('/:id', updateProductCategory);
router.delete('/:id', deleteProductCategory);

export default router;
