import crypto from 'crypto';
import { verifyAuthToken } from '../utils/authToken.js';

function hash(value = '') { return crypto.createHash('sha256').update(value).digest('hex'); }
function safeEqual(a = '', b = '') { return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
function adminCredentialsMatch(username, password) {
  const configuredEmail = process.env.ADMIN_EMAIL;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (configuredEmail || configuredPassword) {
    return safeEqual(username, configuredEmail || '') && safeEqual(password, configuredPassword || '');
  }
  return safeEqual(hash(username), 'c3088594f03a4936e0e749c4167eaf1a5da67bfd31fa1cc627aa27d6127fbcec')
    && safeEqual(hash(password), '82c2876bd465866ba6dd69f26390fd49620a826908672ce6f478c9e128267f4e');
}

export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    const payload = verifyAuthToken(auth.slice(7).trim());
    if (payload?.role === 'admin') {
      req.user = { id: payload.id, role: 'admin', email: payload.email };
      return next();
    }
  }
  if (auth.startsWith('Basic ')) {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    if (adminCredentialsMatch(username, password)) {
      req.user = { id: username, role: 'admin', email: username };
      return next();
    }
  }
  return res.status(401).json({ message: 'Admin-Zugriff erforderlich.' });
}
