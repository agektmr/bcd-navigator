import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { theme } from './styles.js';
import type { BcdData, BcdFeatureNode } from './types.js';
import { TOP_LEVEL_CATEGORIES } from './types.js';
import './bcd-tree-node.js';

@customElement('bcd-tree')
export class BcdTree extends LitElement {
  static styles = [
    theme,
    css`
      :host {
        display: block;
        padding: 8px;
        overflow-y: auto;
        height: 100%;
      }
    `,
  ];

  @property({ attribute: false }) data: BcdData | null = null;
  @property() selectedPath = '';
  @property({ attribute: false }) expandedNodes: Set<string> = new Set();

  render() {
    if (!this.data) return html``;

    return html`
      ${TOP_LEVEL_CATEGORIES.filter((cat) => cat in this.data!).map(
        (category) => html`
          <bcd-tree-node
            .label=${category}
            .path=${category}
            .node=${this.data![category] as BcdFeatureNode}
            .selectedPath=${this.selectedPath}
            .expandedNodes=${this.expandedNodes}
          ></bcd-tree-node>
        `
      )}
    `;
  }
}
