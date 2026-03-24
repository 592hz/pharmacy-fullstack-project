import { Router } from 'express';
import { getExportSlips, createExportSlip, deleteExportSlip } from '../controllers/export-slip.controller.js';

const router = Router();

router.get('/', getExportSlips);
router.post('/', createExportSlip);
router.delete('/:id', deleteExportSlip);

export default router;
