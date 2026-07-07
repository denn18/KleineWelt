import { Router } from 'express';
import { forgotPasswordController, loginController, resetPasswordController } from '../controllers/authController.js';

const router = Router();

router.post('/login', loginController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

export default router;
