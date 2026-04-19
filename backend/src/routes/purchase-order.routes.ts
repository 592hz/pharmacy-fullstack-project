import { Router } from 'express';
import { 
    getPurchaseOrders, 
    getPurchaseOrderById, 
    createPurchaseOrder, 
    updatePurchaseOrder, 
    deletePurchaseOrder,
    getDeletedOrders,
    restoreOrder,
    permanentlyDeleteOrder,
    bulkRestoreOrders,
    bulkPermanentlyDeleteOrders,
    emptyOrderTrash
} from '../controllers/purchase-order.controller.js';

const router = Router();

router.get('/', getPurchaseOrders);
router.get('/trash', getDeletedOrders);
router.put('/trash/restore-bulk', bulkRestoreOrders);
router.delete('/trash/permanent-bulk', bulkPermanentlyDeleteOrders);
router.delete('/trash/empty', emptyOrderTrash);
router.get('/:id', getPurchaseOrderById);
router.post('/', createPurchaseOrder);
router.put('/:id', updatePurchaseOrder);
router.put('/:id/restore', restoreOrder);
router.delete('/:id', deletePurchaseOrder);
router.delete('/:id/permanent', permanentlyDeleteOrder);

export default router;
