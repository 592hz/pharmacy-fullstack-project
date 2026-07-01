import { Router } from 'express';
import { 
    getSuppliers, 
    createSupplier, 
    updateSupplier, 
    deleteSupplier,
    getDeletedSuppliers,
    restoreSupplier,
    permanentlyDeleteSupplier,
    bulkRestoreSuppliers,
    bulkPermanentlyDeleteSuppliers,
    emptySupplierTrash
} from '../controllers/supplier.controller.js';

const router = Router();

router.get('/', getSuppliers);
router.get('/trash', getDeletedSuppliers);
router.put('/trash/restore-bulk', bulkRestoreSuppliers);
router.delete('/trash/permanent-bulk', bulkPermanentlyDeleteSuppliers);
router.delete('/trash/empty', emptySupplierTrash);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.put('/:id/restore', restoreSupplier);
router.delete('/:id', deleteSupplier);
router.delete('/:id/permanent', permanentlyDeleteSupplier);

export default router;
