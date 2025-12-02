import { Router } from 'express';
import { streamFile } from '../controllers/filesController.js';

const router = Router();

router.get('/*', streamFile);

export default router;
