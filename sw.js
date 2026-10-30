// Service worker do Lu Depil: permite instalar o app e abrir sem internet.
// Estratégia "rede primeiro": com internet sempre pega a versão nova e guarda
// uma cópia; sem internet usa a última cópia guardada.
// Os dados das clientes NÃO passam por aqui — continuam no localStorage.
const CACHE_NAME = 'ludepil-v1';
const APP_PAGE = './ludepil.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.add(APP_PAGE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone()).catch(err => console.error('Falha ao guardar cópia offline:', err));
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const page = await cache.match(APP_PAGE);
      if (page) return page;
    }
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(networkFirst(event.request));
});
