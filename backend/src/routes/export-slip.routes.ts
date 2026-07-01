import { Router } from 'express';
import { 
    getExportSlips, 
    getExportSlipById, 
    createExportSlip, 
    updateExportSlip, 
    deleteExportSlip,
    getDeletedExportSlips,
    restoreExportSlip,
    permanentlyDeleteExportSlip,
    bulkDeleteExportSlips,
    bulkRestoreExportSlips,
    bulkPermanentlyDeleteExportSlips,
    emptyExportSlipTrash
} from '../controllers/export-slip.controller.js';

const router = Router();

router.get('/', getExportSlips);
router.get('/trash', getDeletedExportSlips);
router.put('/trash/delete-bulk', bulkDeleteExportSlips);
router.put('/trash/restore-bulk', bulkRestoreExportSlips);
router.delete('/trash/permanent-bulk', bulkPermanentlyDeleteExportSlips);
router.delete('/trash/empty', emptyExportSlipTrash);
router.get('/:id', getExportSlipById);
router.post('/', createExportSlip);
router.put('/:id', updateExportSlip);
router.put('/:id/restore', restoreExportSlip);
router.delete('/:id', deleteExportSlip);
router.delete('/:id/permanent', permanentlyDeleteExportSlip);

export default router;
