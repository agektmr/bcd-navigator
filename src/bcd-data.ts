import type { BcdData, BcdFeatureNode } from './types.js';

const BCD_CDN_URL = 'https://unpkg.com/@mdn/browser-compat-data';
const DB_NAME = 'bcd-navigator';
const STORE_NAME = 'bcd-cache';
const CACHE_KEY = 'bcd-data';

interface CacheEntry {
  version: string;
  data: BcdData;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCached(): Promise<CacheEntry | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(CACHE_KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function setCache(entry: CacheEntry): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(entry, CACHE_KEY);
  } catch {
    // Cache write failure is non-fatal
  }
}

export async function fetchBcdData(
  onProgress?: (message: string) => void
): Promise<BcdData> {
  onProgress?.('Checking cache...');
  const cached = await getCached();

  if (cached) {
    // Use cache if less than 24 hours old
    const age = Date.now() - cached.timestamp;
    if (age < 24 * 60 * 60 * 1000) {
      onProgress?.('Loaded from cache');
      return cached.data;
    }
  }

  onProgress?.('Fetching BCD data from CDN...');
  const response = await fetch(BCD_CDN_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch BCD data: ${response.status}`);
  }

  const data: BcdData = await response.json();
  onProgress?.('Caching data...');

  await setCache({
    version: data.__meta.version,
    data,
    timestamp: Date.now(),
  });

  onProgress?.('Ready');
  return data;
}

export function buildPathIndex(data: BcdData): string[] {
  const paths: string[] = [];

  function walk(node: BcdFeatureNode, prefix: string) {
    for (const key of Object.keys(node)) {
      if (key === '__compat') continue;
      const child = node[key];
      if (child && typeof child === 'object' && !Array.isArray(child)) {
        const path = prefix ? `${prefix}.${key}` : key;
        paths.push(path);
        walk(child as BcdFeatureNode, path);
      }
    }
  }

  for (const key of Object.keys(data)) {
    if (key === '__meta' || key === 'browsers') continue;
    const category = data[key];
    if (category && typeof category === 'object') {
      paths.push(key);
      walk(category as BcdFeatureNode, key);
    }
  }

  return paths;
}

export function getNodeAtPath(
  data: BcdData,
  path: string
): BcdFeatureNode | null {
  const parts = path.split('.');
  let current: unknown = data;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return (current as BcdFeatureNode) ?? null;
}

export function getChildKeys(node: BcdFeatureNode): string[] {
  return Object.keys(node).filter(
    (key) =>
      key !== '__compat' &&
      node[key] &&
      typeof node[key] === 'object' &&
      !Array.isArray(node[key])
  );
}

export function hasCompat(node: BcdFeatureNode): boolean {
  return '__compat' in node;
}
