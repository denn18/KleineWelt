import { createCaregiver, listCaregivers } from '../services/caregiversService.js';

export function getCaregivers(req, res) {
  const caregivers = listCaregivers({ postalCode: req.query.postalCode });
  res.json(caregivers);
}

export function postCaregiver(req, res) {
  const caregiver = createCaregiver(req.body);
  res.status(201).json(caregiver);
}
