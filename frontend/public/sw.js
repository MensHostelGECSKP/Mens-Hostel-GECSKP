const CACHE_NAME = 'mh-app-v4';
const STATIC_CACHE = 'mh-app-static-v4';

const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/offline.html',
  '/logo.png',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-192.png',
  '/icon-384.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-16x16.png'
];

// Install event - pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Message event - support SKIP_WAITING updates from the client prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skipping waiting and activating...');
    self.skipWaiting();
  }
});

// Fetch event - cache strategies for different request types
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // API requests - BYPASS SERVICE WORKER CACHE COMPLETELY
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Navigation requests - network first, fallback to offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        console.log('[Service Worker] Navigation failed, serving offline page');
        const cache = await caches.open(STATIC_CACHE);
        return cache.match('/offline.html') || cache.match('/') || new Response('Offline', { status: 503 });
      })
    );
    return;
  }
  
  // Static assets - Cache First, Network Fallback
  event.respondWith(handleStaticRequest(event.request));
});

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful GET requests from matching origins or fonts CDN
    if (networkResponse && networkResponse.status === 200) {
      const url = new URL(request.url);
      if (
        url.origin === self.location.origin ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')
      ) {
        cache.put(request, networkResponse.clone());
      }
    }
    return networkResponse;
  } catch (error) {
    // Return empty status or let browser handle it
    return new Response('Offline resource not found', { status: 404 });
  }
}

// Push event listener - handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.notification.body,
      icon: data.notification.icon || '/logo.png',
      badge: data.notification.badge || '/icon-72.png',
      vibrate: [100, 50, 100],
      data: data.notification.data || {},
    };
    
    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
  } catch (err) {
    console.error('[Service Worker] Error displaying push notification:', err);
  }
});

// Notification click listener - handle deep linking and metric reporting
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  const urlToOpen = new URL(data.url || '/', self.location.origin).href;
  const metricId = data.metricId;
  
  const promiseChain = Promise.all([
    // 1. Report click metric in background
    metricId
      ? fetch(`/api/notifications/metrics/${metricId}/click`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch((err) => console.warn('[Service Worker] Click metric report failed:', err))
      : Promise.resolve(),
      
    // 2. Open or focus window
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find matching client
      const matchingClient = windowClients.find(
        (client) => new URL(client.url).origin === self.location.origin
      );
      
      if (matchingClient) {
        return matchingClient.navigate(urlToOpen).then((client) => client.focus());
      } else {
        return clients.openWindow(urlToOpen);
      }
    }),
  ]);
  
  event.waitUntil(promiseChain);
});