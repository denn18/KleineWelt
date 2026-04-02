import { Router } from 'express';
import {
  deleteCaregiver,
  getCaregiverById,
  getCaregiverByProfilePath,
  getCityByPostalCode,
  getCaregiverLocations,
  getCaregivers,
  patchCaregiver,
  postCaregiver,
} from '../controllers/caregiversController.js';

const router = Router();

router.get('/', getCaregivers);
router.get('/locations', getCaregiverLocations);
router.get('/postal-code/:postalCode/city', getCityByPostalCode);
router.post('/', postCaregiver);
router.get('/profile/:citySlug/:daycareSlug', getCaregiverByProfilePath);
router.get('/:id', getCaregiverById);
router.patch('/:id', patchCaregiver);
router.delete('/:id', deleteCaregiver);

export default router;
