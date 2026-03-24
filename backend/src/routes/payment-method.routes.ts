import { Router } from 'express';
import { getPaymentMethods, createPaymentMethod } from '../controllers/payment-method.controller.js';

const router = Router();

router.get('/', getPaymentMethods);
router.post('/', createPaymentMethod);

export default router;
