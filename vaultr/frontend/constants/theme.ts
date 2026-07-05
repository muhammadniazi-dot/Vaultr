export const colors = {
  background: '#0f0f0f',
  surface: '#1a1a1a',
  card: '#242424',
  border: '#2a2a2a',
  accentGold: '#c9a84c',
  // Low-opacity tints of the accent for glows, focus rings, and decorative
  // background shading — flat colors layered for depth, no gradients.
  accentGoldFaint: 'rgba(201, 168, 76, 0.05)',
  accentGoldSoft: 'rgba(201, 168, 76, 0.14)',
  // Calm, desaturated green — reserved for deposits/positive amounts.
  // Red (`danger`) stays reserved for true negative balances, errors, and alerts;
  // ordinary spending uses `negative` (muted gray), not red, per design direction.
  positive: '#4ADE80',
  negative: '#888888',
  textPrimary: '#e0e0e0',
  textMuted: '#555555',
  danger: '#f87171',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radius = {
  card: 20,
  button: 10,
  pill: 999,
};

export const typography = {
  fontFamily: undefined, // System default (SF Pro on iOS)
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 34,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

const theme = {
  colors,
  spacing,
  radius,
  typography,
};

export default theme;
