const version = "253de6aeb6f554a6";
const prefix = 'ciao-workbook-';
const cacheName = prefix + version;
const assets = ["activities.js","ape.webp","app.js","art-pad.js","art/10.webp","art/11.webp","art/12.webp","art/13.webp","art/14.webp","art/15.webp","art/17.webp","art/18.webp","art/20.webp","art/21.webp","art/23.webp","art/24.webp","art/25.webp","art/26.webp","art/42.webp","art/44.webp","art/45.webp","art/48-0.webp","art/48-1.webp","art/48-10.webp","art/48-11.webp","art/48-2.webp","art/48-3.webp","art/48-4.webp","art/48-5.webp","art/48-6.webp","art/48-7.webp","art/48-8.webp","art/48-9.webp","art/6.webp","art/7.webp","art/8.webp","art/9.webp","art/color-brushes.webp","art/cross-carrot.webp","art/cross-pea.webp","art/cross-pepper.webp","art/cross-pumpkin.webp","art/dictionary-fruit.webp","art/dictionary-veg.webp","art/family-group.webp","art/family.webp","art/flash-1.webp","art/flash-2.webp","art/flash-3.webp","art/flash-4.webp","art/flash-5.webp","art/flash-6.webp","art/flash-7.webp","art/flash-8.webp","art/flash-9.webp","art/fridge.webp","art/fruit-albicocca.webp","art/fruit-anguria.webp","art/fruit-arancia.webp","art/fruit-banana.webp","art/fruit-ciliegia.webp","art/fruit-fragola.webp","art/fruit-limone.webp","art/fruit-mela.webp","art/fruit-pera.webp","art/fruit-pesca.webp","art/fruit-row-55.webp","art/fruit-row-56.webp","art/giulio.webp","art/intro-reader.webp","art/marco-fruit.webp","art/marco.webp","art/source-cover.webp","art/vegetables.webp","audio.js","audio/italian-001.mp3","audio/italian-002.mp3","audio/italian-003.mp3","audio/italian-004.mp3","audio/italian-005.mp3","audio/italian-006.mp3","audio/italian-007.mp3","audio/italian-008.mp3","audio/italian-009.mp3","audio/italian-010.mp3","audio/italian-011.mp3","audio/italian-012.mp3","audio/italian-013.mp3","audio/italian-014.mp3","audio/italian-015.mp3","audio/italian-016.mp3","audio/italian-017.mp3","audio/italian-018.mp3","audio/italian-019.mp3","audio/italian-020.mp3","audio/italian-021.mp3","audio/italian-022.mp3","audio/italian-023.mp3","audio/italian-024.mp3","audio/italian-025.mp3","audio/italian-026.mp3","audio/italian-027.mp3","audio/italian-028.mp3","audio/italian-029.mp3","audio/italian-030.mp3","audio/italian-031.mp3","audio/italian-032.mp3","audio/italian-033.mp3","audio/italian-034.mp3","audio/italian-035.mp3","audio/italian-036.mp3","audio/italian-037.mp3","audio/italian-038.mp3","audio/italian-039.mp3","audio/italian-040.mp3","audio/italian-041.mp3","audio/italian-042.mp3","audio/italian-043.mp3","audio/italian-044.mp3","audio/italian-045.mp3","audio/italian-046.mp3","audio/italian-047.mp3","audio/italian-048.mp3","audio/italian-049.mp3","audio/italian-050.mp3","audio/italian-051.mp3","audio/italian-052.mp3","audio/italian-053.mp3","audio/italian-054.mp3","audio/italian-055.mp3","audio/italian-056.mp3","audio/italian-057.mp3","audio/italian-058.mp3","audio/italian-059.mp3","audio/italian-060.mp3","audio/italian-061.mp3","audio/italian-062.mp3","audio/italian-063.mp3","audio/italian-064.mp3","audio/italian-065.mp3","audio/italian-066.mp3","audio/italian-067.mp3","audio/italian-068.mp3","audio/italian-069.mp3","audio/italian-070.mp3","audio/italian-071.mp3","audio/italian-072.mp3","audio/italian-073.mp3","audio/italian-074.mp3","audio/italian-075.mp3","audio/italian-076.mp3","audio/italian-077.mp3","audio/italian-078.mp3","audio/italian-079.mp3","audio/italian-080.mp3","audio/italian-081.mp3","audio/italian-082.mp3","audio/italian-083.mp3","audio/italian-084.mp3","audio/italian-085.mp3","audio/italian-086.mp3","audio/italian-087.mp3","audio/italian-088.mp3","audio/italian-089.mp3","audio/italian-090.mp3","audio/italian-091.mp3","audio/italian-092.mp3","audio/italian-093.mp3","audio/italian-094.mp3","audio/italian-095.mp3","audio/italian-096.mp3","audio/italian-097.mp3","audio/italian-098.mp3","audio/italian-099.mp3","audio/italian-100.mp3","audio/italian-101.mp3","audio/italian-102.mp3","dante-togliatti.webp","data.js","icons/icon-192.png","icons/icon-512.png","illustrations.js","index.html","install.js","keyboard.js","manifest.webmanifest","mobile.js","pages/1.webp","pages/10.webp","pages/11.webp","pages/12.webp","pages/13.webp","pages/14.webp","pages/15.webp","pages/16.webp","pages/17.webp","pages/18.webp","pages/19.webp","pages/2.webp","pages/20.webp","pages/21.webp","pages/22.webp","pages/23.webp","pages/24.webp","pages/25.webp","pages/26.webp","pages/27.webp","pages/28.webp","pages/29.webp","pages/3.webp","pages/30.webp","pages/31.webp","pages/32.webp","pages/33.webp","pages/34.webp","pages/35.webp","pages/36.webp","pages/37.webp","pages/38.webp","pages/39.webp","pages/4.webp","pages/40.webp","pages/41.webp","pages/42.webp","pages/43.webp","pages/44.webp","pages/45.webp","pages/46.webp","pages/47.webp","pages/48.webp","pages/49.webp","pages/5.webp","pages/50.webp","pages/51.webp","pages/52.webp","pages/53.webp","pages/54.webp","pages/55.webp","pages/56.webp","pages/57.webp","pages/58.webp","pages/59.webp","pages/6.webp","pages/60.webp","pages/61.webp","pages/62.webp","pages/63.webp","pages/64.webp","pages/65.webp","pages/66.webp","pages/67.webp","pages/68.webp","pages/69.webp","pages/7.webp","pages/70.webp","pages/71.webp","pages/8.webp","pages/9.webp","pages/alphabet.webp","pages/contents.webp","pages/cover.webp","style.css"];
const scope = new URL(self.registration.scope);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets.map(path =>
    new Request(new URL(path,scope),{cache:'reload'})
  ))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(prefix) && name !== cacheName).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function partialResponse(request,response) {
  const range = request.headers.get('range');
  const match = range && /^bytes=(\d+)-(\d*)$/.exec(range);
  if (!match) return response;
  const blob = await response.blob();
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]),blob.size - 1) : blob.size - 1;
  if (start > end) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${blob.size}`}});
  return new Response(blob.slice(start,end + 1),{status:206,headers:{
    'Content-Type':response.headers.get('Content-Type') || 'audio/mpeg',
    'Content-Range':`bytes ${start}-${end}/${blob.size}`,
    'Content-Length':String(end - start + 1),
    'Accept-Ranges':'bytes'
  }});
}

self.addEventListener('fetch', event => {
  const {request} = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (request.mode !== 'navigate' && !assets.includes(url.pathname.slice(scope.pathname.length))) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) return response;
      const cache = await caches.open(cacheName);
      return await fallback(cache,request) || response;
    } catch {
      const cache = await caches.open(cacheName);
      return await fallback(cache,request) || Response.error();
    }
  })());
});

async function fallback(cache,request) {
  if (request.mode === 'navigate') return cache.match(new URL('index.html',scope));
  const cached = await cache.match(request,{ignoreSearch:true});
  return cached && partialResponse(request,cached);
}
