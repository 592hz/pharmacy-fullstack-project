import { Router } from 'express';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../controllers/unit.controller.js';

const router = Router();

router.get('/', getUnits);
router.post('/', createUnit);
router.put('/:id', updateUnit);
router.delete('/:id', deleteUnit);

export default router;
