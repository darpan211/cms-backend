import { Router } from 'express';
import { authMiddleware, superadminMiddleware } from '../middlewares/auth.js';
import {
  generateUploadUrl,
  createSeries,
  getAllSeries,
  getSeriesById,
  updateSeries,
  deleteSeries,
} from '../controllers/series.js';

const router = Router();

// Public routes
router.get('/', getAllSeries);
router.get('/:id', getSeriesById);

// Superadmin routes
router.post('/generate-upload-url', authMiddleware, superadminMiddleware, generateUploadUrl);
router.post('/', authMiddleware, superadminMiddleware, createSeries);
router.patch('/:id', authMiddleware, superadminMiddleware, updateSeries);
router.delete('/:id', authMiddleware, superadminMiddleware, deleteSeries);

export default router;
