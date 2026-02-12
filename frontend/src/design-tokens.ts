/**
 * Design tokens — single source for colors, spacing, radius, font, shadow.
 * Injected into :root in index.css. Components use var(--color-*), var(--spacing-*), etc. only.
 */

/**
 * Theme palettes: Web3 Pro Light (light), DeFi Dark (dark slate), Navy Pro (dark blue-black).
 * Light: off-white bg #eef2ff, card #fff, indigo primary; dark: DeFi Dark slate + indigo; Navy Pro blue-black + blue primary.
 */
export const colors = {
  primary: "#4f46e5",
  primaryHover: "#4338ca",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  border: "#c7d2fe",
  bg: "#eef2ff",
  surface: "#ffffff",
  surfaceAlt: "#e0e7ff",
  surfaceWarn: "#fffbeb",
  text: "#0f172a",
  textMuted: "#64748b",
} as const;

export const spacing = {
  xxxs: "2px",
  xxs: "6px",
  xs: "4px",
  sm: "8px",
  sm2: "10px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  listIndent: "18px",
} as const;

/** Layout (e.g. root max-width, grid min columns, header). */
export const layout = {
  contentMaxWidth: "720px",
  rootMaxWidth: "960px",
  minWidthLabel: "110px",
  minWidthViewport: "320px",
  gridMinColSm: "220px",
  gridMinCol: "260px",
  headerHeight: "56px",
  metricMinWidth: "140px",
  breakpointDashboard: "640px",
  breakpointActions: "560px",
} as const;

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  pill: "999px",
  card: "10px",
} as const;

export const fontFamily = {
  sans: "system-ui, Avenir, Helvetica, Arial, sans-serif",
} as const;

export const fontSize = {
  xs: "0.75rem",
  xs2: "0.8125rem",
  sm: "0.875rem",
  md: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
} as const;

export const opacity = {
  overlay: "0.35",
  label: "0.75",
  muted: "0.85",
  subtle: "0.8",
  dim: "0.9",
  disabled: "0.55",
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const shadow = {
  sm: "0 1px 3px rgba(15,23,42,0.06)",
  md: "0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.04)",
} as const;

export const zIndex = {
  header: 40,
  modal: 50,
} as const;

/** Focus ring (e.g. button:focus-visible outline). */
export const focusRing = "4px";

/** P2.3.2 Transitions (button/card hover). */
export const transition = {
  fast: "0.15s ease",
  normal: "0.2s ease",
} as const;
