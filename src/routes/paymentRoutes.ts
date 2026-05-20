import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { subscribe, cancelSubscription } from '../controllers/paymentController.js';

const router = Router();

router.post('/subscribe', authMiddleware, subscribe);
router.post('/cancel', authMiddleware, cancelSubscription);

export default router;
