import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../hooks/useThemeColors';

type Props = {
  onPress?: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'sunset';
  style?: ViewStyle;
};

export function PrimaryButton({ onPress, label, loading, disabled, icon, variant = 'sunset', style }: Props) {
  const c = useThemeColors();
  const colors: [string, string, ...string[]] =
    variant === 'sunset' ? [c.primary, c.accentRose] : [c.primary, c.primaryDeep];

  return (
    <TouchableOpacity onPress={onPress} disabled={loading || disabled} activeOpacity={0.85} style={style}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 56,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: loading || disabled ? 0.6 : 1,
          shadowColor: c.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        {loading ? (
          <ActivityIndicator color={c.white} />
        ) : (
          <>
            {icon}
            <Text className="text-white font-bold text-base" style={{ marginLeft: icon ? 8 : 0 }}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
