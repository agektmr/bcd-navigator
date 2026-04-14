export interface BcdSupportStatement {
  version_added: string | boolean | null;
  version_removed?: string | boolean | null;
  prefix?: string;
  alternative_name?: string;
  flags?: Array<{
    type: 'preference' | 'compile_flag' | 'runtime_flag';
    name: string;
    value_to_set?: string;
  }>;
  partial_implementation?: boolean;
  notes?: string | string[];
}

export interface BcdStatus {
  experimental: boolean;
  standard_track: boolean;
  deprecated: boolean;
}

export interface BcdCompat {
  support?: Record<string, BcdSupportStatement | BcdSupportStatement[]>;
  status?: BcdStatus;
  description?: string;
  mdn_url?: string;
  spec_url?: string | string[];
  tags?: string[];
}

export interface BcdFeatureNode {
  __compat?: BcdCompat;
  [key: string]: BcdFeatureNode | BcdCompat | undefined;
}

export interface BcdMeta {
  version: string;
  timestamp: string;
}

export interface BcdBrowserRelease {
  status: string;
  release_date?: string;
  release_notes?: string;
  engine?: string;
  engine_version?: string;
}

export interface BcdBrowser {
  name: string;
  type: 'desktop' | 'mobile' | 'server' | 'xr';
  upstream?: string;
  accepts_flags?: boolean;
  pref_url?: string;
  releases: Record<string, BcdBrowserRelease>;
}

export interface BcdData {
  __meta: BcdMeta;
  browsers: Record<string, BcdBrowser>;
  api: BcdFeatureNode;
  css: BcdFeatureNode;
  html: BcdFeatureNode;
  http: BcdFeatureNode;
  javascript: BcdFeatureNode;
  svg: BcdFeatureNode;
  mathml: BcdFeatureNode;
  webassembly: BcdFeatureNode;
  webdriver: BcdFeatureNode;
  webextensions: BcdFeatureNode;
  [key: string]: unknown;
}

export const MAJOR_BROWSERS = [
  'chrome',
  'edge',
  'firefox',
  'safari',
  'chrome_android',
  'firefox_android',
  'safari_ios',
  'webview_android',
] as const;

export const BROWSER_DISPLAY_NAMES: Record<string, string> = {
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  safari: 'Safari',
  chrome_android: 'Chrome Android',
  firefox_android: 'Firefox Android',
  safari_ios: 'Safari iOS',
  webview_android: 'WebView Android',
  opera: 'Opera',
  ie: 'IE',
  samsunginternet_android: 'Samsung Internet',
  nodejs: 'Node.js',
  deno: 'Deno',
  bun: 'Bun',
};

// Maps BCD browser IDs to @browser-logos npm package names and filenames
const LOGO_CDN = 'https://cdn.jsdelivr.net/npm/@browser-logos';

export const BROWSER_LOGO_URLS: Record<string, string> = {
  chrome: `${LOGO_CDN}/chrome@latest/chrome.svg`,
  edge: `${LOGO_CDN}/edge@latest/edge.svg`,
  firefox: `${LOGO_CDN}/firefox@latest/firefox.svg`,
  safari: `${LOGO_CDN}/safari@latest/safari.svg`,
  chrome_android: `${LOGO_CDN}/chrome@latest/chrome.svg`,
  firefox_android: `${LOGO_CDN}/firefox@latest/firefox.svg`,
  safari_ios: `${LOGO_CDN}/safari-ios@latest/safari-ios.svg`,
  webview_android: `${LOGO_CDN}/android-webview@latest/android-webview_128x128.png`,
  opera: `${LOGO_CDN}/opera@latest/opera.svg`,
  ie: `${LOGO_CDN}/internet-explorer_9-11@latest/internet-explorer_9-11.svg`,
  samsunginternet_android: `${LOGO_CDN}/samsung-internet@latest/samsung-internet.svg`,
  nodejs: `${LOGO_CDN}/node.js@latest/node.js.svg`,
  deno: `${LOGO_CDN}/deno@latest/deno.svg`,
};

export const TOP_LEVEL_CATEGORIES = [
  'api',
  'css',
  'html',
  'http',
  'javascript',
  'mathml',
  'svg',
  'webassembly',
  'webdriver',
  'webextensions',
] as const;
