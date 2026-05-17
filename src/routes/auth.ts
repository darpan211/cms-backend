import { Router } from 'express';
import { userLogin, adminLogin, createSuperadmin } from '../controllers/auth.js';
// import { authMiddleware, adminMiddleware } from '../middlewares/auth.js';

const router = Router();

router.post('/login', userLogin);
router.post('/admin-login', adminLogin);
router.post('/create-superadmin', createSuperadmin);

export default router;
