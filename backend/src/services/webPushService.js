import webpush from 'web-push';
import { listPushSubscriptionsForUser, removePushSubscriptionByEndpoint } from './pushSubscriptionsService.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let vapidConfigured = false;

function canSendWebPush() {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

function configureWebPush() {
  if (vapidConfigured || !canSendWebPush()) {
    return;
  }

  webpush.setVapidDetails('mailto:support@wimmel-welt.de', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
}

function buildPushSubscription(subscription) {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return null;
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };
}

export async function sendWebPushNotification({ userId, payload, ttl = 3600 }) {
  if (!userId) {
    return false;
  }

  if (!canSendWebPush()) {
    console.warn('Web push is not configured. Missing VAPID keys.');
    return false;
  }

  configureWebPush();

  const subscriptions = await listPushSubscriptionsForUser(userId);
  if (subscriptions.length === 0) {
    return false;
  }

  const message = JSON.stringify(payload ?? {});
  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const webPushSubscription = buildPushSubscription(subscription);
      if (!webPushSubscription) {
        await removePushSubscriptionByEndpoint(subscription.endpoint);
        return false;
      }

      try {
        await webpush.sendNotification(webPushSubscription, message, { TTL: ttl });
        return true;
      } catch (error) {
        const statusCode = error?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscriptionByEndpoint(subscription.endpoint);
        }
        throw error;
      }
    }),
  );

  return results.some((result) => result.status === 'fulfilled' && result.value === true);
}
