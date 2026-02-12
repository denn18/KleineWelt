import { verifyAuthToken } from '../utils/authToken.js';

export function requireAuth(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  const payload = verifyAuthToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  req.user = {
    id: payload.id,
    role: payload.role,
    email: payload.email,
  };

  return next();
}
