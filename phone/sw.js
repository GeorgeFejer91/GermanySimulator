importScripts('./offline-files.js');

self.addEventListener('install', event => {
  event.waitUntil(caches.open(AMT_CACHE).then(cache => cache.addAll(AMT_OFFLINE_FILES)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('buergeramt-phone-') && name !== AMT_CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function mediaRange(response, header) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match) return response;
  const body = await response.blob();
  const size = body.size;
  const from = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const to = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from > to) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new Response(body.slice(from, to + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || body.type || 'application/octet-stream',
      'Content-Range': `bytes ${from}-${to}/${size}`,
      'Content-Length': String(to + 1 - from),
      'Accept-Ranges': 'bytes'
    }
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(AMT_CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (!cached) return fetch(request);
    const range = request.headers.get('range');
    return range ? mediaRange(cached, range) : cached;
  })());
});
