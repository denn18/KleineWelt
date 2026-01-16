import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import { listPushSubscriptionsForUser, removePushSubscriptionByEndpoint } from './pushSubscriptionsService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultVapidKeysPath = path.resolve(__dirname, '../../.data/vapid-keys.json');

let vapidPublicKey = null;
let vapidPrivateKey = null;
let vapidConfigured = false;

function loadVapidKeysFromEnv() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

  if (publicKey && privateKey) {
    return { publicKey, privateKey };
  }

  return null;
}

function loadVapidKeysFromFile() {
  const filePath = process.env.VAPID_KEYS_FILE || defaultVapidKeysPath;
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    if (parsed?.publicKey && parsed?.privateKey) {
      return { publicKey: parsed.publicKey, privateKey: parsed.privateKey };
    }
  } catch (error) {
    console.warn('Failed to read VAPID keys file.', error);
  }

  return null;
}

function persistVapidKeys(keys) {
  const filePath = process.env.VAPID_KEYS_FILE || defaultVapidKeysPath;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(keys, null, 2));
  } catch (error) {
    console.warn('Failed to persist VAPID keys file.', error);
  }
}

function ensureVapidKeys() {
  if (vapidPublicKey && vapidPrivateKey) {
    return true;
  }

  const envKeys = loadVapidKeysFromEnv();
  if (envKeys) {
    vapidPublicKey = envKeys.publicKey;
    vapidPrivateKey = envKeys.privateKey;
    return true;
  }

  const fileKeys = loadVapidKeysFromFile();
  if (fileKeys) {
    vapidPublicKey = fileKeys.publicKey;
    vapidPrivateKey = fileKeys.privateKey;
    return true;
  }

  const generated = webpush.generateVAPIDKeys();
  vapidPublicKey = generated.publicKey;
  vapidPrivateKey = generated.privateKey;
  persistVapidKeys({ publicKey: vapidPublicKey, privateKey: vapidPrivateKey });
  if (process.env.NODE_ENV === 'production') {
    console.warn('Generated new VAPID keys at runtime because none were configured.');
  }
  return true;
}

function canSendWebPush() {
  return ensureVapidKeys();
}

function configureWebPush() {
  if (vapidConfigured || !ensureVapidKeys()) {
    return;
  }

  webpush.setVapidDetails('mailto:support@wimmel-welt.de', vapidPublicKey, vapidPrivateKey);
  vapidConfigured = true;
}

export function getVapidPublicKey() {
  if (!ensureVapidKeys()) {
    return null;
  }

  return vapidPublicKey;
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
