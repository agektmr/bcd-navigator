import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { theme } from './styles.js';
import type { BcdData, BcdFeatureNode, BcdSupportStatement } from './types.js';
import { MAJOR_BROWSERS, BROWSER_DISPLAY_NAMES, BROWSER_LOGO_URLS } from './types.js';
import { getNodeAtPath, getChildKeys, hasCompat } from './bcd-data.js';
import { loadWebFeatures, getBaselineStatus } from './web-features.js';
import type { WebFeaturesIndex, BaselineStatus } from './web-features.js';
import './bcd-breadcrumb.js';

@customElement('bcd-detail')
export class BcdDetail extends LitElement {
  static styles = [
    theme,
    css`
      :host {
        display: block;
        padding: 16px;
        overflow-y: auto;
      }
      .empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-secondary);
        font-size: 14px;
      }
      .path-box {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 12px 0 16px;
        gap: 12px;
      }
      .path-text {
        font-family: var(--font-mono);
        color: #f0883e;
        font-size: 14px;
        font-weight: bold;
        word-break: break-all;
      }
      .copy-btn {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 4px 10px;
        color: var(--text-primary);
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
        font-family: inherit;
      }
      .copy-btn:hover {
        background: var(--border-color);
      }
      .badges {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
      }
      .badge.standard {
        background: var(--badge-standard-bg);
        color: var(--badge-standard-text);
      }
      .badge.experimental {
        background: var(--badge-experimental-bg);
        color: var(--badge-experimental-text);
      }
      .badge.deprecated {
        background: var(--badge-deprecated-bg);
        color: var(--badge-deprecated-text);
      }
      .badge.ok {
        background: var(--badge-ok-bg);
        color: var(--badge-ok-text);
      }
      .section-label {
        font-size: 11px;
        color: var(--text-secondary);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .browser-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 6px;
        margin-bottom: 20px;
      }
      .browser-card {
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
        padding: 8px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .browser-logo {
        width: 24px;
        height: 24px;
      }
      .browser-name {
        font-size: 10px;
        color: var(--text-secondary);
      }
      .browser-version {
        font-weight: bold;
        font-size: 13px;
      }
      .browser-version.supported {
        color: var(--accent-green);
      }
      .browser-version.unsupported {
        color: var(--accent-red);
      }
      .browser-version.unknown {
        color: var(--text-secondary);
      }
      .browser-version .prefix {
        font-size: 10px;
        color: var(--accent-yellow);
        display: block;
      }
      .links {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        font-size: 12px;
      }
      .links a {
        color: var(--text-link);
        text-decoration: none;
      }
      .links a:hover {
        text-decoration: underline;
      }
      .subfeatures {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .subfeature {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        padding: 4px 10px;
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-size: 12px;
        cursor: pointer;
        font-family: inherit;
      }
      .subfeature:hover {
        border-color: var(--text-link);
        color: var(--text-link);
      }
      .description {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 16px;
      }
      .baseline {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: var(--radius-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        margin-bottom: 16px;
      }
      .baseline.widely { border-color: var(--accent-green); }
      .baseline.newly { border-color: var(--accent-blue); }
      .baseline.limited { border-color: var(--accent-yellow); }
      .baseline-icon {
        width: 54px;
        height: 30px;
        flex-shrink: 0;
        display: block;
      }
      .baseline-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .baseline-meta {
        font-size: 11px;
        color: var(--text-secondary);
      }
      .baseline-meta code {
        font-family: var(--font-mono);
      }
    `,
  ];

  @property({ attribute: false }) data: BcdData | null = null;
  @property() selectedPath = '';
  @state() private _copied = false;
  @state() private _webFeatures: WebFeaturesIndex | null = null;

  connectedCallback() {
    super.connectedCallback();
    loadWebFeatures().then((index) => {
      this._webFeatures = index;
    });
  }

  render() {
    if (!this.data || !this.selectedPath) {
      return html`<div class="empty">Select a feature from the tree</div>`;
    }

    const node = getNodeAtPath(this.data, this.selectedPath);
    if (!node) {
      return html`<div class="empty">Feature not found: ${this.selectedPath}</div>`;
    }

    const compat = node.__compat;
    const childKeys = getChildKeys(node);

    return html`
      <bcd-breadcrumb .path=${this.selectedPath}></bcd-breadcrumb>

      <div class="path-box">
        <code class="path-text">${this.selectedPath}</code>
        <button class="copy-btn" @click=${this._copy}>
          ${this._copied ? '✓ Copied' : '📋 Copy path'}
        </button>
      </div>

      ${this._renderBaseline()}
      ${compat ? this._renderCompat(compat) : nothing}
      ${childKeys.length > 0
        ? html`
            <div class="section-label">Sub-features</div>
            <div class="subfeatures">
              ${childKeys.map(
                (key) => html`
                  <button
                    class="subfeature"
                    @click=${() => this._navigate(`${this.selectedPath}.${key}`)}
                  >
                    ${key}
                  </button>
                `
              )}
            </div>
          `
        : nothing}
    `;
  }

