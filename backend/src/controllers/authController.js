import { authenticateUser } from '../services/authService.js';

export async function loginController(req, res) {
  const { identifier, password } = req.body || {};

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Benutzername oder Passwort fehlen.' });
  }

  try {
    const user = await authenticateUser(identifier, password);
    res.json(user);
  } catch (error) {
    console.error('Failed to authenticate user', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Anmeldung fehlgeschlagen.' });
  }
}
