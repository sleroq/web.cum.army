import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SettingsContext } from './SettingsContext';
import { DEFAULT_THEME, THEMES, ThemeColors, LIGHT_THEME, DARK_THEME } from '../config/themes';

interface SettingsProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'broadcast_box_settings';

interface StoredSettings {
  themeId: string;
  customColors: ThemeColors;
  pauseOnClick?: boolean;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches
    ) {
      return 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'light' : 'dark');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        const parsed: StoredSettings = JSON.parse(stored);
        return parsed.themeId || 'system';
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return 'system';
  });

  const [customColors, setCustomColors] = useState<ThemeColors>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        const parsed: StoredSettings = JSON.parse(stored);
        return parsed.customColors || DEFAULT_THEME.colors;
      } catch {
        // Error already logged in currentThemeId initializer
      }
    }
    return DEFAULT_THEME.colors;
  });

  const [pauseOnClick, setPauseOnClick] = useState<boolean>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        const parsed: StoredSettings = JSON.parse(stored);
        return parsed.pauseOnClick ?? true;
      } catch {
        // Error already logged
      }
    }
    return true;
  });

  const [isSettingsOpen, setSettingsOpen] = useState(false);

  // Save settings to local storage
  useEffect(() => {
    const settings: StoredSettings = {
      themeId: currentThemeId,
      customColors,
      pauseOnClick,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [currentThemeId, customColors, pauseOnClick]);

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    let colors: ThemeColors;

    if (currentThemeId === 'custom') {
      colors = customColors;
    } else if (currentThemeId === 'system') {
      colors = systemTheme === 'light' ? LIGHT_THEME.colors : DARK_THEME.colors;
    } else {
      const theme = THEMES.find((t) => t.id === currentThemeId);
      colors = theme?.colors || DEFAULT_THEME.colors;
    }

    Object.keys(colors).forEach((k) => {
      const key = k as keyof ThemeColors;
      const value = colors[key];
      // Convert camelCase to kebab-case for CSS variables
      // e.g. brandHover -> --color-brand-hover
      const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    // Update color-scheme based on theme
    if (currentThemeId === 'light' || (currentThemeId === 'system' && systemTheme === 'light')) {
      root.style.colorScheme = 'light';
    } else {
      root.style.colorScheme = 'dark';
    }
  }, [currentThemeId, customColors, systemTheme]);

  const setTheme = useCallback(
    (themeId: string) => {
      setCurrentThemeId(themeId);
      if (themeId === 'system') {
        setCustomColors(systemTheme === 'light' ? LIGHT_THEME.colors : DARK_THEME.colors);
      } else if (themeId !== 'custom') {
        const theme = THEMES.find((t) => t.id === themeId);
        if (theme) {
          setCustomColors(theme.colors);
        }
      }
    },
    [systemTheme]
  );

  const updateCustomColor = useCallback((key: keyof ThemeColors, value: string) => {
    setCustomColors((prev) => ({ ...prev, [key]: value }));
    setCurrentThemeId('custom');
  }, []);

  const contextValue = useMemo(
    () => ({
      currentThemeId,
      customColors,
      setTheme,
      updateCustomColor,
      pauseOnClick,
      setPauseOnClick,
      isSettingsOpen,
      setSettingsOpen,
    }),
    [
      currentThemeId,
      customColors,
      setTheme,
      updateCustomColor,
      pauseOnClick,
      setPauseOnClick,
      isSettingsOpen,
    ]
  );

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
};
