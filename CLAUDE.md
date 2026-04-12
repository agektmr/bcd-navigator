# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

BCD Navigator is a client-only static web app for browsing
[MDN Browser Compat Data](https://github.com/mdn/browser-compat-data). It is
built with **Lit** web components, **TypeScript**, and **Vite**. There is no
backend — the full BCD dataset is fetched from the unpkg CDN at runtime and
cached in IndexedDB.

## Commands

- `npm run dev` — Vite dev server with HMR.
- `npm run build` — `tsc` (type check, `noEmit`) then `vite build` into `dist/`.
- `npm run preview` — serve the production build.

There is no test runner and no linter configured. After non-trivial changes,
run `npm run build` to confirm both the type check and bundle succeed.

## Architecture

Single-page app rendered inside `<bcd-app>` (mounted from `index.html`).

Data flow:
1. `bcd-app` calls `fetchBcdData()` (`src/bcd-data.ts`). That function checks
   an IndexedDB cache (`bcd-navigator` DB, `bcd-cache` store, key `bcd-data`).
   Cache entries fresher than 24 h are reused; otherwise it fetches the full
   JSON from `https://unpkg.com/@mdn/browser-compat-data` and rewrites the
   cache.
2. `buildPathIndex()` walks the tree once and produces a flat list of dotted
   paths (e.g. `api.fetch`, `css.properties.grid-template-columns`) used by
   the search box.
3. `bcd-app` tracks state: the loaded `BcdData`, the `_selectedPath`, the set
   of `_expandedNodes`, and mirrors `_selectedPath` into `location.hash` so
   deep-links and the back button work.

Component tree:
- `bcd-app` — shell + state owner. Listens for `hashchange` to restore the
  selected path, expanding ancestors along the way.
- `bcd-search` — debounced (150 ms) fuzzy search over the path index with
  arrow/enter/escape keyboard nav. Dispatches `search-select`.
- `bcd-tree` → `bcd-tree-node` (recursive) — sidebar navigator. Tree nodes
  dispatch `feature-select` (select a path) and `toggle-expand` (expand/
  collapse).
- `bcd-detail` — per-feature view: status badges, MDN/spec links, per-browser
  support matrix. Emits `navigate` for internal links (e.g. breadcrumb).
- `bcd-breadcrumb` — path breadcrumb used inside the detail view.
- `styles.ts` — shared CSS custom properties (`theme`). All components pull
  `theme` into their `static styles` array.
- `types.ts` — TypeScript types for BCD plus `MAJOR_BROWSERS`,
  `BROWSER_DISPLAY_NAMES`, `BROWSER_LOGO_URLS`, and `TOP_LEVEL_CATEGORIES`.

## Conventions

- **Lit + decorators.** `useDefineForClassFields: false` and
  `experimentalDecorators: true` are set in `tsconfig.json`. Use
  `@customElement`, `@property`, `@state` from `lit/decorators.js`.
- **ESM imports with `.js` extensions** (e.g. `import './bcd-app.js'`) even
  though the source files are `.ts`. This matches the existing style and the
  bundler/TS resolution setup — keep it when adding files.
- **Events bubble + compose.** Child components dispatch `CustomEvent`s with
  `bubbles: true, composed: true` so `bcd-app` can listen at the top.
- **Theme via CSS custom properties.** Don't hard-code colors; add or reuse
  variables in `src/styles.ts` and reference them as `var(--…)`.
- **Strict TypeScript.** The project is `strict: true`. Preserve existing
  typing (e.g. `BcdFeatureNode`, `BcdCompat`) rather than reaching for `any`.
- No emojis in source or docs unless the user asks.

## Adding a new component

1. Create `src/bcd-<name>.ts`.
2. Decorate with `@customElement('bcd-<name>')` and extend `LitElement`.
3. Import and include `theme` in `static styles = [theme, css`…`]`.
4. Import the module (side-effect) from whichever parent renders it, using a
   `.js` extension.

## Gotchas

- The app expects the BCD JSON shape described in `src/types.ts`. Top-level
  keys walked by `buildPathIndex` exclude `__meta` and `browsers`; category
  walking skips `__compat` nodes (those are leaf metadata, not children).
- The 24-hour IndexedDB cache means stale data can mask changes during
  development — bump the cache key or clear site data if you need a fresh
  fetch.
- `getChildKeys` treats arrays as non-children; don't store arrays as child
  feature nodes.
- `bcd-app` writes the hash with `history.replaceState` to avoid flooding
  history; the `hashchange` listener exists for external navigation (back/
  forward, typed URLs).
