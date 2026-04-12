/**
 * Client-side loader + lookup for the Baseline data produced at build time by
 * `scripts/build-web-features-map.mjs`.
 *
 * Two artifacts are fetched:
 *   /bcd-map.json          — BCD key -> feature_id
 *   /feature-statuses.json — feature_id -> FeatureStatus
 */

export type BaselineStatus = 'widely' | 'newly' | 'limited';

export interface FeatureStatus {
  status: BaselineStatus;
  name: string;
  low_date?: string;
  high_date?: string;
}

export interface WebFeaturesIndex {
  bcdToId: Readonly<Record<string, string>>;
  idToStatus: Readonly<Record<string, FeatureStatus>>;
}

let loadPromise: Promise<WebFeaturesIndex> | null = null;

/**
 * Fetch (and cache in-memory) the two JSON artifacts. Safe to call many times
 * from different components — only one network round-trip is made.
 */
export function loadWebFeatures(): Promise<WebFeaturesIndex> {
  if (!loadPromise) {
    const base = document.baseURI;
    loadPromise = Promise.all([
      fetch(new URL('bcd-map.json', base).toString()).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`bcd-map.json ${r.status}`))
      ),
      fetch(new URL('feature-statuses.json', base).toString()).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`feature-statuses.json ${r.status}`))
      ),
    ])
      .then(([bcdToId, idToStatus]) => ({ bcdToId, idToStatus }))
      .catch((err) => {
        // Never fatal: the Baseline badge is auxiliary. Reset so the next
        // caller can retry if desired, and surface an empty index.
        loadPromise = null;
        console.warn('Failed to load web-features artifacts:', err);
        return { bcdToId: {}, idToStatus: {} };
      });
  }
  return loadPromise;
}

/**
 * Resolve the Baseline status of a BCD key.
 *
 * Implements the Step-3 recursive fallback: if `bcdKey` is not directly listed
 * in `bcd-map.json`, drop the trailing dotted segment and retry, inheriting
 * the closest ancestor's status (e.g. `api.A.B.C` -> `api.A.B` -> `api.A`).
 *
 * Returns `null` when no ancestor resolves.
 */
export function getBaselineStatus(
  index: WebFeaturesIndex,
  bcdKey: string
): (FeatureStatus & { featureId: string; matchedKey: string }) | null {
  let key = bcdKey;
  while (key.length > 0) {
    const featureId = index.bcdToId[key];
    if (featureId) {
      const status = index.idToStatus[featureId];
      if (status) {
        return { ...status, featureId, matchedKey: key };
      }
    }
    const idx = key.lastIndexOf('.');
    if (idx < 0) break;
    key = key.slice(0, idx);
  }
  return null;
}
