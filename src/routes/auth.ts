import { Router } from 'express';
import {
  userRegister,
  userLogin,
  superadminRegister,
  superadminLogin,
} from '../controllers/auth.js';

const router = Router();

// Normal user
router.post('/register', userRegister);
router.post('/login', userLogin);

// Superadmin
router.post('/superadmin/register', superadminRegister);
router.post('/superadmin/login', superadminLogin);

export default router;
