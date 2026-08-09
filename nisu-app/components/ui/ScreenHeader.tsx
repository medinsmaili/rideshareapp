import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';

type Props = {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
};

export function ScreenHeader({ title, subtitle, rightAction, onBack, showBack = true }: Props) {
  const router = useRouter();
  const c = useThemeColors();

  return (
    <View className="px-5 py-4 flex-row items-center bg-background">
      {showBack && (
        <TouchableOpacity
          onPress={onBack || (() => router.back())}
          className="w-11 h-11 rounded-2xl bg-card border border-border items-center justify-center mr-3"
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={c.foreground} />
        </TouchableOpacity>
      )}
      <View className="flex-1">
        <Text className="text-xl font-bold text-foreground">{title}</Text>
        {!!subtitle && <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text>}
      </View>
      {rightAction}
    </View>
  );
}
