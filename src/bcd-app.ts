import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { theme } from './styles.js';
import type { BcdData } from './types.js';
import { fetchBcdData, buildPathIndex } from './bcd-data.js';
import './bcd-search.js';
import './bcd-tree.js';
import './bcd-detail.js';

@customElement('bcd-app')
export class BcdApp extends LitElement {
  static styles = [
    theme,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: var(--bg-primary);
        color: var(--text-primary);
      }

      /* Header */
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        border-bottom: 1px solid var(--border-color);
        flex-shrink: 0;
      }
      .title {
        font-size: 16px;
        font-weight: 600;
        white-space: nowrap;
        color: var(--text-primary);
      }
      .version {
        font-size: 11px;
        color: var(--text-secondary);
        white-space: nowrap;
      }
      bcd-search {
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }
      .menu-btn {
        display: none;
        background: none;
        border: none;
        color: var(--text-primary);
        font-size: 20px;
        cursor: pointer;
        padding: 4px;
      }

      /* Main layout */
      .main {
        display: flex;
        flex: 1;
        min-height: 0;
      }

      /* Sidebar */
      .sidebar {
        width: 280px;
        border-right: 1px solid var(--border-color);
        overflow-y: auto;
        flex-shrink: 0;
      }

      /* Detail */
      .detail {
        flex: 1;
        min-width: 0;
        overflow-y: auto;
      }

      /* Loading */
      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 12px;
        color: var(--text-secondary);
      }
      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--border-color);
        border-top-color: var(--accent-blue);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Overlay for mobile */
      .overlay {
        display: none;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .menu-btn {
          display: block;
        }
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 200;
          background: var(--bg-primary);
          transform: translateX(-100%);
          transition: transform 0.2s ease;
          width: 280px;
        }
        .sidebar.open {
          transform: translateX(0);
        }
        .overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 199;
        }
        .overlay.open {
          display: block;
        }
      }
    `,
  ];

  @state() private _data: BcdData | null = null;
  @state() private _pathIndex: string[] = [];
  @state() private _selectedPath = '';
  @state() private _expandedNodes: Set<string> = new Set();
  @state() private _loadingMessage = '';
  @state() private _error = '';
  @state() private _sidebarOpen = false;

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
    this._restoreFromHash();
    window.addEventListener('hashchange', this._onHashChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this._onHashChange);
  }

  private _onHashChange = () => {
    this._restoreFromHash();
  };

  private _restoreFromHash() {
    const hash = window.location.hash.slice(1);
    if (hash) {
      this._selectedPath = decodeURIComponent(hash);
      this._expandToPath(this._selectedPath);
    }
  }

  private async _loadData() {
    try {
      this._data = await fetchBcdData((msg) => {
        this._loadingMessage = msg;
      });
      this._pathIndex = buildPathIndex(this._data);
      if (this._selectedPath) {
        this._expandToPath(this._selectedPath);
      }
    } catch (err) {
      this._error = err instanceof Error ? err.message : 'Failed to load data';
    }
  }

  private _expandToPath(path: string) {
    const parts = path.split('.');
    const newExpanded = new Set(this._expandedNodes);
    for (let i = 1; i <= parts.length; i++) {
      newExpanded.add(parts.slice(0, i).join('.'));
    }
    this._expandedNodes = newExpanded;
  }

  private _selectPath(path: string) {
    this._selectedPath = path;
    // Expand ancestors only, not the node itself (toggle-expand handles that)
    const parts = path.split('.');
    if (parts.length > 1) {
      const newExpanded = new Set(this._expandedNodes);
      for (let i = 1; i < parts.length; i++) {
        newExpanded.add(parts.slice(0, i).join('.'));
      }
      this._expandedNodes = newExpanded;
    }
    window.history.replaceState(null, '', `#${encodeURIComponent(path)}`);
    this._sidebarOpen = false;
  }

  render() {
    if (this._error) {
      return html`
        <div class="loading">
          <div style="color: var(--accent-red);">Error: ${this._error}</div>
        </div>
      `;
    }

    if (!this._data) {
      return html`
        <div class="loading">
          <div class="spinner"></div>
          <div>${this._loadingMessage || 'Loading...'}</div>
        </div>
      `;
    }

    return html`
      <div class="header">
        <button class="menu-btn" @click=${() => (this._sidebarOpen = !this._sidebarOpen)}>
          ☰
        </button>
        <span class="title">BCD Navigator</span>
        <span class="version">v${this._data.__meta.version}</span>
        <bcd-search
          .pathIndex=${this._pathIndex}
          @search-select=${(e: CustomEvent) => this._selectPath(e.detail.path)}
        ></bcd-search>
      </div>

      <div class="main">
        <div class="overlay ${this._sidebarOpen ? 'open' : ''}" @click=${() => (this._sidebarOpen = false)}></div>
        <div class="sidebar ${this._sidebarOpen ? 'open' : ''}">
          <bcd-tree
            .data=${this._data}
            .selectedPath=${this._selectedPath}
            .expandedNodes=${this._expandedNodes}
            @feature-select=${(e: CustomEvent) => this._selectPath(e.detail.path)}
            @toggle-expand=${(e: CustomEvent) => this._toggleExpand(e.detail.path)}
          ></bcd-tree>
        </div>
        <div class="detail">
          <bcd-detail
            .data=${this._data}
            .selectedPath=${this._selectedPath}
            @navigate=${(e: CustomEvent) => this._selectPath(e.detail.path)}
          ></bcd-detail>
        </div>
      </div>
    `;
  }

  private _toggleExpand(path: string) {
    const newExpanded = new Set(this._expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    this._expandedNodes = newExpanded;
  }
}
