import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import RideCard from '../../components/RideCard';
import { useRouter } from 'expo-router';
import client from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useFocusedFetch } from '../../hooks/useFocusedFetch';

export default function MyRidesScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'driver'>('upcoming');

  const [upcomingRides, setUpcomingRides] = useState<any[]>([]);
  const [pastRides, setPastRides] = useState<any[]>([]);
  const [driverRides, setDriverRides] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const { t } = useLanguage();
  const isDark = useColorScheme() === 'dark';

  const theme = {
    bg: isDark ? '#171412' : '#fefbf6',
    card: isDark ? '#292524' : '#ffffff',
    text: isDark ? '#fafaf9' : '#1c1917',
    mutedText: isDark ? '#a8a29e' : '#78716c',
    border: isDark ? '#44403c' : '#f0e9e0',
    primary: isDark ? '#fb923c' : '#f97316',
    primaryLight: isDark ? 'rgba(249,115,22,0.18)' : 'rgba(249,115,22,0.12)',
    destructive: '#ef4444',
    destructiveLight: isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.1)',
    emerald: isDark ? '#34d399' : '#059669',
    emeraldLight: isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.1)',
    mutedBg: isDark ? '#332e2c' : '#f5efe6',
    amber: '#d97706',
    amberLight: isDark ? 'rgba(217,119,6,0.18)' : 'rgba(251,191,36,0.12)',
  };


  const isFuture = (ride: any) => {
    if (!ride?.departure_time) return false;
    try {
      const d = new Date(ride.departure_time);
      return !isNaN(d.getTime()) && ride.status !== 'completed' && ride.status !== 'cancelled' && d.getTime() > Date.now();
    } catch { return false; }
  };

  const fetchRides = async (signal: { cancelled: boolean } = { cancelled: false }) => {
    try {
      const [driverRes, bookingsRes] = await Promise.allSettled([
        client.get('/rides/my-rides'),
        client.get('/bookings/my-bookings'),
      ]);
      if (signal.cancelled) return;

      const fetchedDriverRides = driverRes.status === 'fulfilled' && Array.isArray(driverRes.value.data) ? driverRes.value.data : [];
      const fetchedBookings = bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value.data) ? bookingsRes.value.data : [];

      const passengerRides = fetchedBookings
        .map((b: any) => b?.ride)
        .filter((r: any) => r && r.id);

      // Dedup passenger rides — a driver may also be a passenger on other rides
      const passengerMap = new Map<string, any>();
      passengerRides.forEach((r: any) => passengerMap.set(r.id, r));
      const allPassengerRides = Array.from(passengerMap.values());

      const upcoming = allPassengerRides.filter(isFuture);
      const past = allPassengerRides.filter((r: any) => !isFuture(r));

      const safeTime = (d: any) => {
        const t = new Date(d).getTime();
        return Number.isFinite(t) ? t : 0;
      };
      upcoming.sort((a, b) => safeTime(a.departure_time) - safeTime(b.departure_time));
      past.sort((a, b) => safeTime(b.departure_time) - safeTime(a.departure_time));
      fetchedDriverRides.sort((a: any, b: any) => safeTime(b.departure_time) - safeTime(a.departure_time));

      if (signal.cancelled) return;
      setUpcomingRides(upcoming);
      setPastRides(past);
      setDriverRides(fetchedDriverRides);
    } catch (error) {
      console.error('Failed to fetch rides', error);
    } finally {
      if (!signal.cancelled) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  };

  useFocusedFetch((signal) => fetchRides(signal), []);


  const getStatusStyle = (item: any) => {
    if (item.status === 'completed') return { bg: theme.emeraldLight, text: theme.emerald, label: t('status_completed', 'Completed') };
    if (item.status === 'cancelled') return { bg: theme.destructiveLight, text: theme.destructive, label: t('status_cancelled', 'Cancelled') };
    if (isFuture(item)) return { bg: theme.primaryLight, text: theme.primary, label: t('status_upcoming', 'Upcoming') };
    return { bg: theme.amberLight, text: theme.amber, label: t('status_past', 'Past') };
  };

  const displayData = activeTab === 'upcoming' ? upcomingRides : activeTab === 'history' ? pastRides : driverRides;

  const renderRideCard = ({ item }: { item: any }) => {
    if (!item) return null;
    const status = getStatusStyle(item);
    const isDriverCard = activeTab === 'driver';

    return (
      <View style={{ marginHorizontal: 24 }}>
        <RideCard
          ride={item}
          variant={isDriverCard ? 'driver' : 'compact'}
          showStatus={{ label: status.label, color: status.text, bg: status.bg }}
        />
      </View>
    );
  };

  const TABS = [
    { key: 'upcoming', label: t('upcoming_tab', 'Upcoming'), count: upcomingRides.length },
    { key: 'history', label: t('history_tab', 'History'), count: pastRides.length },
    { key: 'driver', label: t('driver_tab', 'My Rides'), count: driverRides.length },
  ] as const;

  const EmptyState = () => {
    const configs = {
      upcoming: { title: t('no_upcoming_title', 'No Upcoming Trips'), desc: t('no_upcoming_desc', 'Book a ride to see it here.'), btn: t('find_ride_btn', 'Find a Ride'), action: () => router.push('/' as any) },
      history: { title: t('no_history_title', 'No Past Rides'), desc: t('no_history_desc', 'Your completed journeys will appear here.'), btn: null, action: null },
      driver: { title: t('no_rides_offered_title', 'No Rides Offered'), desc: t('no_rides_offered_desc', "You haven't posted any rides yet."), btn: t('offer_ride_btn', 'Offer a Ride'), action: () => router.push('/post-ride' as any) },
    };
    const cfg = configs[activeTab];
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrapper, { backgroundColor: theme.mutedBg }]}>
          <MapPin size={40} color={theme.mutedText} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>{cfg.title}</Text>
        <Text style={[styles.emptyDesc, { color: theme.mutedText }]}>{cfg.desc}</Text>
        {cfg.btn && cfg.action && (
          <TouchableOpacity onPress={cfg.action} style={[styles.emptyButton, { backgroundColor: theme.primary }]}>
            <Text style={styles.emptyButtonText}>{cfg.btn}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('my_rides_title', 'My Rides')}</Text>
        <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>{t('my_rides_subtitle', 'Manage your journeys')}</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabButton, activeTab === tab.key && { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.key ? '#fff' : theme.mutedText }]} numberOfLines={1}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.3)' : theme.primaryLight }]}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: activeTab === tab.key ? '#fff' : theme.primary }}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={displayData}
          keyExtractor={(item, i) => item?.id ? String(item.id) : String(i)}
          renderItem={renderRideCard}
          contentContainerStyle={displayData.length === 0 ? { flex: 1 } : { paddingBottom: 100, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRides(); }} tintColor={theme.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 30, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  tabContainer: { flexDirection: 'row', padding: 4, borderRadius: 24, marginHorizontal: 24, marginBottom: 20, borderWidth: 1 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabText: { fontWeight: 'bold', fontSize: 12 },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99, minWidth: 18, alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  emptyIconWrapper: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  emptyDesc: { textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  emptyButton: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24 },
  emptyButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
