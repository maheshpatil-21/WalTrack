import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { ThemeMode, ThemeColors, getTheme } from '../constants/themes';

const THEME_STORAGE_KEY = 'waltrack_theme_preference';

interface ThemeContextValue {
  mode: ThemeMode;
  theme: ThemeColors;
  setTheme: (mode: ThemeMode) => Promise<void>;
  isSystemDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const isSystemDark = systemColorScheme === 'dark';

  const [mode, setMode] = useState<ThemeMode>('light');
  const [isReady, setIsReady] = useState(false);

  // Load theme preference from AsyncStorage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'light' || saved === 'dark')) {
          setMode(saved);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadThemePreference();
  }, []);

  // Get current theme object
  const theme = useMemo(() => getTheme(mode), [mode]);

  // Save theme preference and update state
  const setTheme = async (nextMode: ThemeMode) => {
    try {
      setMode(nextMode);
      // Ensure the toggle persists and the UI re-renders reliably
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Don't render until theme is loaded to prevent flash
  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ mode, theme, setTheme, isSystemDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
