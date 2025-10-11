import { createParent, listParents } from '../services/parentsService.js';

export async function getParents(_req, res) {
  try {
    const parents = await listParents();
    res.json(parents);
  } catch (error) {
    console.error('Failed to load parents', error);
    res.status(500).json({ message: 'Konnte Elternprofile nicht laden.' });
  }
}

export async function postParent(req, res) {
  try {
    const parent = await createParent(req.body);
    res.status(201).json(parent);
  } catch (error) {
    console.error('Failed to create parent', error);
    const status = error.status || 500;
    res.status(status).json({ message: 'Konnte Elternprofil nicht speichern.' });
  }
}
