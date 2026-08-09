import React, { useEffect, useRef, useCallback } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Index() {
  const { userToken, user, isLoading: authLoading } = useAuth();
  const { hasChosenLanguage, isLoading: langLoading } = useLanguage();
  const router = useRouter();
  const hasNavigated = useRef(false);

  const navigate = useCallback((path: string) => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    // Defer navigation to avoid "Cannot update during an existing state transition"
    setTimeout(() => {
      router.replace(path as any);
    }, 0);
  }, [router]);

  useEffect(() => {
    if (authLoading || langLoading) return;
    if (hasNavigated.current) return;

    if (!hasChosenLanguage) {
      navigate('/language-setup');
    } else if (userToken && user?.is_email_verified === false) {
      navigate('/verify-email');
    } else if (userToken) {
      navigate('/(tabs)');
    } else {
      navigate('/login');
    }
    // navigate is stable via useCallback; user/userToken/hasChosenLanguage only matter once loading completes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, langLoading]);

  return (
    <View className="flex-1 bg-background justify-center items-center">
      <Image
        source={require('../assets/images/logo.png')}
        style={{ width: 64, height: 64, marginBottom: 24, opacity: 0.6 }}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#f97316" />
    </View>
  );
}
