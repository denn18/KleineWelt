import { findParentById } from './parentsService.js';
import { findCaregiverById } from './caregiversService.js';

export async function findUserById(id) {
  const parent = await findParentById(id);
  if (parent) {
    return { ...parent, role: 'parent' };
  }

  const caregiver = await findCaregiverById(id);
  if (caregiver) {
    return { ...caregiver, role: 'caregiver' };
  }

  return null;
}
