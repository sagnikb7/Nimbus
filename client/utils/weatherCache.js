const CACHE_KEY = 'weatherCache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(cache) {
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

// Returns { data, ts, fresh } or null
export function getCached(city) {
  const entry = readAll()[city];
  if (!entry) return null;
  return {
    data: entry.data,
    ts: entry.ts,
    fresh: Date.now() - entry.ts < CACHE_TTL,
  };
}

export function setCache(city, data) {
  const cache = readAll();
  cache[city] = { data, ts: Date.now() };
  writeAll(cache);
}

export function removeCache(city) {
  const cache = readAll();
  delete cache[city];
  writeAll(cache);
}

// Split saved cities into three buckets for the mount effect:
//   cached  — all cities with ANY cached data (fresh or stale), for instant display
//   toFetch — cities whose data is stale or missing, need background API calls
export function partitionCities(cities) {
  const cache = readAll();
  const now = Date.now();
  const cached = {};
  const toFetch = [];

  for (const city of cities) {
    const entry = cache[city];
    if (entry) {
      cached[city] = entry.data;
      // Stale entries still need a background refresh
      if (now - entry.ts >= CACHE_TTL) toFetch.push(city);
    } else {
      toFetch.push(city);
    }
  }

  return { cached, toFetch };
}
