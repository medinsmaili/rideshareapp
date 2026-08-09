import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import RideCard from '../../components/RideCard';
import AdBanner, { BannerPayload } from '../../components/AdBanner';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useFocusedFetch } from '../../hooks/useFocusedFetch';
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const c = useThemeColors();

  const [origin, setOrigin] = useState({ id: '', name: '' });
  const [dest, setDest] = useState({ id: '', name: '' });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banner, setBanner] = useState<BannerPayload | null>(null);

  const isFutureRide = (r: any) => {
    if (!r?.departure_time) return false;
    const t = new Date(r.departure_time).getTime();
    return Number.isFinite(t) && r.status !== 'completed' && r.status !== 'cancelled' && t > Date.now();
  };

  const fetchData = async (signal: { cancelled: boolean }) => {
    try {
      const originStr = await AsyncStorage.getItem('selected_homeOrigin');
      const destStr = await AsyncStorage.getItem('selected_homeDest');
      if (signal.cancelled) return;
      if (originStr) {
        try {
          const city = JSON.parse(originStr);
          if (city?.id) setOrigin({ id: city.id, name: city.name });
        } catch {}
        await AsyncStorage.removeItem('selected_homeOrigin');
      }
      if (destStr) {
        try {
          const city = JSON.parse(destStr);
          if (city?.id) setDest({ id: city.id, name: city.name });
        } catch {}
        await AsyncStorage.removeItem('selected_homeDest');
      }

      const [ridesRes, adRes] = await Promise.allSettled([
        client.get('/rides/search'),
        client.get('/settings/active-ad'),
      ]);
      if (signal.cancelled) return;

      if (ridesRes.status === 'fulfilled') {
        const allRides = Array.isArray(ridesRes.value.data) ? ridesRes.value.data : [];
        setRecentRides(allRides.filter(isFutureRide));
      } else {
        setRecentRides([]);
      }

      setBanner(adRes.status === 'fulfilled' && adRes.value.data ? adRes.value.data : null);
    } catch (e) {
      if (!signal.cancelled) setRecentRides([]);
    } finally {
      if (!signal.cancelled) setIsLoading(false);
    }
  };

  useFocusedFetch((signal) => fetchData(signal), []);

  const adjustDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    if (newDate < new Date(new Date().setHours(0, 0, 0, 0))) return;
    setDate(newDate);
  };

  const formatDisplayDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchData({ cancelled: false })} />}
      >
        {/* Search Header — Sunset Gradient */}
        <LinearGradient
          colors={[c.primary, c.accentRose, c.accentAmber]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 56, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}
        >
          <Text className="text-white text-3xl font-bold mb-1">{t('where_to', 'Where to?')}</Text>
          <Text className="text-white/80 text-sm mb-5">{t('search_subtitle', 'Find your next ride')}</Text>

          <View className="bg-card p-1 rounded-3xl border border-border" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 8 }}>
            {/* Origin */}
            <TouchableOpacity onPress={() => router.push('/city-picker?type=homeOrigin')} className="flex-row items-center p-3" activeOpacity={0.7}>
              <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
                <MapPin size={18} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">{t('departure_label', 'Pickup')}</Text>
                <Text className={origin.name ? 'text-foreground text-base font-semibold' : 'text-muted-foreground text-base'} numberOfLines={1}>
                  {origin.name || t('any', 'Any')}
                </Text>
              </View>
            </TouchableOpacity>

            <View className="h-[1px] bg-border mx-4" />

            {/* Destination */}
            <TouchableOpacity onPress={() => router.push('/city-picker?type=homeDest')} className="flex-row items-center p-3" activeOpacity={0.7}>
              <View className="bg-destructive/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
                <MapPin size={18} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">{t('destination_label', 'Drop-off')}</Text>
                <Text className={dest.name ? 'text-foreground text-base font-semibold' : 'text-muted-foreground text-base'} numberOfLines={1}>
                  {dest.name || t('any', 'Any')}
                </Text>
              </View>
            </TouchableOpacity>

            <View className="h-[1px] bg-border mx-4" />

            {/* Date + Search */}
            <View className="flex-row items-center p-2">
              <View className="flex-1 flex-row items-center justify-between bg-muted rounded-xl p-1 mr-2">
                <TouchableOpacity onPress={() => adjustDate(-1)} className="w-9 h-9 bg-card rounded-lg items-center justify-center shadow-sm">
                  <Text className="text-primary font-bold text-lg">-</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} className="flex-row items-center px-2">
                  <Calendar size={15} color="#f97316" style={{ marginRight: 6 }} />
                  <Text className="text-foreground font-bold text-sm">{formatDisplayDate(date)}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => adjustDate(1)} className="w-9 h-9 bg-card rounded-lg items-center justify-center">
                  <Text className="text-primary font-bold text-lg">+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => router.push(`/search-results?originId=${origin.id}&originName=${encodeURIComponent(origin.name)}&destId=${dest.id}&destName=${encodeURIComponent(dest.name)}&date=${date.toISOString().split('T')[0]}`)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[c.primary, c.accentRose]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ height: 48, width: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Search size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Admin-controlled banner (image or Google ad code) */}
        <AdBanner banner={banner} />

        {/* Recent rides */}
        <View className="px-6 mt-6 mb-10">
          <Text className="text-xl font-bold text-foreground mb-4">{t('recent_active_rides', 'Recent Active Rides')}</Text>
          {isLoading ? (
            <ActivityIndicator color="#f97316" className="mt-10" />
          ) : recentRides.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-muted-foreground italic">{t('no_active_rides', 'No active rides available.')}</Text>
            </View>
          ) : (
            recentRides.map(ride => (
              <RideCard key={ride.id} ride={ride} variant="compact" />
            ))
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}
    </SafeAreaView>
  );
}
