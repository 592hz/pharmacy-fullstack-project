import { Router } from 'express';
import { getExportSlips, getExportSlipById, createExportSlip, updateExportSlip, deleteExportSlip } from '../controllers/export-slip.controller.js';

const router = Router();

router.get('/', getExportSlips);
router.get('/:id', getExportSlipById);
router.post('/', createExportSlip);
router.put('/:id', updateExportSlip);
router.delete('/:id', deleteExportSlip);

export default router;
