export interface ThemeColors {
  background: string;
  surface: string;
  input: string;
  border: string;
  foreground: string;
  muted: string;
  brand: string;
  brandHover: string;
  shadow: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const DARK_THEME: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    background: '#121212',
    surface: '#1e1e1e',
    input: '#2d2d2d',
    border: '#404040',
    foreground: '#ffffff',
    muted: '#cccccc',
    brand: '#ec3b73',
    brandHover: '#ff69a0',
    shadow: 'rgba(0, 0, 0, 0.55)',
  },
};

export const LIGHT_THEME: Theme = {
  id: 'light',
  name: 'Light',
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    input: '#f1f5f9',
    border: '#e2e8f0',
    foreground: '#0f172a',
    muted: '#64748b',
    brand: '#ec3b73',
    brandHover: '#d81b60',
    shadow: 'rgba(0, 0, 0, 0.15)',
  },
};

export const DEFAULT_THEME = DARK_THEME;

export const THEMES: Theme[] = [
  {
    id: 'system',
    name: 'System Preference',
    colors: DARK_THEME.colors,
  },
  DARK_THEME,
  LIGHT_THEME,
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      input: '#334155',
      border: '#475569',
      foreground: '#f8fafc',
      muted: '#94a3b8',
      brand: '#38bdf8',
      brandHover: '#0ea5e9',
      shadow: 'rgba(0, 0, 0, 0.45)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      background: '#052e16',
      surface: '#064e3b',
      input: '#065f46',
      border: '#047857',
      foreground: '#ecfccb',
      muted: '#a7f3d0',
      brand: '#10b981',
      brandHover: '#059669',
      shadow: 'rgba(0, 0, 0, 0.45)',
    },
  },
];
