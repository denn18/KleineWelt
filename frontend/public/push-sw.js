/* global self, clients */

const DEFAULT_TITLE = 'Neue Nachricht in Wimmel Welt';
const DEFAULT_BODY = 'Du hast eine neue Nachricht erhalten.';
const DEFAULT_ICON = '/hero-family.svg';

self.addEventListener('push', (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || DEFAULT_TITLE;
  const body = payload.body || DEFAULT_BODY;
  const icon = payload.icon || DEFAULT_ICON;
  const badge = payload.badge || DEFAULT_ICON;
  const data = payload.data || {};

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || '/';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === absoluteUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(absoluteUrl);
        }
        return null;
      }),
  );
});
