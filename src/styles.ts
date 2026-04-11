import { css } from 'lit';

export const theme = css`
  :host {
    --bg-primary: #0d1117;
    --bg-secondary: #161b22;
    --bg-tertiary: #21262d;
    --border-color: #30363d;
    --text-primary: #c9d1d9;
    --text-secondary: #8b949e;
    --text-link: #58a6ff;
    --text-highlight: #79c0ff;
    --accent-blue: #1f6feb;
    --accent-green: #3fb950;
    --accent-red: #f85149;
    --accent-yellow: #d29922;
    --badge-standard-bg: #1f6feb33;
    --badge-standard-text: #58a6ff;
    --badge-experimental-bg: #d2992233;
    --badge-experimental-text: #d29922;
    --badge-deprecated-bg: #f8514933;
    --badge-deprecated-text: #f85149;
    --badge-ok-bg: #23863633;
    --badge-ok-text: #3fb950;
    --font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
    --radius-sm: 4px;
    --radius-md: 6px;
  }
`;
