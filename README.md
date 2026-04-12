# BCD Navigator

A fast, browser-based viewer for [MDN Browser Compat Data](https://github.com/mdn/browser-compat-data). Browse the full BCD tree (API, CSS, HTML, HTTP, JavaScript, SVG, MathML, WebAssembly, WebDriver, WebExtensions), search for features, and inspect per-browser support details — all client-side.

## Features

- **Tree navigation** — expand/collapse the full BCD hierarchy in a sidebar.
- **Fast search** — fuzzy search across every feature path with keyboard navigation.
- **Detail view** — per-browser support matrix, status badges (standard/experimental/deprecated), MDN and spec links.
- **Deep linking** — the selected feature path is reflected in the URL hash, so any view can be shared.
- **Offline-friendly caching** — the full BCD payload is fetched from the CDN once per 24 hours and stored in IndexedDB.
- **No backend** — pure static site; everything runs in the browser.

## Tech stack

- [Lit](https://lit.dev/) web components
- TypeScript (strict mode, decorators enabled)
- [Vite](https://vitejs.dev/) for dev server and build
- [`@mdn/browser-compat-data`](https://www.npmjs.com/package/@mdn/browser-compat-data) fetched from the unpkg CDN at runtime

## Getting started

### Prerequisites

- Node.js (recent LTS)
- npm

### Install

```bash
npm install
```

### Develop

```bash
npm run dev
```

Starts the Vite dev server with hot module replacement.

### Build

```bash
npm run build
```

Runs `tsc` for type checking and produces a static bundle in `dist/`.

### Preview

```bash
npm run preview
```

Serves the production build locally.

## Project layout

```
src/
  index.ts           Entry point; registers <bcd-app>
  bcd-app.ts         Top-level shell: header, sidebar, detail, routing via URL hash
  bcd-data.ts        BCD fetch + IndexedDB cache + path-index helpers
  bcd-search.ts      Search box with scored fuzzy matching and keyboard nav
  bcd-tree.ts        Sidebar tree root
  bcd-tree-node.ts   Recursive tree node component
  bcd-breadcrumb.ts  Breadcrumb for the current path
  bcd-detail.ts      Feature detail view (support matrix, status, links)
  types.ts           BCD TypeScript types and browser metadata
  styles.ts          Shared CSS custom-property theme
index.html           Mounts <bcd-app>; ships the global reset + font stack
```

## Data source

On first load, the app fetches the full BCD JSON from
`https://unpkg.com/@mdn/browser-compat-data` and caches it in IndexedDB
(`bcd-navigator` database, `bcd-cache` store). Subsequent loads within 24 hours
use the cache.

## License

See [LICENSE](LICENSE).
