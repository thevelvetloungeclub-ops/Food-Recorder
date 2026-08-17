const CACHE =
  'food-recorder-v2';

const FILES = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest'
];

self.addEventListener(
  'install',
  event => {

    event.waitUntil(
      caches
        .open(CACHE)
        .then(
          cache =>
            cache.addAll(FILES)
        )
    );

  }
);

self.addEventListener(
  'fetch',
  event => {

    event.respondWith(
      fetch(event.request)
        .catch(
          () =>
            caches.match(
              event.request
            )
        )
    );

  }
);
