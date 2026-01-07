/**
 * Service Worker Assets-Only pour Seed Media
 * 
 * Stratégie : Cache uniquement les assets statiques (JS, CSS, images, fonts)
 * Ne met JAMAIS en cache les pages HTML pour respecter l'ISR de Next.js
 * 
 * Compatible avec ISR : ✅ Aucun conflit
 * Mise à jour automatique : ✅ Network First pour les assets Next.js
 */

// Version du cache - Incrémenter à chaque déploiement pour forcer la mise à jour
const CACHE_VERSION = 'v3';
const CACHE_NAME = `seed-media-assets-${CACHE_VERSION}`;

// Patterns pour différents types d'assets
const NEXTJS_ASSET_PATTERN = /\/_next\/static\//;  // Assets Next.js (JS, CSS) - Hashés, toujours vérifier le réseau
const STATIC_ASSET_PATTERNS = [
  /\/images\//,        // Images
  /\/fonts\//,         // Fonts
  /\.(?:woff2?|png|jpg|jpeg|svg|gif|webp|ico)$/i, // Assets statiques non-hashés
];

// Installation : Préparer le cache
self.addEventListener('install', (event) => {
  console.log('[SW] Installation du Service Worker version', CACHE_VERSION);
  // Forcer l'activation immédiate du nouveau Service Worker
  // Cela garantit que le nouveau SW prend le contrôle immédiatement
  self.skipWaiting();
});

// Écouter les messages du client pour forcer l'activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Message SKIP_WAITING reçu, activation immédiate...');
    self.skipWaiting();
  }
});

// Activation : Nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation du Service Worker version', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(`seed-media-assets-${CACHE_VERSION}`))
          .map((name) => {
            console.log('[SW] Suppression de l\'ancien cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Prendre le contrôle immédiatement
      return self.clients.claim();
    })
  );
});

// Fonction pour vérifier si c'est un asset Next.js (hashé)
function isNextJsAsset(url) {
  return NEXTJS_ASSET_PATTERN.test(url.pathname);
}

// Fonction pour vérifier si c'est un asset statique
function isStaticAsset(url) {
  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

// Stratégie Network First avec fallback cache pour les assets Next.js
// Cela garantit que les nouveaux assets hashés sont toujours récupérés
async function networkFirstWithCache(request) {
  try {
    // Essayer le réseau en premier
    const networkResponse = await fetch(request);
    
    // Si la réponse est valide, la mettre en cache
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Erreur réseau, utilisation du cache:', error);
    // En cas d'erreur réseau, utiliser le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Si pas de cache non plus, retourner une erreur
    throw error;
  }
}

// Stratégie Stale-While-Revalidate pour les assets statiques
// Sert le cache immédiatement et met à jour en arrière-plan
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Mettre à jour le cache en arrière-plan
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Ignorer les erreurs de mise à jour en arrière-plan
  });
  
  // Retourner le cache immédiatement si disponible, sinon attendre le réseau
  return cachedResponse || fetchPromise;
}

// Intercepter les requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes cross-origin
  if (url.origin !== self.location.origin) {
    return;
  }

  // Assets Next.js : Network First (toujours vérifier le réseau pour les nouveaux hash)
  if (isNextJsAsset(url)) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Assets statiques : Stale-While-Revalidate (cache rapide + mise à jour en arrière-plan)
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Pages HTML et autres : Toujours aller chercher (respecte ISR)
  // Ne pas intercepter, laisser Next.js gérer avec ISR
  event.respondWith(fetch(request));
});

