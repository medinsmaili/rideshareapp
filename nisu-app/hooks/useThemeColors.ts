import { useColorScheme } from 'nativewind';

const LIGHT = {
  background: '#fefbf6',
  foreground: '#1c1917',
  card: '#ffffff',
  cardElevated: '#fcf7f0',
  border: '#f0e9e0',
  borderStrong: '#e7dccf',
  muted: '#f5efe6',
  mutedForeground: '#78716c',
  primary: '#f97316',
  primarySoft: '#fed7aa',
  primaryDeep: '#ea580c',
  accentRose: '#f43f5e',
  accentAmber: '#f59e0b',
  accentViolet: '#8b5cf6',
  success: '#16a34a',
  warning: '#f59e0b',
  destructive: '#ef4444',
  white: '#ffffff',
};

const DARK = {
  background: '#171412',
  foreground: '#fafaf9',
  card: '#292524',
  cardElevated: '#332e2c',
  border: '#44403c',
  borderStrong: '#57534e',
  muted: '#292524',
  mutedForeground: '#a8a29e',
  primary: '#fb923c',
  primarySoft: '#57331b',
  primaryDeep: '#ea580c',
  accentRose: '#fb7185',
  accentAmber: '#fbbf24',
  accentViolet: '#a78bfa',
  success: '#22c55e',
  warning: '#fbbf24',
  destructive: '#f87171',
  white: '#ffffff',
};

export type ThemeColors = typeof LIGHT;

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? DARK : LIGHT;
}
