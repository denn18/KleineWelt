import { authenticateUser } from '../services/authService.js';
import { createAuthToken, createRefreshToken, verifyRefreshToken } from '../utils/authToken.js';

function buildAuthResponse(user) {
  const token = createAuthToken({ id: user.id, role: user.role, email: user.email });
  const refreshToken = createRefreshToken({ id: user.id, role: user.role, email: user.email });
  const accessPayload = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));

  return {
    ...user,
    token,
    refreshToken,
    tokenExpiresAt: accessPayload.exp,
  };
}

export async function loginController(req, res) {
  const { identifier, password } = req.body || {};

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Benutzername oder Passwort fehlen.' });
  }

  try {
    const user = await authenticateUser(identifier, password);
    res.json(buildAuthResponse(user));
  } catch (error) {
    console.error('Failed to authenticate user', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Anmeldung fehlgeschlagen.' });
  }
}

export async function refreshTokenController(req, res) {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh Token fehlt.' });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = {
    id: payload.id,
    role: payload.role,
    email: payload.email,
  };

  return res.json(buildAuthResponse(user));
}
