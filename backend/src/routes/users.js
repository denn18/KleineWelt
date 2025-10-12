import { Router } from 'express';
import { getUserByIdController } from '../controllers/usersController.js';

const router = Router();

router.get('/:id', getUserByIdController);

export default router;
