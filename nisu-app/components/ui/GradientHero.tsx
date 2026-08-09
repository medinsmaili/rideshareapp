import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../hooks/useThemeColors';

type Variant = 'primary' | 'sunset' | 'rose' | 'violet' | 'aurora';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  style?: ViewStyle;
};

export function GradientHero({ children, variant = 'sunset', className, style }: Props) {
  const c = useThemeColors();

  const colorMap: Record<Variant, [string, string, ...string[]]> = {
    primary: [c.primary, c.primaryDeep],
    sunset: [c.primary, c.accentRose, c.accentAmber],
    rose: [c.accentRose, c.primary],
    violet: [c.accentViolet, c.primary],
    aurora: [c.primary, c.accentRose, c.accentViolet],
  };

  return (
    <View className={className} style={style}>
      <LinearGradient
        colors={colorMap[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {children}
      </LinearGradient>
    </View>
  );
}
