import { findUserById } from '../services/usersService.js';
import { savePushSubscription, removePushSubscription } from '../services/pushSubscriptionsService.js';
import { getVapidPublicKey, sendWebPushNotification } from '../services/webPushService.js';

export function getVapidPublicKeyResponse(_req, res) {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return res.status(503).json({ message: 'VAPID-Schlüssel sind nicht konfiguriert.' });
  }

  return res.json({ publicKey });
}

export async function subscribeToPush(req, res) {
  const { userId, subscription, userAgent } = req.body || {};

  if (!userId || !subscription?.endpoint) {
    return res.status(400).json({ message: 'userId und Subscription sind erforderlich.' });
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Nutzer wurde nicht gefunden.' });
    }

    const saved = await savePushSubscription({ userId, subscription, userAgent });
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Failed to save push subscription', error);
    const status = error.status || 500;
    return res.status(status).json({ message: 'Push-Subscription konnte nicht gespeichert werden.' });
  }
}

export async function unsubscribeFromPush(req, res) {
  const { userId, endpoint } = req.body || {};

  if (!userId || !endpoint) {
    return res.status(400).json({ message: 'userId und endpoint sind erforderlich.' });
  }

  try {
    const removed = await removePushSubscription({ userId, endpoint });
    return res.json({ removed });
  } catch (error) {
    console.error('Failed to remove push subscription', error);
    const status = error.status || 500;
    return res.status(status).json({ message: 'Push-Subscription konnte nicht entfernt werden.' });
  }
}

export async function sendTestPush(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Test-Push ist nur in Entwicklung verfügbar.' });
  }

  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ message: 'userId ist erforderlich.' });
  }

  try {
    const sent = await sendWebPushNotification({
      userId,
      payload: {
        title: 'Push-Test (Wimmel Welt)',
        body: 'Wenn du diese Nachricht siehst, funktioniert Web Push 🎉',
        url: '/nachrichten',
        icon: '/hero-family.svg',
        badge: '/hero-family.svg',
      },
    });

    return res.json({ sent });
  } catch (error) {
    console.error('Failed to send test push', error);
    return res.status(500).json({ message: 'Test-Push konnte nicht gesendet werden.' });
  }
}
