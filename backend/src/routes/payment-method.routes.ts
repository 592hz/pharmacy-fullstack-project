import { Router } from 'express';
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '../controllers/payment-method.controller.js';

const router = Router();

router.get('/', getPaymentMethods);
router.post('/', createPaymentMethod);
router.put('/:id', updatePaymentMethod);
router.delete('/:id', deletePaymentMethod);

export default router;
