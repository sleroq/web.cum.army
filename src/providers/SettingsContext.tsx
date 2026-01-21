import { createContext, useContext } from 'react';
import { ThemeColors } from '../config/themes';

export interface SettingsContextProps {
  currentThemeId: string;
  customColors: ThemeColors;
  setTheme: (themeId: string) => void;
  updateCustomColor: (key: keyof ThemeColors, value: string) => void;
  pauseOnClick: boolean;
  setPauseOnClick: (pause: boolean) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (isOpen: boolean) => void;
}

export const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
