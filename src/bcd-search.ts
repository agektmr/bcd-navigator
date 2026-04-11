import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { theme } from './styles.js';

@customElement('bcd-search')
export class BcdSearch extends LitElement {
  static styles = [
    theme,
    css`
      :host {
        display: block;
        position: relative;
      }
      .search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 12px;
        padding-left: 32px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 14px;
        font-family: inherit;
        outline: none;
      }
      .search-input:focus {
        border-color: var(--accent-blue);
      }
      .search-input::placeholder {
        color: var(--text-secondary);
      }
      .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        font-size: 14px;
        pointer-events: none;
        z-index: 1;
      }
      .dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        max-height: 400px;
        overflow-y: auto;
        z-index: 100;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }
      .result {
        padding: 8px 12px;
        cursor: pointer;
        font-size: 13px;
        font-family: var(--font-mono);
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-color);
      }
      .result:last-child {
        border-bottom: none;
      }
      .result:hover,
      .result.active {
        background: var(--bg-tertiary);
      }
      .result mark {
        background: transparent;
        color: var(--accent-yellow);
        font-weight: bold;
      }
      .no-results {
        padding: 12px;
        color: var(--text-secondary);
        font-size: 13px;
        text-align: center;
      }
    `,
  ];

  @property({ attribute: false }) pathIndex: string[] = [];
  @state() private _query = '';
  @state() private _results: string[] = [];
  @state() private _showDropdown = false;
  @state() private _activeIndex = -1;

  private _debounceTimer: ReturnType<typeof setTimeout> | undefined;

  render() {
    return html`
      <span class="search-icon">🔍</span>
      <input
        class="search-input"
        type="text"
        placeholder="Search features... (e.g. fetch, grid, transform)"
        .value=${this._query}
        @input=${this._onInput}
        @keydown=${this._onKeydown}
        @focus=${this._onFocus}
      />
      ${this._showDropdown && this._query.length > 0
        ? html`
            <div class="dropdown">
              ${this._results.length > 0
                ? this._results.map(
                    (path, i) => html`
                      <div
                        class="result ${i === this._activeIndex ? 'active' : ''}"
                        @click=${() => this._selectResult(path)}
                      >
                        ${this._highlightMatch(path, this._query)}
                      </div>
                    `
                  )
                : html`<div class="no-results">No features found</div>`}
            </div>
          `
        : nothing}
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onDocumentClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocumentClick);
  }

  private _onDocumentClick = (e: Event) => {
    if (!this.contains(e.target as Node)) {
      this._showDropdown = false;
    }
  };

  private _onInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this._query = value;
    this._activeIndex = -1;

    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._search(value);
    }, 150);
  }

  private _onFocus() {
    if (this._query.length > 0 && this._results.length > 0) {
      this._showDropdown = true;
    }
  }

  private _onKeydown(e: KeyboardEvent) {
    if (!this._showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._activeIndex = Math.min(this._activeIndex + 1, this._results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._activeIndex = Math.max(this._activeIndex - 1, 0);
    } else if (e.key === 'Enter' && this._activeIndex >= 0) {
      e.preventDefault();
      this._selectResult(this._results[this._activeIndex]);
    } else if (e.key === 'Escape') {
      this._showDropdown = false;
    }
  }

  private _search(query: string) {
    if (query.length === 0) {
      this._results = [];
      this._showDropdown = false;
      return;
    }

    const lower = query.toLowerCase();
    this._results = this.pathIndex
      .filter((path) => path.toLowerCase().includes(lower))
      .slice(0, 50);
    this._showDropdown = true;
  }

  private _selectResult(path: string) {
    this._showDropdown = false;
    this._query = path;
    this.dispatchEvent(
      new CustomEvent('search-select', {
        detail: { path },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _highlightMatch(text: string, query: string) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx === -1) return html`${text}`;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return html`${before}<mark>${match}</mark>${after}`;
  }
}
