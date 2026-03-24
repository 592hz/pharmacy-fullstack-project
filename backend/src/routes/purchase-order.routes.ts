import { Router } from 'express';
import { getPurchaseOrders, createPurchaseOrder, deletePurchaseOrder } from '../controllers/purchase-order.controller.js';

const router = Router();

router.get('/', getPurchaseOrders);
router.post('/', createPurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

export default router;
