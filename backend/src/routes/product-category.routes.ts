import { Router } from 'express';
import { 
    getProductCategories, 
    createProductCategory, 
    updateProductCategory, 
    deleteProductCategory,
    getDeletedProductCategories,
    restoreProductCategory,
    permanentlyDeleteProductCategory
} from '../controllers/product-category.controller.js';

const router = Router();

router.get('/', getProductCategories);
router.get('/trash', getDeletedProductCategories);
router.post('/', createProductCategory);
router.put('/:id', updateProductCategory);
router.put('/:id/restore', restoreProductCategory);
router.delete('/:id', deleteProductCategory);
router.delete('/:id/permanent', permanentlyDeleteProductCategory);

export default router;
