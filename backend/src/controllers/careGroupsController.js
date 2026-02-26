import {
  deleteCareGroupForCaregiver,
  findCareGroupForUser,
  leaveCareGroup,
  upsertCareGroup,
} from '../services/careGroupsService.js';

export async function getOwnCareGroup(req, res) {
  try {
    const group = await findCareGroupForUser(req.user);
    res.json(group);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: 'Konnte Betreuungsgruppe nicht laden.' });
  }
}

export async function saveOwnCareGroup(req, res) {
  try {
    const group = await upsertCareGroup({
      user: req.user,
      participantIds: req.body.participantIds,
      daycareName: req.body.daycareName,
      logoImageUrl: req.body.logoImageUrl,
    });
    res.json(group);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Konnte Betreuungsgruppe nicht speichern.' });
  }
}

export async function deleteOwnCareGroup(req, res) {
  try {
    await deleteCareGroupForCaregiver(req.user);
    res.status(204).send();
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Konnte Betreuungsgruppe nicht löschen.' });
  }
}

export async function leaveOwnCareGroup(req, res) {
  try {
    await leaveCareGroup(req.user);
    res.status(204).send();
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Konnte Betreuungsgruppe nicht verlassen.' });
  }
}
