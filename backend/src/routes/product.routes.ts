import { Router } from 'express';
import { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    bulkCreateProducts,
    getDeletedProducts,
    restoreProduct,
    permanentlyDeleteProduct,
    bulkRestoreProducts,
    bulkPermanentlyDeleteProducts,
    emptyProductTrash,
    deleteAllProducts,
    reconstructProductsFromHistory
} from '../controllers/product.controller.js';

const router = Router();

router.get('/', getProducts);
router.get('/trash', getDeletedProducts);
router.put('/trash/restore-bulk', bulkRestoreProducts);
router.delete('/trash/permanent-bulk', bulkPermanentlyDeleteProducts);
router.delete('/trash/empty', emptyProductTrash);
router.delete('/all', deleteAllProducts);
router.post('/reconstruct-from-history', reconstructProductsFromHistory);
router.get('/:id', getProductById);

router.post('/', createProduct);
router.post('/bulk', bulkCreateProducts);
router.put('/:id', updateProduct);
router.put('/:id/restore', restoreProduct);
router.delete('/:id', deleteProduct);
router.delete('/:id/permanent', permanentlyDeleteProduct);

export default router;
