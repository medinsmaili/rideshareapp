import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  LogLevel,
  OneSignal,
  NotificationWillDisplayEvent,
  NotificationClickEvent,
} from 'react-native-onesignal';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import '../global.css';

// Boot OneSignal immediately on file load, outside React
OneSignal.Debug.setLogLevel(LogLevel.None);
OneSignal.initialize("2fee526b-5ca6-4acb-a771-d3e03cad83a2");

export default function RootLayout() {
  useEffect(() => {
    OneSignal.Notifications.requestPermission(true);
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const onForeground = (event: NotificationWillDisplayEvent) => {
      event.getNotification().display();
    };

    const onClick = (event: NotificationClickEvent) => {
      const data = event.notification.additionalData as any;
      if (!data?.rideId) return;
      const timer = setTimeout(() => {
        pendingTimers.delete(timer);
        try {
          if (data.type === 'chat') {
            router.push({ pathname: '/group-chat', params: { rideId: data.rideId } });
          } else {
            router.push({ pathname: '/ride-detail', params: { id: data.rideId } });
          }
        } catch (e) {
          console.warn('[OneSignal] Navigation failed:', e);
        }
      }, 800);
      pendingTimers.add(timer);
    };

    OneSignal.Notifications.addEventListener('foregroundWillDisplay', onForeground);
    OneSignal.Notifications.addEventListener('click', onClick);

    return () => {
      OneSignal.Notifications.removeEventListener('foregroundWillDisplay', onForeground);
      OneSignal.Notifications.removeEventListener('click', onClick);
      pendingTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              {/* Onboarding / Auth flow */}
              <Stack.Screen name="index" />
              <Stack.Screen name="language-setup" options={{ gestureEnabled: false }} />
              <Stack.Screen name="login" options={{ gestureEnabled: false }} />
              <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="verify-email" options={{ gestureEnabled: false }} />

              {/* Main app */}
              <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />

              {/* Screens */}
              <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
              <Stack.Screen name="city-picker" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="search-results" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="ride-detail" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="group-chat" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="my-vehicles" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="verification-upload" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="rating-review" options={{ presentation: 'modal' }} />
              <Stack.Screen name="contact-support" options={{ presentation: 'modal' }} />
              <Stack.Screen name="notifications-settings" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
