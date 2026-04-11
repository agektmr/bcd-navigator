import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { theme } from './styles.js';
import type { BcdFeatureNode } from './types.js';
import { getChildKeys, hasCompat } from './bcd-data.js';

@customElement('bcd-tree-node')
export class BcdTreeNode extends LitElement {
  static styles = [
    theme,
    css`
      :host {
        display: block;
      }
      .node {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 3px 6px;
        cursor: pointer;
        border-radius: var(--radius-sm);
        font-size: 13px;
        user-select: none;
      }
      .node:hover {
        background: var(--bg-tertiary);
      }
      .node.selected {
        background: var(--accent-blue);
        background: rgba(31, 111, 235, 0.2);
        color: var(--text-link);
      }
      .arrow {
        width: 16px;
        text-align: center;
        font-size: 10px;
        color: var(--text-secondary);
        flex-shrink: 0;
        cursor: pointer;
        padding: 2px;
      }
      .label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .label.has-compat {
        color: var(--text-primary);
      }
      .label.branch {
        color: var(--text-highlight);
        font-weight: 500;
      }
      .children {
        padding-left: 16px;
      }
    `,
  ];

  @property() label = '';
  @property() path = '';
  @property({ attribute: false }) node: BcdFeatureNode | null = null;
  @property() selectedPath = '';
  @property({ attribute: false }) expandedNodes: Set<string> = new Set();

  get _isExpanded(): boolean {
    return this.expandedNodes.has(this.path);
  }

  get _childKeys(): string[] {
    return this.node ? getChildKeys(this.node) : [];
  }

  get _hasChildren(): boolean {
    return this._childKeys.length > 0;
  }

  get _isSelected(): boolean {
    return this.path === this.selectedPath;
  }

  render() {
    if (!this.node) return nothing;

    const nodeHasCompat = hasCompat(this.node);

    return html`
      <div
        class="node ${this._isSelected ? 'selected' : ''}"
        @click=${this._handleSelect}
      >
        <span class="arrow" @click=${this._handleToggle}>
          ${this._hasChildren
            ? this._isExpanded
              ? '▾'
              : '▸'
            : ''}
        </span>
        <span class="label ${this._hasChildren ? 'branch' : nodeHasCompat ? 'has-compat' : ''}">
          ${this.label}
        </span>
      </div>
      ${this._isExpanded && this._hasChildren
        ? html`
            <div class="children">
              ${this._childKeys.map((key) => {
                const childPath = `${this.path}.${key}`;
                return html`
                  <bcd-tree-node
                    .label=${key}
                    .path=${childPath}
                    .node=${this.node![key] as BcdFeatureNode}
                    .selectedPath=${this.selectedPath}
                    .expandedNodes=${this.expandedNodes}
                  ></bcd-tree-node>
                `;
              })}
            </div>
          `
        : nothing}
    `;
  }

  private _handleToggle(e: Event) {
    e.stopPropagation();
    if (this._hasChildren) {
      this.dispatchEvent(
        new CustomEvent('toggle-expand', {
          detail: { path: this.path },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private _handleSelect(e: Event) {
    e.stopPropagation();
    // Clicking a branch node both selects and expands (but not collapses)
    if (this._hasChildren && !this._isExpanded) {
      this.dispatchEvent(
        new CustomEvent('toggle-expand', {
          detail: { path: this.path },
          bubbles: true,
          composed: true,
        })
      );
    }
    this.dispatchEvent(
      new CustomEvent('feature-select', {
        detail: { path: this.path },
        bubbles: true,
        composed: true,
      })
    );
  }
}
