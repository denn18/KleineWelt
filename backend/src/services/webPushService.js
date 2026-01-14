import webpush from 'web-push';
import { listPushSubscriptionsForUser, removePushSubscription } from './pushSubscriptionsService.js';

let isConfigured = false;

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'https://www.wimmel-welt.de';

  if (!publicKey || !privateKey) {
    return false;
  }

  if (!isConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isConfigured = true;
  }

  return true;
}

function toWebPushSubscription(subscription) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };
}

export async function sendPushToUser({ userId, payload }) {
  if (!configureWebPush()) {
    console.warn('VAPID keys fehlen, Web Push wird übersprungen.');
    return [];
  }

  const subscriptions = await listPushSubscriptionsForUser(userId);
  if (!subscriptions.length) {
    return [];
  }

  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(toWebPushSubscription(subscription), JSON.stringify(payload));
        return { endpoint: subscription.endpoint, ok: true };
      } catch (error) {
        const statusCode = error?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscription({ endpoint: subscription.endpoint });
        }
        console.error('Web Push fehlgeschlagen', error);
        return { endpoint: subscription.endpoint, ok: false, statusCode };
      }
    }),
  );

  return results;
}
