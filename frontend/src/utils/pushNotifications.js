export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission() {
  if (typeof Notification === 'undefined') {
    return 'default';
  }
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') {
    return 'denied';
  }
  return Notification.requestPermission();
}

export async function getActivePushSubscription() {
  if (!isPushSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function fetchVapidPublicKey() {
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  try {
    const response = await fetch('/api/push-subscriptions/vapid-public-key');
    if (response.ok) {
      const data = await response.json();
      const backendKey = data?.publicKey;
      if (backendKey) {
        if (envKey && envKey !== backendKey) {
          console.warn(
            'VAPID key mismatch: using backend key from /api/push-subscriptions/vapid-public-key instead of VITE_VAPID_PUBLIC_KEY.',
          );
        }
        return backendKey;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch backend VAPID public key, falling back to VITE_VAPID_PUBLIC_KEY if available.', error);
  }

  if (envKey) {
    return envKey;
  }

  throw new Error('VAPID Public Key fehlt.');
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function subscribeToPush(vapidPublicKey) {
  if (!isPushSupported()) {
    throw new Error('Push ist in diesem Browser nicht verfügbar.');
  }

  if (!vapidPublicKey) {
    throw new Error('VAPID Public Key fehlt.');
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

export async function unsubscribeFromPush() {
  const subscription = await getActivePushSubscription();
  if (!subscription) {
    return false;
  }

  return subscription.unsubscribe();
}
