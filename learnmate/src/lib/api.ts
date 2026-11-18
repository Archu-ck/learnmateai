export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  mustChangePassword?: boolean;
}

interface CacheEntry<T = any> {
  data: T;
  expiry: number;
  timestamp: number;
}

const DEFAULT_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
const CACHE_PREFIX = "lm_cache_v1:";

// In-memory cache for ultra-fast 0ms synchronous lookups
const memoryCache = new Map<string, CacheEntry>();

// Deduplicate in-flight requests so concurrent calls share the exact same network roundtrip
const inFlightRequests = new Map<string, Promise<any>>();

const isBrowser = typeof window !== "undefined";

function getFromSession<T = any>(key: string): CacheEntry<T> | null {
  if (!isBrowser) return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiry) {
      window.sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function saveToSession(key: string, entry: CacheEntry): void {
  if (!isBrowser) return;
  try {
    window.sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota exceeded or storage unavailable; memoryCache still holds it
  }
}

function removeFromSession(key: string): void {
  if (!isBrowser) return;
  try {
    window.sessionStorage.removeItem(CACHE_PREFIX + key);
  } catch {}
}

export function getCached<T = any>(url: string): T | null {
  // 1. Check in-memory map
  const mem = memoryCache.get(url);
  if (mem) {
    if (Date.now() <= mem.expiry) {
      return mem.data as T;
    }
    memoryCache.delete(url);
    removeFromSession(url);
    return null;
  }

  // 2. Check session storage (e.g. after soft reload or tab switch)
  const session = getFromSession<T>(url);
  if (session) {
    memoryCache.set(url, session);
    return session.data;
  }

  return null;
}

export function setCached<T = any>(url: string, data: T, ttlMs = DEFAULT_CACHE_TTL_MS): void {
  const entry: CacheEntry<T> = {
    data,
    expiry: Date.now() + ttlMs,
    timestamp: Date.now(),
  };
  memoryCache.set(url, entry);
  saveToSession(url, entry);
}

export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    clearAllCache();
    return;
  }

  // Remove matching from memoryCache
  for (const key of Array.from(memoryCache.keys())) {
    const matches = typeof pattern === "string" ? key.includes(pattern) : pattern.test(key);
    if (matches) {
      memoryCache.delete(key);
      removeFromSession(key);
    }
  }

  // Clean session storage as well
  if (isBrowser) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          const rawKey = k.replace(CACHE_PREFIX, "");
          const matches = typeof pattern === "string" ? rawKey.includes(pattern) : pattern.test(rawKey);
          if (matches) keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {}
  }
}

export function clearAllCache(): void {
  memoryCache.clear();
  inFlightRequests.clear();
  if (isBrowser) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {}
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type");
  let data: any = {};
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = { message: await res.text() };
  }

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    const error: any = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    error.mustChangePassword = data.mustChangePassword;
    throw error;
  }

  return data as T;
}

// Automatically invalidate related endpoints when mutations occur
function autoInvalidateOnMutation(endpoint: string) {
  if (endpoint.includes("/assignments") || endpoint.includes("/submissions")) {
    invalidateCache("assignments");
    invalidateCache("dashboard");
    invalidateCache("progress");
  } else if (endpoint.includes("/tests")) {
    invalidateCache("tests");
    invalidateCache("dashboard");
    invalidateCache("progress");
  } else if (endpoint.includes("/attendance")) {
    invalidateCache("attendance");
    invalidateCache("dashboard");
  } else if (endpoint.includes("/planner")) {
    invalidateCache("planner");
    invalidateCache("dashboard");
  } else if (endpoint.includes("/users") || endpoint.includes("/classes") || endpoint.includes("/subjects")) {
    invalidateCache("users");
    invalidateCache("classes");
    invalidateCache("subjects");
    invalidateCache("dashboard");
  } else {
    // Invalidate dashboard by default on any other write
    invalidateCache("dashboard");
  }
}

export const api = {
  getCached,
  setCached,
  invalidate: invalidateCache,
  clearCache: clearAllCache,

  get: async <T = any>(
    url: string,
    headers?: Record<string, string>,
    options?: { bypassCache?: boolean; ttl?: number }
  ): Promise<T> => {
    // 1. Return cached if available and fresh
    if (!options?.bypassCache) {
      const cached = getCached<T>(url);
      if (cached !== null) {
        return cached;
      }
    }

    // 2. In-flight request deduplication
    if (inFlightRequests.has(url)) {
      return inFlightRequests.get(url) as Promise<T>;
    }

    // 3. Initiate network request
    const requestPromise = (async () => {
      try {
        const data = await apiFetch<T>(url, { method: "GET", headers });
        setCached(url, data, options?.ttl);
        return data;
      } finally {
        inFlightRequests.delete(url);
      }
    })();

    inFlightRequests.set(url, requestPromise);
    return requestPromise;
  },

  /**
   * Prefetches one or more URLs silently in the background.
   * Never throws or interrupts user actions.
   */
  prefetch: async (urls: string | string[], options?: { ttl?: number }): Promise<void> => {
    const list = Array.isArray(urls) ? urls : [urls];
    if (list.length === 0) return;

    const uncached = list.filter((url) => getCached(url) === null && !inFlightRequests.has(url));
    if (uncached.length === 0) return;

    // Prefetch in parallel with Promise.allSettled
    await Promise.allSettled(
      uncached.map((url) =>
        api.get(url, undefined, { bypassCache: false, ttl: options?.ttl }).catch(() => {
          // Silent catch - prefetch should never bubble errors
        })
      )
    );
  },

  post: async <T = any>(url: string, body?: any, headers?: Record<string, string>) => {
    const res = await apiFetch<T>(url, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    });
    autoInvalidateOnMutation(url);
    return res;
  },

  patch: async <T = any>(url: string, body?: any, headers?: Record<string, string>) => {
    const res = await apiFetch<T>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers,
    });
    autoInvalidateOnMutation(url);
    return res;
  },

  put: async <T = any>(url: string, body?: any, headers?: Record<string, string>) => {
    const res = await apiFetch<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
      headers,
    });
    autoInvalidateOnMutation(url);
    return res;
  },

  delete: async <T = any>(url: string, headers?: Record<string, string>) => {
    const res = await apiFetch<T>(url, { method: "DELETE", headers });
    autoInvalidateOnMutation(url);
    return res;
  },
};
