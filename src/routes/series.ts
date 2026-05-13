import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.js';
import {
  generateUploadUrl,
  createSeries,
  getSeriesById,
  updateSeries,
  deleteSeries,
} from '../controllers/series.js';

const router = Router();

// Public routes
router.get('/:id', getSeriesById);

// Admin routes
router.post('/generate-upload-url', authMiddleware, adminMiddleware, generateUploadUrl);
router.post('/', authMiddleware, adminMiddleware, createSeries);
router.patch('/:id', authMiddleware, adminMiddleware, updateSeries);
router.delete('/:id', authMiddleware, adminMiddleware, deleteSeries);

export default router;
