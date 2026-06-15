/**
 * sw.js - Service Worker para CoverMangaHD
 * Estrategia: Network First para HTML/CSS/JS (siempre frescos),
 *             Cache First para imágenes (pesadas, cambian poco),
 *             Auto-recarga cuando hay nueva versión del SW.
 *
 * Para forzar una actualización en todos los clientes, incrementa CACHE_VERSION.
 */

const CACHE_VERSION  = 'v6';
const STATIC_CACHE   = `covermangahd-static-${CACHE_VERSION}`;
const IMAGE_CACHE    = `covermangahd-images-${CACHE_VERSION}`;

// Assets que se pre-cachean en install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/portadas.html',
    '/separadores.html',
    '/cubrepolvos.html',
    '/style.css',
    '/css/animations.css',
    '/css/modal.css',
    '/css/notifications.css',
    '/js/notifications.js',
    '/js/cache.js',
    '/js/carousel.js',
    '/js/gallery.js',
    '/js/preview-modal.js',
    '/js/admin-auth.js',
    '/firebase-config.js',
    '/security-utils.js',
    '/download-utils.js',
    '/manifest.json'
];

const PLACEHOLDER_IMAGE = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
        <rect fill="#1e293b" width="300" height="200"/>
        <text fill="#64748b" font-family="Arial" font-size="14" x="50%" y="50%" text-anchor="middle">Sin conexión</text>
    </svg>`
)}`;

// ─── Install: pre-cache static assets ──────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            // skipWaiting: el nuevo SW toma control INMEDIATAMENTE
            // sin esperar a que todas las pestañas se cierren
            .then(() => self.skipWaiting())
            .catch(err => console.warn('[SW] Install error:', err))
    );
});

// ─── Activate: elimina cachés viejos y toma control ────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(
                names
                    .filter(n => n.startsWith('covermangahd-') &&
                                 n !== STATIC_CACHE &&
                                 n !== IMAGE_CACHE)
                    .map(n => {
                        console.log('[SW] Eliminando caché viejo:', n);
                        return caches.delete(n);
                    })
            ))
            // clients.claim: el SW activado controla las páginas ya abiertas
            // sin necesidad de que el usuario recargue manualmente
            .then(() => self.clients.claim())
            // Notifica a todas las pestañas abiertas que hay una nueva versión
            .then(() => notifyClientsUpdate())
    );
});

// Envía un mensaje a todos los clientes para que recarguen si lo desean
async function notifyClientsUpdate() {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => {
        client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
    });
}

// ─── Fetch: estrategia según tipo de recurso ───────────────────────────────
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo GET
    if (request.method !== 'GET') return;

    // No interceptar Firebase Auth / Storage SDK calls
    if (/firebaseapp\.com\/(auth|storage)/.test(url.href)) return;
    if (/identitytoolkit|securetoken/.test(url.href)) return;

    // Imágenes externas (Storage Firebase, CDN) → Cache First
    if (isImageRequest(request)) {
        event.respondWith(cacheFirstImage(request));
        return;
    }

    // Firebase Firestore (datos) → Network Only (siempre frescos)
    if (/firestore\.googleapis\.com/.test(url.href)) {
        return; // deja pasar sin interceptar
    }

    // HTML, CSS, JS propios → Stale-While-Revalidate
    // Sirve desde caché inmediatamente (rápido) y actualiza en background
    if (isOwnAsset(url)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // CDN (Tailwind, anime.js, Firebase SDK, fonts) → Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(request));
});

// ─── Estrategias ───────────────────────────────────────────────────────────

/**
 * Stale-While-Revalidate:
 * 1. Responde con caché inmediatamente (si existe)
 * 2. En paralelo, descarga versión nueva y actualiza caché
 * Resultado: siempre rápido, siempre actualizado en la próxima carga
 */
async function staleWhileRevalidate(request) {
    const cache    = await caches.open(STATIC_CACHE);
    const cached   = await cache.match(request);

    // Fetch en paralelo (no awaited aún)
    const fetchPromise = fetch(request)
        .then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
        })
        .catch(() => null);

    return cached || await fetchPromise || new Response('Offline', { status: 503 });
}

/**
 * Cache First para imágenes con fallback placeholder
 */
async function cacheFirstImage(request) {
    const cache  = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch {
        return new Response(PLACEHOLDER_IMAGE, {
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function isImageRequest(request) {
    return request.destination === 'image' ||
           /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(request.url);
}

function isOwnAsset(url) {
    return url.hostname === self.location.hostname &&
           (url.pathname.endsWith('.html') ||
            url.pathname.endsWith('.css')  ||
            url.pathname.endsWith('.js')   ||
            url.pathname === '/');
}

// ─── Messages ──────────────────────────────────────────────────────────────
self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data?.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(names =>
                Promise.all(names.map(n => caches.delete(n)))
            )
        );
    }
});
