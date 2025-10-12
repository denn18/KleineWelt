import { findUserById } from '../services/usersService.js';

export async function getUserByIdController(req, res) {
  try {
    const user = await findUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Nutzer wurde nicht gefunden.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Failed to load user', error);
    res.status(500).json({ message: 'Konnte Nutzerprofil nicht laden.' });
  }
}
