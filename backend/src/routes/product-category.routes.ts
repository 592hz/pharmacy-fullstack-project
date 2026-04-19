import { Router } from 'express';
import { 
    getProductCategories, 
    createProductCategory, 
    updateProductCategory, 
    deleteProductCategory,
    getDeletedProductCategories,
    restoreProductCategory,
    permanentlyDeleteProductCategory,
    bulkRestoreProductCategories,
    bulkPermanentlyDeleteProductCategories,
    emptyProductCategoryTrash
} from '../controllers/product-category.controller.js';

const router = Router();

router.get('/', getProductCategories);
router.get('/trash', getDeletedProductCategories);
router.put('/trash/restore-bulk', bulkRestoreProductCategories);
router.delete('/trash/permanent-bulk', bulkPermanentlyDeleteProductCategories);
router.delete('/trash/empty', emptyProductCategoryTrash);
router.post('/', createProductCategory);
router.put('/:id', updateProductCategory);
router.put('/:id/restore', restoreProductCategory);
router.delete('/:id', deleteProductCategory);
router.delete('/:id/permanent', permanentlyDeleteProductCategory);

export default router;
