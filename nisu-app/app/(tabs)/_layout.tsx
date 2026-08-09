import { Tabs } from 'expo-router';
import { Car, History, Plus, User } from 'lucide-react-native';
import { cssInterop, useColorScheme } from 'nativewind';
import { useLanguage } from '../../context/LanguageContext';

cssInterop(Car, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(History, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Plus, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(User, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#171412' : '#ffffff',
          borderTopColor: isDark ? '#292524' : '#f0e9e0',
          borderTopWidth: 1,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarActiveTintColor: isDark ? '#fb923c' : '#ea580c',
        tabBarInactiveTintColor: isDark ? '#78716c' : '#a8a29e',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_find_rides', 'Find Rides'),
          tabBarIcon: ({ focused }) => (
            <Car className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-rides"
        options={{
          title: t('tab_my_rides', 'My Rides'),
          tabBarIcon: ({ focused }) => (
            <History className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="post-ride"
        options={{
          title: t('tab_post_ride', 'Post Ride'),
          tabBarIcon: ({ focused }) => (
            <Plus className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab_profile', 'Profile'),
          tabBarIcon: ({ focused }) => (
            <User className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}