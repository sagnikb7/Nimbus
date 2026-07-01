const CACHE_KEY = 'weatherCache';
const ALIAS_KEY = 'weatherAlias';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Stable identity for a place, derived from a weather response's `location`.
// Two same-named cities (e.g. multiple "Gopalpur"s) differ by region/country,
// so they no longer collide in the cache or the saved-cities list.
export function getLocationKey(location) {
  if (!location) return '';
  return [location.name, location.region, location.country]
    .map((p) => (p || '').trim().toLowerCase())
    .join('|');
}

function normalizeQuery(q) {
  return String(q ?? '').trim().toLowerCase();
}

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Quota exceeded — prune stale entries and retry once
    const now = Date.now();
    const pruned = {};
    for (const [key, entry] of Object.entries(cache)) {
      if (now - entry.ts < CACHE_TTL) pruned[key] = entry;
    }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(pruned));
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }
}

function writeAlias(alias) {
  try {
    localStorage.setItem(ALIAS_KEY, JSON.stringify(alias));
  } catch {
    localStorage.removeItem(ALIAS_KEY);
  }
}

// Returns { data, ts, fresh } or null — looked up by location key. When
// `provider` is given, a cache entry from a DIFFERENT provider is treated as a
// miss, so we never serve another provider's data (single-source integrity).
export function getCached(key, provider) {
  if (!key) return null;
  const entry = readJSON(CACHE_KEY)[key];
  if (!entry) return null;
  if (provider && entry.data?.provider !== provider) return null;
  return {
    data: entry.data,
    ts: entry.ts,
    fresh: Date.now() - entry.ts < CACHE_TTL,
  };
}

// Resolve a raw search query (city name or "lat,lon") to its cached entry via
// the query→key alias recorded on the last successful fetch. Lets repeat
// searches hit the cache even though we can't know the location key up front.
export function getCachedByQuery(query, provider) {
  const key = readJSON(ALIAS_KEY)[normalizeQuery(query)];
  return key ? getCached(key, provider) : null;
}

// Store a weather response. The cache key is derived from the response's
// location; `query` (optional) records the search term that produced it so
// future getCachedByQuery() calls resolve. Returns the location key.
export function setCache(data, query) {
  const key = getLocationKey(data?.location);
  if (!key) return key;

  const cache = readJSON(CACHE_KEY);
  cache[key] = { data, ts: Date.now() };
  writeCache(cache);

  if (query != null) {
    const alias = readJSON(ALIAS_KEY);
    alias[normalizeQuery(query)] = key;
    writeAlias(alias);
  }
  return key;
}

export function removeCache(key) {
  if (!key) return;
  const cache = readJSON(CACHE_KEY);
  delete cache[key];
  writeCache(cache);

  // Drop any aliases pointing at this key
  const alias = readJSON(ALIAS_KEY);
  let changed = false;
  for (const [q, k] of Object.entries(alias)) {
    if (k === key) {
      delete alias[q];
      changed = true;
    }
  }
  if (changed) writeAlias(alias);
}

// Split saved cities (objects carrying a `key`) into two buckets for the mount
// effect:
//   cached  — { key: data } for cities with ANY cached data, for instant display
//   toFetch — saved-city objects whose data is stale/missing, or that are
//             unresolved legacy entries (no key yet), needing a fetch
export function partitionCities(cities, provider) {
  const cache = readJSON(CACHE_KEY);
  const now = Date.now();
  const cached = {};
  const toFetch = [];

  for (const c of cities) {
    const entry = c.key ? cache[c.key] : null;
    // Only serve a cached entry when it came from the active provider — a
    // mismatch (or missing) entry is refetched instead of shown cross-provider.
    const match = entry && (!provider || entry.data?.provider === provider);
    if (match) {
      cached[c.key] = entry.data;
      if (now - entry.ts >= CACHE_TTL) toFetch.push(c);
    } else {
      toFetch.push(c);
    }
  }

  return { cached, toFetch };
}
