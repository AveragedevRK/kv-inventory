importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  // Force verbose logging for debugging
  workbox.setConfig({ debug: false });

  // Update immediately
  self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });

  // 1. Cache Google Fonts (Stale While Revalidate)
  workbox.routing.registerRoute(
    ({url}) => url.origin === 'https://fonts.googleapis.com' ||
               url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts',
    })
  );

  // 2. Cache CDN Assets (Tailwind, React, Lucide, Recharts)
  workbox.routing.registerRoute(
    ({url}) => url.origin === 'https://cdn.tailwindcss.com' || 
               url.origin === 'https://aistudiocdn.com' ||
               url.origin === 'https://esm.sh',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'cdn-assets',
    })
  );

  // 3. Cache Images (Cache First)
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // 4. Cache JS and CSS (Stale While Revalidate)
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'script' ||
                   request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // 5. Navigation fallback (Network First)
  // This ensures the SPA loads fresh content but works offline if cached
  workbox.routing.registerRoute(
    ({request}) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 3,
    })
  );
} else {
  console.log(`Workbox didn't load`);
}