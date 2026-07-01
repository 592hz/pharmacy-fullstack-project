import { Router } from 'express';
import { getRevenueReport } from '../controllers/report.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = Router();

// Get revenue report with custom date ranges and monthly comparison
router.get('/revenue', protect, admin, getRevenueReport);

export default router;
