/**
 * sw.js - Service Worker para CoverMangaHD
 * Permite funcionamiento offline y mejora el rendimiento
 */

const CACHE_NAME = 'covermangahd-v1';
const STATIC_CACHE = 'covermangahd-static-v1';
const DYNAMIC_CACHE = 'covermangahd-dynamic-v1';

// Archivos a cachear inmediatamente
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/portadas.html',
    '/separadores.html',
    '/cubrepolvos.html',
    '/style.css',
    '/css/carousel.css',
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

// URLs de Firebase a cachear dinámicamente
const FIREBASE_PATTERNS = [
    /firestore\.googleapis\.com/,
    /firebase.*\.googleapis\.com/,
    /firebaseapp\.com/
];

// Imágenes placeholder
const PLACEHOLDER_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
        <rect fill="#ecf0f1" width="300" height="200"/>
        <text fill="#7f8c8d" font-family="Arial" font-size="14" x="50%" y="50%" text-anchor="middle">Imagen no disponible</text>
    </svg>
`)}`;

/**
 * Evento de instalación - Cachea archivos estáticos
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Cacheando archivos estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Instalación completada');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Error en instalación:', error);
            })
    );
});

/**
 * Evento de activación - Limpia cachés antiguos
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            return name !== STATIC_CACHE && 
                                   name !== DYNAMIC_CACHE &&
                                   name.startsWith('covermangahd-');
                        })
                        .map((name) => {
                            console.log('[SW] Eliminando caché antiguo:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activación completada');
                return self.clients.claim();
            })
    );
});

/**
 * Evento de fetch - Estrategia de caché
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requests que no son GET
    if (request.method !== 'GET') return;

    // Ignorar requests de Firebase Auth y Storage (manejados por Firebase SDK)
    if (url.href.includes('firebaseapp.com') && 
        (url.href.includes('auth') || url.href.includes('storage'))) {
        return;
    }

    // Estrategia para archivos estáticos (Cache First)
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Estrategia para imágenes (Cache First con fallback)
    if (isImageRequest(request)) {
        event.respondWith(cacheFirstWithFallback(request));
        return;
    }

    // Estrategia para Firebase Firestore (Network First)
    if (isFirebaseRequest(url)) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Estrategia por defecto (Network First)
    event.respondWith(networkFirst(request));
});

/**
 * Verifica si es un archivo estático
 * @param {URL} url 
 * @returns {boolean}
 */
function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.pathname.endsWith(asset) || url.pathname === asset);
}

/**
 * Verifica si es una petición de imagen
 * @param {Request} request 
 * @returns {boolean}
 */
function isImageRequest(request) {
    return request.destination === 'image' || 
           request.headers.get('accept')?.includes('image');
}

/**
 * Verifica si es una petición a Firebase
 * @param {URL} url 
 * @returns {boolean}
 */
function isFirebaseRequest(url) {
    return FIREBASE_PATTERNS.some(pattern => pattern.test(url.href));
}

/**
 * Estrategia Cache First
 * @param {Request} request 
 * @returns {Promise<Response>}
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Error en cacheFirst:', error);
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Estrategia Cache First con fallback para imágenes
 * @param {Request} request 
 * @returns {Promise<Response>}
 */
async function cacheFirstWithFallback(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Retornar imagen placeholder
        return new Response(PLACEHOLDER_IMAGE, {
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }
}

/**
 * Estrategia Network First
 * @param {Request} request 
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Evento de mensaje - Para comunicación con la página
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            })
        );
    }
});

console.log('[SW] Service Worker cargado');
