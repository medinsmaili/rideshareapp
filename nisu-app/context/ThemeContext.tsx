import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = 'theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        const next: ThemeMode =
          stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
        setModeState(next);
        setColorScheme(next);
      } catch (e) {
        console.warn('[Theme] Failed to load saved mode', e);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => { cancelled = true; };
    // setColorScheme identity is unstable from nativewind; safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = async (m: ThemeMode) => {
    setModeState(m);
    setColorScheme(m);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, m);
    } catch (e) {
      console.warn('[Theme] Failed to persist mode', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark: colorScheme === 'dark', isReady }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
