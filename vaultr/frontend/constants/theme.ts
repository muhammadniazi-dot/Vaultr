export const colors = {
  background: '#0f0f0f',
  surface: '#1a1a1a',
  card: '#242424',
  border: '#2a2a2a',
  accentGold: '#c9a84c',
  positive: '#c9a84c',
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
};

export const radius = {
  card: 14,
  button: 10,
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
