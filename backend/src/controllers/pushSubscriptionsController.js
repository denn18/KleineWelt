import { findUserById } from '../services/usersService.js';
import { removePushSubscription, upsertPushSubscription } from '../services/pushSubscriptionsService.js';

export async function createPushSubscription(req, res) {
  const { userId, subscription, userAgent } = req.body || {};

  if (!userId || !subscription) {
    return res.status(400).json({ message: 'userId und subscription sind erforderlich.' });
  }

  const user = await findUserById(userId);
  if (!user) {
    return res.status(401).json({ message: 'Unbekannter Nutzer.' });
  }

  try {
    const saved = await upsertPushSubscription({ userId, subscription, userAgent });
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Failed to save push subscription', error);
    const status = error.status || 500;
    return res.status(status).json({ message: 'Push-Abo konnte nicht gespeichert werden.' });
  }
}

export async function deletePushSubscription(req, res) {
  const { userId, endpoint } = req.body || {};

  if (!userId || !endpoint) {
    return res.status(400).json({ message: 'userId und endpoint sind erforderlich.' });
  }

  const user = await findUserById(userId);
  if (!user) {
    return res.status(401).json({ message: 'Unbekannter Nutzer.' });
  }

  try {
    const removed = await removePushSubscription({ userId, endpoint });
    return res.json({ removed });
  } catch (error) {
    console.error('Failed to remove push subscription', error);
    const status = error.status || 500;
    return res.status(status).json({ message: 'Push-Abo konnte nicht entfernt werden.' });
  }
}
