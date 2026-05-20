import { Router } from 'express';
import { authMiddleware, superadminMiddleware } from '../middlewares/auth.js';
import {
  getCategories,
  getCategoriesHome,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.js';

const router = Router();

// Public routes — /home must come BEFORE /:id so it isn't matched as an id.
router.get('/', getCategories);
router.get('/home', getCategoriesHome);
router.get('/:id', getCategoryById);

// Superadmin routes
router.post('/', authMiddleware, superadminMiddleware, createCategory);
router.patch('/:id', authMiddleware, superadminMiddleware, updateCategory);
router.delete('/:id', authMiddleware, superadminMiddleware, deleteCategory);

export default router;
