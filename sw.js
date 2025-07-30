// Service Worker dla Protokół Kolberg 2.0 PWA
// Wykorzystuje Workbox do zaawansowanego cachingu i offline support

importScripts('../assets/vendor/workbox/workbox-sw.js');

if (workbox) {
  console.log('Workbox załadowany pomyślnie');
  
  // Konfiguracja Workbox
  workbox.setConfig({
    modulePathPrefix: '../assets/vendor/workbox/'
  });

  // Precaching - automatyczne cachowanie kluczowych plików
  workbox.precaching.precacheAndRoute([
    {url: '/', revision: '1'},
    {url: '/index.html', revision: '1'},
    {url: '/style.css', revision: '1'},
    {url: '/app.js', revision: '1'},
    {url: '/manifest.json', revision: '1'},
    {url: '/img/PROTOKOŁKOLBERG2.0.svg', revision: '1'},
    {url: '/img/Hero.jpg', revision: '1'},
    {url: '/img/kompasarcana.svg', revision: '1'},
    {url: '/img/lupa.png', revision: '1'},
    {url: '/img/ogien.png', revision: '1'},
    {url: '/img/mapa.png', revision: '1'},
    {url: '/img/gwiazda.png', revision: '1'}
  ]);

  // Strategia Network First dla HTML - zawsze próbuj pobrać najnowszą wersję
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'document',
    new workbox.strategies.NetworkFirst({
      cacheName: 'html-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dni
        }),
      ],
    })
  );

  // Strategia Cache First dla statycznych zasobów (CSS, JS, obrazy)
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'static-resources',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dni
        }),
      ],
    })
  );

  // Strategia Stale While Revalidate dla API calls
  workbox.routing.registerRoute(
    ({url}) => url.pathname.startsWith('/api/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'api-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minut
        }),
      ],
    })
  );

  // Background Sync dla offline queue (inspirowane Starbucks PWA)
  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('legend-queue', {
    maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
  });

  workbox.routing.registerRoute(
    /\/api\/legends/,
    new workbox.strategies.NetworkOnly({
      plugins: [bgSyncPlugin]
    }),
    'POST'
  );

  // Offline fallback - wyświetl offline page gdy brak połączenia
  workbox.recipes.offlineFallback({
    pageFallback: '/offline.html'
  });

  // Google Analytics offline support
  workbox.googleAnalytics.initialize();

  // Skip waiting i claim clients
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // Listener dla wiadomości z głównego wątku
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  // Notification click handler
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open_app') {
      event.waitUntil(
        clients.openWindow('/')
      );
    }
  });

  // Push notification handler
  self.addEventListener('push', (event) => {
    const options = {
      body: event.data ? event.data.text() : 'Nowa legenda została dodana!',
      icon: '/img/PROTOKOŁKOLBERG2.0.svg',
      badge: '/img/kompasarcana.svg',
      actions: [
        {
          action: 'open_app',
          title: 'Otwórz aplikację'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('Protokół Kolberg 2.0', options)
    );
  });

} else {
  console.log('Workbox nie został załadowany');
}

