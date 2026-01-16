self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { title: 'Neue Nachricht', body: event.data?.text?.() };
  }

  const title = payload.title || 'Neue Nachricht';
  const options = {
    body: payload.body || 'Du hast eine neue Nachricht erhalten.',
    icon: payload.icon || '/wimmel-welt.png',
    badge: payload.badge || '/hero-family.svg',
    tag: payload.tag || 'message',
    data: {
      url: payload.url || '/nachrichten',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/nachrichten';
  const urlToOpen = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(urlToOpen).catch(() => {});
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }

        return undefined;
      }),
  );
});
