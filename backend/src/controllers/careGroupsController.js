import { deleteCareGroup, findCareGroupForUser, upsertCareGroup } from '../services/careGroupsService.js';

export async function getCareGroupController(req, res) {
  try {
    const userId = req.query.userId;
    const group = await findCareGroupForUser(userId);

    if (!group) {
      return res.status(404).json({ message: 'Betreuungsgruppe wurde nicht gefunden.' });
    }

    return res.json(group);
  } catch (error) {
    console.error('Failed to load care group', error);
    return res.status(error.status || 500).json({ message: 'Konnte Betreuungsgruppe nicht laden.' });
  }
}

export async function upsertCareGroupController(req, res) {
  try {
    const group = await upsertCareGroup(req.body ?? {});
    return res.json(group);
  } catch (error) {
    console.error('Failed to save care group', error);
    return res.status(error.status || 500).json({ message: 'Konnte Betreuungsgruppe nicht speichern.' });
  }
}

export async function deleteCareGroupController(req, res) {
  try {
    const deleted = await deleteCareGroup({ caregiverId: req.params.caregiverId });
    if (!deleted) {
      return res.status(404).json({ message: 'Betreuungsgruppe wurde nicht gefunden.' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete care group', error);
    return res.status(error.status || 500).json({ message: 'Konnte Betreuungsgruppe nicht löschen.' });
  }
}
