import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { theme } from './styles.js';

@customElement('bcd-breadcrumb')
export class BcdBreadcrumb extends LitElement {
  static styles = [
    theme,
    css`
      :host {
        display: block;
        font-size: 12px;
        color: var(--text-secondary);
      }
      .breadcrumb {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 2px;
      }
      .segment {
        color: var(--text-highlight);
        cursor: pointer;
        padding: 2px 4px;
        border-radius: var(--radius-sm);
      }
      .segment:hover {
        background: var(--bg-tertiary);
      }
      .segment.current {
        color: var(--text-primary);
        cursor: default;
      }
      .segment.current:hover {
        background: transparent;
      }
      .separator {
        color: var(--border-color);
        margin: 0 2px;
      }
    `,
  ];

  @property() path = '';

  render() {
    const parts = this.path.split('.');
    return html`
      <nav class="breadcrumb">
        ${parts.map((part, i) => {
          const isLast = i === parts.length - 1;
          const partialPath = parts.slice(0, i + 1).join('.');
          return html`
            ${i > 0 ? html`<span class="separator">›</span>` : ''}
            <span
              class="segment ${isLast ? 'current' : ''}"
              @click=${() => !isLast && this._navigate(partialPath)}
              >${part}</span
            >
          `;
        })}
      </nav>
    `;
  }

  private _navigate(path: string) {
    this.dispatchEvent(
      new CustomEvent('navigate', { detail: { path }, bubbles: true, composed: true })
    );
  }
}
