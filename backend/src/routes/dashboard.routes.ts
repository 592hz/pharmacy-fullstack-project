import express from 'express';
import { getSummary } from '../controllers/dashboard.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/summary', protect, admin, getSummary);

export default router;
