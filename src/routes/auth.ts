import { Router } from 'express';
import { userLogin, adminLogin } from '../controllers/auth.js';

const router = Router();

router.post('/login', userLogin);
router.post('/admin-login', adminLogin);

export default router;
