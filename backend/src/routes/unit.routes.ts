import { Router } from 'express';
import { getUnits, createUnit } from '../controllers/unit.controller.js';

const router = Router();

router.get('/', getUnits);
router.post('/', createUnit);

export default router;
