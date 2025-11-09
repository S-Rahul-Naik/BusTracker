/**
 * Service Worker for Bus Notification System
 * 
 * Provides offline support, background sync, and push notifications
 */

const CACHE_NAME = 'busnotify-v1.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sounds/default-notification.mp3',
  '/sounds/urgent-notification.mp3',
  '/sounds/high-notification.mp3'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/v1/routes',
  '/api/v1/stops',
  '/api/v1/auth/me'
];

// Cache strategies
const CACHE_STRATEGIES = {
  'static': 'cache-first',
  'api': 'network-first',
  'images': 'cache-first',
  'dynamic': 'stale-while-revalidate'
};

// Background sync tags
const SYNC_TAGS = {
  NOTIFICATION_READ: 'notification-read-sync',
  SUBSCRIPTION_UPDATE: 'subscription-update-sync',
  OFFLINE_ACTIONS: 'offline-actions-sync'
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache API endpoints
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[SW] Pre-caching API endpoints');
        return Promise.allSettled(
          API_ENDPOINTS.map(endpoint => 
            fetch(endpoint).then(response => {
              if (response.ok) {
                return cache.put(endpoint, response);
              }
            }).catch(() => {
              // Ignore network errors during install
            })
          )
        );
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('busnotify-') && 
              ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - handle network requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Determine cache strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

/**
 * Background sync event - handle offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.NOTIFICATION_READ:
      event.waitUntil(syncNotificationRead());
      break;
    case SYNC_TAGS.SUBSCRIPTION_UPDATE:
      event.waitUntil(syncSubscriptionUpdates());
      break;
    case SYNC_TAGS.OFFLINE_ACTIONS:
      event.waitUntil(syncOfflineActions());
      break;
  }
});

/**
 * Push event - handle push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'Bus Notification',
    body: 'You have a new update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'bus-notification',
    requireInteraction: false,
    silent: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: data.data || {}
      };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }

  // Determine notification priority
  const priority = notificationData.data?.priority || 'normal';
  
  if (priority === 'urgent') {
    notificationData.requireInteraction = true;
    notificationData.silent = false;
  } else if (priority === 'low') {
    notificationData.silent = true;
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const url = notificationData.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if there's already a window/tab open with the app
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          // Focus existing window and navigate to URL
          return client.focus().then(() => {
            if (url !== '/') {
              return client.postMessage({
                type: 'NAVIGATE',
                url: url
              });
            }
          });
        }
      }
      
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});

/**
 * Message event - handle messages from main thread
 */
self.addEventListener('message', (event) => {
  const { data } = event;
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_ROUTES':
      cacheRoutes(data.routes);
      break;
    case 'STORE_OFFLINE_ACTION':
      storeOfflineAction(data.action);
      break;
    case 'REQUEST_SYNC':
      requestBackgroundSync(data.tag);
      break;
  }
});

// Helper functions

function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.pathname.endsWith(asset)) ||
         url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/);
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/);
}

/**
 * Cache-first strategy
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      // Return cached version immediately
      return cached;
    }
    
    // Fetch from network and cache
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.error('[SW] Cache-first error:', error);
    return getOfflinePage();
  }
}

/**
 * Network-first strategy
 */
async function networkFirst(request, cacheName) {
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful response
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      return response;
    }
    
    throw new Error(`Network response not ok: ${response.status}`);
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error.message);
    
    // Fall back to cache
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Return offline response for API requests
    if (isAPIRequest(new URL(request.url))) {
      return new Response(JSON.stringify({
        error: 'Offline',
        message: 'This feature is not available offline'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return getOfflinePage();
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Start network request (don't await)
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached version immediately if available
  if (cached) {
    return cached;
  }
  
  // Otherwise wait for network
  try {
    const networkResponse = await networkPromise;
    if (networkResponse) {
      return networkResponse;
    }
  } catch (error) {
    console.error('[SW] Network error:', error);
  }
  
  return getOfflinePage();
}

/**
 * Get offline page
 */
async function getOfflinePage() {
  const cache = await caches.open(STATIC_CACHE);
  return cache.match('/offline.html') || new Response('Offline', { status: 503 });
}

/**
 * Cache routes data
 */
async function cacheRoutes(routes) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  // Cache route data
  const routesResponse = new Response(JSON.stringify(routes), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  await cache.put('/api/v1/routes', routesResponse);
  console.log('[SW] Routes cached for offline use');
}

/**
 * Store offline action in IndexedDB
 */
async function storeOfflineAction(action) {
  const request = indexedDB.open('busnotify-offline', 1);
  
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('actions')) {
      db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
    }
  };
  
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['actions'], 'readwrite');
    const store = transaction.objectStore('actions');
    
    store.add({
      ...action,
      timestamp: Date.now()
    });
  };
}

/**
 * Sync offline actions
 */
async function syncOfflineActions() {
  console.log('[SW] Syncing offline actions...');
  
  return new Promise((resolve) => {
    const request = indexedDB.open('busnotify-offline', 1);
    
    request.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = async () => {
        const actions = getAllRequest.result;
        
        for (const action of actions) {
          try {
            await fetch(action.url, {
              method: action.method,
              headers: action.headers,
              body: action.body
            });
            
            // Remove successful action
            store.delete(action.id);
          } catch (error) {
            console.error('[SW] Failed to sync action:', error);
          }
        }
        
        resolve();
      };
    };
  });
}

/**
 * Sync notification read status
 */
async function syncNotificationRead() {
  console.log('[SW] Syncing notification read status...');
  // Implementation would sync read notifications with server
}

/**
 * Sync subscription updates
 */
async function syncSubscriptionUpdates() {
  console.log('[SW] Syncing subscription updates...');
  // Implementation would sync subscription changes with server
}

/**
 * Request background sync
 */
function requestBackgroundSync(tag) {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    self.registration.sync.register(tag).catch((error) => {
      console.error('[SW] Background sync registration failed:', error);
    });
  }
}

console.log('[SW] Service Worker loaded');