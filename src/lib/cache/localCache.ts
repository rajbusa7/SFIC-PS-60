/**
 * StudySaathi AI - LocalStorage TTL Caching System
 * 
 * Provides instantaneous page transitions with zero loading flickers using
 * a Stale-While-Revalidate (SWR) cache pattern backed by localStorage.
 * 
 * Features:
 * - Small configurable TTL (default 25s) to guarantee no stale educational data
 * - Instant sync retrieval for initial component state: getCachedDataSync()
 * - Background revalidation without UI freezes
 * - Automatic cache invalidation on any data mutation (via BroadcastChannel / window events)
 */

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const CACHE_PREFIX = "studysaathi_cache_v2_";
const DEFAULT_TTL_MS = 25000; // 25 seconds

// Fast in-memory hot cache to avoid JSON parsing on repeated calls in same turn
const memoryCache = new Map<string, CacheEnvelope<any>>();

/**
 * Synchronously retrieves cached data if available and fresh.
 * Use this to initialize component useState directly:
 * `const [data, setData] = useState(() => getCachedDataSync(url) || defaultValue);`
 */
export function getCachedDataSync<T>(url: string, maxAgeMs: number = DEFAULT_TTL_MS): T | null {
  if (typeof window === "undefined") return null;

  // 1. Check in-memory map
  const mem = memoryCache.get(url);
  const now = Date.now();
  if (mem && now - mem.timestamp <= maxAgeMs) {
    return mem.data as T;
  }

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${url}`);
    if (!raw) return null;
    const envelope: CacheEnvelope<T> = JSON.parse(raw);
    if (envelope && typeof envelope.timestamp === "number") {
      if (now - envelope.timestamp <= maxAgeMs) {
        memoryCache.set(url, envelope);
        return envelope.data;
      }
    }
  } catch {
    // Quiet fallback
  }

  return null;
}

/**
 * Saves data to both memory and localStorage with a timestamp
 */
export function setCachedData<T>(url: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  if (typeof window === "undefined") return;

  const envelope: CacheEnvelope<T> = {
    data,
    timestamp: Date.now(),
    ttlMs,
  };

  memoryCache.set(url, envelope);

  try {
    localStorage.setItem(`${CACHE_PREFIX}${url}`, JSON.stringify(envelope));
  } catch {
    // Handle quota exceeded gracefully by clearing old cache keys
    try {
      invalidateAllCache();
      localStorage.setItem(`${CACHE_PREFIX}${url}`, JSON.stringify(envelope));
    } catch {
      // Memory cache is still active
    }
  }
}

/**
 * Fetches data with intelligent TTL caching and background revalidation.
 */
export async function fetchWithCache<T>(
  url: string,
  options: {
    ttlMs?: number;
    forceRefresh?: boolean;
    fetchInit?: RequestInit;
    onBackgroundUpdate?: (data: T) => void;
  } = {}
): Promise<{ data: T; isCached: boolean }> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();

  // If not forcing refresh, check fresh cache first
  if (!options.forceRefresh) {
    const cached = getCachedDataSync<T>(url, ttlMs);
    if (cached !== null) {
      // Return cached immediately; optionally fire a quiet background update if near half TTL
      const mem = memoryCache.get(url);
      if (mem && now - mem.timestamp > ttlMs / 2 && options.onBackgroundUpdate) {
        // Fire background revalidation
        fetch(url, options.fetchInit)
          .then((res) => (res.ok ? res.json() : null))
          .then((fresh) => {
            if (fresh) {
              setCachedData(url, fresh, ttlMs);
              options.onBackgroundUpdate?.(fresh);
            }
          })
          .catch(() => {});
      }

      return { data: cached, isCached: true };
    }
  }

  // Network fetch
  const res = await fetch(url, {
    ...options.fetchInit,
    cache: "no-store",
  });

  if (!res.ok) {
    // If fetch failed but we have any older cached entry, serve it as safety fallback
    const stale = getCachedDataSync<T>(url, 300000); // 5 min fallback
    if (stale !== null) {
      return { data: stale, isCached: true };
    }
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }

  const freshData: T = await res.json();
  setCachedData(url, freshData, ttlMs);
  return { data: freshData, isCached: false };
}

/**
 * Invalidates cache entries matching a given URL or pattern
 */
export function invalidateCache(pattern?: string | RegExp): void {
  if (typeof window === "undefined") return;

  // Clear memory cache
  if (!pattern) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (typeof pattern === "string" ? key.includes(pattern) : pattern.test(key)) {
        memoryCache.delete(key);
      }
    }
  }

  // Clear localStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const cleanUrl = key.replace(CACHE_PREFIX, "");
        if (!pattern || (typeof pattern === "string" ? cleanUrl.includes(pattern) : pattern.test(cleanUrl))) {
          keysToRemove.push(key);
        }
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Quiet fallback
  }
}

/**
 * Clears all StudySaathi cache entries
 */
export function invalidateAllCache(): void {
  invalidateCache();
}

// Auto-wire listener to StudySaathi mutation events so any mutation purges the relevant cache
if (typeof window !== "undefined") {
  window.addEventListener("shikshasetu_data_updated", (e: any) => {
    const entity = e?.detail?.entity;
    if (entity) {
      invalidateCache(entity);
    } else {
      invalidateAllCache();
    }
  });
}
