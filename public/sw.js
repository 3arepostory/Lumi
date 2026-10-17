// Only the public application shell is cached. No Matrix requests or media.
const CACHE = 'lumi-shell-v3';
self.addEventListener('install', e => { e.waitUntil((async()=>{const c=await caches.open(CACHE);const response=await fetch('/');if(!response.ok)throw Error('Shell unavailable');const html=await response.clone().text();await c.put('/',response);const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"<>]+)"/g)].map(m=>m[1]);await c.addAll(['/lumi.svg','/lumi-192.png','/lumi-512.png','/manifest.webmanifest',...assets]);})()); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin || e.request.method !== 'GET' || !(u.pathname === '/' || u.pathname.startsWith('/assets/') || u.pathname === '/lumi.svg')) return;
  e.respondWith(fetch(e.request).then(r => { if(r.ok) { const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); } return r; }).catch(()=>caches.match(e.request)));
});
