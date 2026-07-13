const CACHE_NAME = "penbar-darts-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./styles.css",

    "./board.js",
    "./audio.js",
    "./game.js",

    "./fonts/bebas_neue/BebasNeue-Regular.ttf",
    "./fonts/oswald/static/Oswald-Regular.ttf",
    "./fonts/oswald/static/Oswald-Bold.ttf",
    "./fonts/permanent_marker/PermanentMarker-Regular.ttf"
];


self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(FILES_TO_CACHE);
            })
    );
});


self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});


self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});