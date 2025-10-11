import { Router } from 'express';
import { getCaregivers, postCaregiver } from '../controllers/caregiversController.js';

const router = Router();

router.get('/', getCaregivers);
router.post('/', postCaregiver);

export default router;
