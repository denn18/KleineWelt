import { Router } from 'express';
import { getCaregiverById, getCaregivers, patchCaregiver, postCaregiver } from '../controllers/caregiversController.js';

const router = Router();

router.get('/', getCaregivers);
router.post('/', postCaregiver);
router.get('/:id', getCaregiverById);
router.patch('/:id', patchCaregiver);

export default router;
