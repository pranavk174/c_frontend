// ============================================================
// SERVICE WORKER - API Caching Fallback
// ============================================================

// ---- CONFIGURATION -----------------------------------------
const API_CACHE_NAME = "whatsapp-api-cache-v1";
const STATIC_CACHE_NAME = "whatsapp-static-cache-v1";
const OFFLINE_URL = "/offline.html";
const MAX_API_CACHE_SIZE = 50;
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB

const GRAPHQL_PATTERN = /\/graphql/i;
const API_PATTERNS = [/\/api\//i, /\/graphql/i];
const STATIC_PATTERNS = [
  /\.js$/i,
  /\.css$/i,
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.gif$/i,
  /\.svg$/i,
  /\.ico$/i,
  /\.woff2?$/i,
  /\.ttf$/i,
  /\.webp$/i,
];

// ---- HELPERS -----------------------------------------------
async function openCache(name) {
  return caches.open(name);
}

async function hashBody(body) {
  const data = new TextEncoder().encode(body);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Cache key is always a plain string (URL or URL+hash)
async function getCacheKey(request) {
  if (request.method === "POST") {
    try {
      const body = await request.clone().text();
      const hash = await hashBody(body);
      return `${request.url}__${hash}`;
    } catch {
      return request.url;
    }
  }
  return request.url;
}

function isGraphQL(url) {
  return GRAPHQL_PATTERN.test(url);
}

function isAPIRequest(url) {
  return API_PATTERNS.some((p) => p.test(url));
}

function isStaticAsset(url) {
  try {
    const pathname = new URL(url).pathname;
    return STATIC_PATTERNS.some((p) => p.test(pathname));
  } catch {
    return false;
  }
}

// Store response in cache using a plain string key
async function storeInCache(cacheKey, response) {
  try {
    const size = response.headers.get("content-length");
    if (size && parseInt(size, 10) > MAX_RESPONSE_SIZE) {
      console.warn("[SW] Skipping cache — response too large:", cacheKey);
      return;
    }

    const cache = await openCache(API_CACHE_NAME);

    // Enforce size limit
    const keys = await cache.keys();
    if (keys.length >= MAX_API_CACHE_SIZE) {
      // Delete oldest entry (first key = oldest in insertion order)
      await cache.delete(keys[0]);
    }

    // Add timestamp header before storing
    const headers = new Headers(response.headers);
    headers.set("X-Cached-At", String(Date.now()));
    headers.set("X-From-Cache", "true");

    const cloned = new Response(await response.clone().arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

    // Use a synthetic GET Request as the cache key
    await cache.put(new Request(cacheKey, { method: "GET" }), cloned);
  } catch (err) {
    console.warn("[SW] Failed to cache response:", err);
  }
}

// Retrieve from cache using plain string key
async function getFromCache(cacheKey) {
  const cache = await openCache(API_CACHE_NAME);
  return cache.match(new Request(cacheKey, { method: "GET" }));
}

// Check if GraphQL response has errors (don't cache error responses)
async function graphqlHasErrors(response) {
  try {
    const body = await response.clone().json();
    return !!(body && body.errors && body.errors.length > 0);
  } catch {
    return false;
  }
}

// ---- NETWORK-FIRST FOR API ---------------------------------
async function handleAPIRequest(request) {
  // Pre-compute cache key before the request is consumed
  const cacheKey = await getCacheKey(request);

  try {
    const networkResponse = await fetch(request.clone());

    // If GraphQL returned errors, skip caching but still return response
    if (isGraphQL(request.url) && networkResponse.ok) {
      if (await graphqlHasErrors(networkResponse)) {
        return networkResponse;
      }
    }

    // Cache successful responses (async, don't block)
    if (networkResponse.ok) {
      storeInCache(cacheKey, networkResponse.clone());
    }

    return networkResponse;
  } catch (networkError) {
    console.log("[SW] Network failed, checking cache for:", cacheKey);

    const cached = await getFromCache(cacheKey);

    if (cached) {
      console.log("[SW] Serving from cache:", cacheKey);
      return cached;
    }

    console.warn("[SW] No cache available for:", cacheKey);
    return new Response(
      JSON.stringify({
        error: "Service Unavailable",
        message: "Backend is unreachable and no cached data is available.",
        offline: true,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// ---- CACHE-FIRST FOR STATIC ASSETS -------------------------
async function handleStaticRequest(request) {
  const cache = await openCache(STATIC_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

// ---- SERVICE WORKER LIFECYCLE ------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      openCache(STATIC_CACHE_NAME).then((c) =>
        c.addAll([OFFLINE_URL, "/favicon.ico"]),
      ),
      openCache(API_CACHE_NAME),
    ]),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const CURRENT = [API_CACHE_NAME, STATIC_CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !CURRENT.includes(k)).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ---- FETCH INTERCEPTOR -------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-http requests (chrome-extension://, etc.)
  if (!url.startsWith("http")) return;

  if (isGraphQL(url) || isAPIRequest(url)) {
    // API: network-first with cache fallback
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(url)) {
    // Static: cache-first
    event.respondWith(handleStaticRequest(request));
  } else if (request.mode === "navigate") {
    // Page navigation: network with offline fallback
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await openCache(STATIC_CACHE_NAME);
        const offline = await cache.match(OFFLINE_URL);
        return offline || new Response("Offline", { status: 503 });
      }),
    );
  }
  // Everything else: browser handles normally
});

// ---- MANUAL CACHE CLEAR ------------------------------------
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_API_CACHE") {
    event.waitUntil(
      caches
        .delete(API_CACHE_NAME)
        .then(() => openCache(API_CACHE_NAME))
        .then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        }),
    );
  }
});
