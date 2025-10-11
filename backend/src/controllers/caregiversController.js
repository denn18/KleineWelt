import { createCaregiver, listCaregivers } from '../services/caregiversService.js';

export async function getCaregivers(req, res) {
  try {
    const caregivers = await listCaregivers({ postalCode: req.query.postalCode });
    res.json(caregivers);
  } catch (error) {
    console.error('Failed to load caregivers', error);
    res.status(500).json({ message: 'Konnte Tagespflegepersonen nicht laden.' });
  }
}

export async function postCaregiver(req, res) {
  try {
    const caregiver = await createCaregiver(req.body);
    res.status(201).json(caregiver);
  } catch (error) {
    console.error('Failed to create caregiver', error);
    const status = error.status || 500;
    res.status(status).json({ message: 'Konnte Profil nicht speichern.' });
  }
}