  private _renderBaseline() {
    if (!this._webFeatures || !this.selectedPath) return nothing;
    const match = getBaselineStatus(this._webFeatures, this.selectedPath);
    if (!match) return nothing;

    const label: Record<BaselineStatus, string> = {
      widely: 'Baseline Widely available',
      newly: 'Baseline Newly available',
      limited: 'Limited availability',
    };
    const iconSrc: Record<BaselineStatus, string> = {
      widely: '/baseline/baseline-widely-icon.svg',
      newly: '/baseline/baseline-newly-icon.svg',
      limited: '/baseline/baseline-limited-icon.svg',
    };

    const inherited = match.matchedKey !== this.selectedPath;
    return html`
      <div class="baseline ${match.status}">
        <img
          class="baseline-icon"
          src=${iconSrc[match.status]}
          alt=${label[match.status]}
        />
        <div>
          <div class="baseline-title">${label[match.status]} — ${match.name}</div>
          <div class="baseline-meta">
            ${match.low_date
              ? html`since ${match.low_date}${match.high_date
                  ? html` · widely since ${match.high_date}`
                  : nothing}`
              : nothing}
            ${inherited
              ? html`${match.low_date ? ' · ' : ''}inherited from
                  <code>${match.matchedKey}</code>`
              : nothing}
          </div>
        </div>
      </div>
    `;
  }

  private _renderCompat(compat: NonNullable<BcdFeatureNode['__compat']>) {
    const status = compat.status;
    const support = compat.support;

    return html`
      ${compat.description
        ? html`<div class="description">${unsafeHTML(compat.description)}</div>`
        : nothing}

      ${status
        ? html`
            <div class="badges">
              ${status.standard_track
                ? html`<span class="badge standard">Standard Track</span>`
                : html`<span class="badge experimental">Non-standard</span>`}
              ${status.experimental
                ? html`<span class="badge experimental">Experimental</span>`
                : nothing}
              ${status.deprecated
                ? html`<span class="badge deprecated">Deprecated</span>`
                : nothing}
            </div>
          `
        : nothing}

      ${support
        ? html`
            <div class="section-label">Browser Support</div>
            <div class="browser-grid">
              ${MAJOR_BROWSERS.map((browser) => {
                const stmt = support[browser];
                if (!stmt) return nothing;
                const s: BcdSupportStatement = Array.isArray(stmt) ? stmt[0] : stmt;
                return this._renderBrowserCard(browser, s);
              })}
            </div>
          `
        : nothing}

      ${compat.mdn_url || compat.spec_url
        ? html`
            <div class="section-label">Links</div>
            <div class="links">
              ${compat.mdn_url
                ? html`<a href=${compat.mdn_url} target="_blank" rel="noopener"
                    >📖 MDN Docs</a
                  >`
                : nothing}
              ${compat.spec_url
                ? html`<a
                    href=${Array.isArray(compat.spec_url) ? compat.spec_url[0] : compat.spec_url}
                    target="_blank"
                    rel="noopener"
                    >📋 Specification</a
                  >`
                : nothing}
            </div>
          `
        : nothing}
    `;
  }

  private _renderBrowserCard(browserId: string, stmt: BcdSupportStatement) {
    const name = BROWSER_DISPLAY_NAMES[browserId] ?? browserId;
    const logoUrl = BROWSER_LOGO_URLS[browserId];
    let versionText: string;
    let versionClass: string;

    if (stmt.version_added === true) {
      versionText = 'Yes';
      versionClass = 'supported';
    } else if (stmt.version_added === false || stmt.version_added === null) {
      versionText = stmt.version_added === false ? 'No' : '?';
      versionClass = stmt.version_added === false ? 'unsupported' : 'unknown';
    } else {
      versionText = stmt.version_added;
      versionClass = 'supported';
    }

    return html`
      <div class="browser-card">
        ${logoUrl
          ? html`<img class="browser-logo" src=${logoUrl} alt=${name} loading="lazy" />`
          : nothing}
        <div class="browser-name">${name}</div>
        <div class="browser-version ${versionClass}">
          ${versionText}
          ${stmt.prefix ? html`<span class="prefix">${stmt.prefix}</span>` : nothing}
        </div>
      </div>
    `;
  }

  private async _copy() {
    try {
      await navigator.clipboard.writeText(this.selectedPath);
      this._copied = true;
      setTimeout(() => {
        this._copied = false;
      }, 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = this.selectedPath;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this._copied = true;
      setTimeout(() => {
        this._copied = false;
      }, 2000);
    }
  }

  private _navigate(path: string) {
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { path },
        bubbles: true,
        composed: true,
      })
    );
  }
}
