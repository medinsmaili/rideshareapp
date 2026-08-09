import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';

export default function LanguageSetupScreen() {
  const { languages, setLanguage, isLoading } = useLanguage();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (isLoading && languages.length === 0) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const handleConfirm = async () => {
    if (!selected || confirming) return;
    setConfirming(true);
    try {
      await setLanguage(selected);
      // Defer navigation to next tick to avoid crash during state update
      setTimeout(() => {
        router.replace('/login');
      }, 0);
    } catch (e) {
      console.error('Language selection error:', e);
      setConfirming(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center">
        {/* Logo */}
        <View className="items-center mb-10">
          <Image
            source={require('../assets/images/logo.png')}
            style={{ width: 80, height: 80, marginBottom: 20 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-foreground text-center">Welcome to Nisu</Text>
          <Text className="text-base text-muted-foreground text-center mt-2">
            Choose your preferred language
          </Text>
          <Text className="text-sm text-muted-foreground text-center mt-1">
            Zgjidhni gjuhën tuaj të preferuar
          </Text>
        </View>

        {/* Language Options */}
        <View className="gap-3 mb-10">
          {languages.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setSelected(lang.code)}
                className={`flex-row items-center justify-between p-5 rounded-3xl border-2 ${
                  isSelected
                    ? 'bg-primary/5 border-primary'
                    : 'bg-card border-border'
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Text className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {lang.code.toUpperCase()}
                    </Text>
                  </View>
                  <Text className={`text-xl font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {lang.name}
                  </Text>
                </View>
                {isSelected && (
                  <View className="bg-primary w-8 h-8 rounded-full items-center justify-center">
                    <Check size={18} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!selected || confirming}
          activeOpacity={0.85}
          style={selected ? { shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 } : undefined}
        >
          <LinearGradient
            colors={selected ? ['#f97316', '#f43f5e'] : ['#a8a29e', '#a8a29e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', opacity: !selected || confirming ? 0.5 : 1 }}
          >
            {confirming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
