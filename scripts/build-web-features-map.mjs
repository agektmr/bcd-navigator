#!/usr/bin/env node
/**
 * Build-time script that turns the `web-features` dataset into two optimized
 * JSON artifacts consumed by the browser:
 *
 *   public/bcd-map.json         — BCD key -> web-features feature_id
 *   public/feature-statuses.json — feature_id -> { status, low_date?, high_date?, name }
 *
 * The output is minified (no whitespace) to save bandwidth on the frontend.
 *
 * Notes on inheritance:
 *   A BCD key such as `api.Window.indexedDB` may be the only key listed in
 *   web-features, while the frontend is asked about `api.Window.indexedDB.foo`.
 *   We keep bcd-map.json compact by only emitting the keys that web-features
 *   explicitly lists; the frontend walks parent paths as a fallback (see
 *   `src/web-features.ts`). As an additional optimization we omit a child
 *   entry when its parent already maps to the same feature_id — the fallback
 *   lookup produces the same answer.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { features } from 'web-features';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');
mkdirSync(publicDir, { recursive: true });

/**
 * Translate the tri-state `baseline` value from web-features into the short
 * label the UI renders.
 *   "high"  -> "widely"   (Baseline: Widely available)
 *   "low"   -> "newly"    (Baseline: Newly available)
 *   false   -> "limited"  (Limited availability)
 */
function statusLabel(baseline) {
  if (baseline === 'high') return 'widely';
  if (baseline === 'low') return 'newly';
  return 'limited';
}

/** @type {Record<string, string>} */
const bcdToId = {};
/** @type {Record<string, {status: string, low_date?: string, high_date?: string, name: string}>} */
const idToStatus = {};

let featureCount = 0;
let compatKeyCount = 0;

for (const [featureId, feature] of Object.entries(features)) {
  // Skip `moved`/`split` redirect entries — they have no status of their own.
  if (feature.kind !== 'feature') continue;
  featureCount++;

  const status = feature.status;
  const entry = {
    status: statusLabel(status?.baseline),
    name: feature.name,
  };
  if (status?.baseline_low_date) entry.low_date = status.baseline_low_date;
  if (status?.baseline_high_date) entry.high_date = status.baseline_high_date;
  idToStatus[featureId] = entry;

  const compat = feature.compat_features ?? [];
  for (const key of compat) {
    bcdToId[key] = featureId;
    compatKeyCount++;
  }
}

// Inheritance flattening: drop redundant child entries when the parent BCD key
// already points at the same feature_id. The frontend's parent-walk fallback
// recovers the identical answer, and this shrinks the payload noticeably.
const sortedKeys = Object.keys(bcdToId).sort();
/** @type {Record<string, string>} */
const compactedBcdToId = {};
for (const key of sortedKeys) {
  const featureId = bcdToId[key];
  let parent = key;
  let redundant = false;
  while (true) {
    const idx = parent.lastIndexOf('.');
    if (idx < 0) break;
    parent = parent.slice(0, idx);
    if (Object.prototype.hasOwnProperty.call(bcdToId, parent)) {
      redundant = bcdToId[parent] === featureId;
      break;
    }
  }
  if (!redundant) compactedBcdToId[key] = featureId;
}

const bcdMapPath = resolve(publicDir, 'bcd-map.json');
const statusesPath = resolve(publicDir, 'feature-statuses.json');

writeFileSync(bcdMapPath, JSON.stringify(compactedBcdToId));
writeFileSync(statusesPath, JSON.stringify(idToStatus));

const bcdSize = JSON.stringify(compactedBcdToId).length;
const statusSize = JSON.stringify(idToStatus).length;
console.log(
  `web-features build: ${featureCount} features, ` +
    `${Object.keys(compactedBcdToId).length}/${compatKeyCount} BCD keys ` +
    `(${(bcdSize / 1024).toFixed(1)} KB bcd-map, ` +
    `${(statusSize / 1024).toFixed(1)} KB statuses)`
);
