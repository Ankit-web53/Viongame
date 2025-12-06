const CACHE_NAME = 'viongame-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/shared/game-style.css',
    '/shared/game-utils.js',
    '/games/flappy-bird/index.html',
    '/games/flappy-bird/style.css',
    '/games/flappy-bird/script.js',
    '/games/snake/index.html',
    '/games/snake/style.css',
    '/games/snake/script.js',
    '/games/tic-tac-toe/index.html',
    '/games/tic-tac-toe/style.css',
    '/games/tic-tac-toe/script.js',
    '/games/memory-card/index.html',
    '/games/memory-card/style.css',
    '/games/memory-card/script.js',
    '/games/car-racing/index.html',
    '/games/car-racing/style.css',
    '/games/car-racing/script.js',
    '/games/pong/index.html',
    '/games/pong/style.css',
    '/games/pong/script.js',
    '/games/brick-breaker/index.html',
    '/games/brick-breaker/style.css',
    '/games/brick-breaker/script.js',
    '/games/2048/index.html',
    '/games/2048/style.css',
    '/games/2048/script.js',
    '/games/whack-a-mole/index.html',
    '/games/whack-a-mole/style.css',
    '/games/whack-a-mole/script.js',
    '/games/jumping-dino/index.html',
    '/games/jumping-dino/style.css',
    '/games/jumping-dino/script.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
            )
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
