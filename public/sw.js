// GraminLink Service Worker - Offline Caching & Resilience for Rural Maharashtra
const APP_SHELL_CACHE = 'graminlink-app-shell-v2';
const MAP_TILES_CACHE = 'graminlink-map-tiles-v2';
const MAX_TILE_CACHE_COUNT = 500;

const STATIC_APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
  '/images/hero-konkan.jpg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap'
];

// Dapoli-Khed-Chiplun corridor key tiles at zoom 9 to 13
function getKonkanTileUrls() {
  const urls = [];
  const subdomains = ['a', 'b', 'c'];
  let subIdx = 0;

  function lon2tile(lon, zoom) {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  }
  function lat2tile(lat, zoom) {
    return Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, zoom)
    );
  }

  // Bounding box for Dapoli-Khed-Chiplun area
  const minLat = 17.48, maxLat = 17.92;
  const minLng = 73.10, maxLng = 73.58;

  for (let z = 9; z <= 13; z++) {
    const xMin = lon2tile(minLng, z);
    const xMax = lon2tile(maxLng, z);
    const yMin = lat2tile(maxLat, z);
    const yMax = lat2tile(minLat, z);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const s = subdomains[subIdx % subdomains.length];
        subIdx++;
        urls.push(`https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`);
      }
    }
  }
  return urls.slice(0, 300); // Well within max 500 limit
}

// Helper to keep cache under MAX_TILE_CACHE_COUNT
async function pruneCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const itemsToDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(itemsToDelete.map((k) => cache.delete(k)));
    }
  } catch (err) {
    console.warn('Prune cache error:', err);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Cache App Shell
      const shellCache = await caches.open(APP_SHELL_CACHE);
      await Promise.allSettled(
        STATIC_APP_SHELL.map((url) =>
          fetch(url, { mode: 'no-cors' }).then((res) => {
            if (res && (res.status === 200 || res.type === 'opaque')) {
              return shellCache.put(url, res);
            }
          })
        )
      );

      // 2. Pre-cache Dapoli-Khed-Chiplun tiles
      const tileCache = await caches.open(MAP_TILES_CACHE);
      const tileUrls = getKonkanTileUrls();
      await Promise.allSettled(
        tileUrls.map((tileUrl) =>
          fetch(tileUrl, { mode: 'cors' }).then((res) => {
            if (res && res.status === 200) {
              return tileCache.put(tileUrl, res);
            }
          })
        )
      );
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== MAP_TILES_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. MAP TILES (OpenStreetMap & Esri)
  const isOsmTile = url.hostname.includes('tile.openstreetmap.org');
  const isEsriTile = url.hostname.includes('arcgisonline.com');

  if (isOsmTile || isEsriTile) {
    // Parse zoom level: e.g. /{z}/{x}/{y}.png
    const zoomMatch = url.pathname.match(/\/(\d+)\/(\d+)\/(\d+)/);
    const zoom = zoomMatch ? parseInt(zoomMatch[1], 10) : 11;

    // We cache zoom levels 9 to 13
    if (zoom >= 9 && zoom <= 13) {
      event.respondWith(
        (async () => {
          const tileCache = await caches.open(MAP_TILES_CACHE);
          const cached = await tileCache.match(event.request);

          // Cache-first: return cached tile if available
          if (cached) {
            // If online, update in background
            if (navigator.onLine) {
              fetch(event.request)
                .then(async (netRes) => {
                  if (netRes && netRes.status === 200) {
                    await tileCache.put(event.request, netRes.clone());
                    pruneCache(MAP_TILES_CACHE, MAX_TILE_CACHE_COUNT);
                  }
                })
                .catch(() => {});
            }
            return cached;
          }

          // If not cached, attempt network fetch when online
          try {
            const netRes = await fetch(event.request);
            if (netRes && netRes.status === 200) {
              await tileCache.put(event.request, netRes.clone());
              pruneCache(MAP_TILES_CACHE, MAX_TILE_CACHE_COUNT);
            }
            return netRes;
          } catch (err) {
            // Offline and no cached tile
            return new Response(null, { status: 404, statusText: 'Tile Not Cached' });
          }
        })()
      );
      return;
    } else {
      // Zoom levels outside 9-13: if offline, do not serve uncached tiles
      event.respondWith(
        fetch(event.request).catch(async () => {
          const tileCache = await caches.open(MAP_TILES_CACHE);
          const cached = await tileCache.match(event.request);
          return cached || new Response(null, { status: 404 });
        })
      );
      return;
    }
  }

  // 2. APP SHELL & STATIC ASSETS (HTML, JS, CSS, fonts, SVG icons)
  event.respondWith(
    (async () => {
      const shellCache = await caches.open(APP_SHELL_CACHE);
      const cached = await shellCache.match(event.request);

      if (cached) {
        // Stale-while-revalidate for freshness
        if (navigator.onLine) {
          fetch(event.request)
            .then((res) => {
              if (res && res.status === 200) {
                shellCache.put(event.request, res);
              }
            })
            .catch(() => {});
        }
        return cached;
      }

      try {
        const netRes = await fetch(event.request);
        if (netRes && (netRes.status === 200 || netRes.type === 'opaque')) {
          // Cache fonts, scripts, styles, assets
          const dest = event.request.destination;
          const isAppAsset =
            dest === 'script' ||
            dest === 'style' ||
            dest === 'font' ||
            dest === 'image' ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.json') ||
            url.hostname.includes('fonts.googleapis.com') ||
            url.hostname.includes('fonts.gstatic.com') ||
            url.hostname.includes('unpkg.com');

          if (isAppAsset) {
            shellCache.put(event.request, netRes.clone());
          }
        }
        return netRes;
      } catch (err) {
        // If offline and navigating to page, return cached index.html or root
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          const indexHtml = (await shellCache.match('/index.html')) || (await shellCache.match('/'));
          if (indexHtml) return indexHtml;
        }
        return cached || new Response('Offline - asset not cached', { status: 503 });
      }
    })()
  );
});
