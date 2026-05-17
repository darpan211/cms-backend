import { Router } from 'express';
import { authMiddleware, superadminMiddleware } from '../middlewares/auth.js';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.js';

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Superadmin routes
router.post('/', authMiddleware, superadminMiddleware, createCategory);
router.patch('/:id', authMiddleware, superadminMiddleware, updateCategory);
router.delete('/:id', authMiddleware, superadminMiddleware, deleteCategory);

export default router;
