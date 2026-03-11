import { Router } from 'express';
import {
  getCaregiverById,
  getCaregiverByProfilePath,
  getCaregiverLocations,
  getCaregivers,
  patchCaregiver,
  postCaregiver,
} from '../controllers/caregiversController.js';

const router = Router();

router.get('/', getCaregivers);
router.get('/locations', getCaregiverLocations);
router.post('/', postCaregiver);
router.get('/profile/:citySlug/:daycareSlug', getCaregiverByProfilePath);
router.get('/:id', getCaregiverById);
router.patch('/:id', patchCaregiver);

export default router;
