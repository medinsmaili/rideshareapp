import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Filter, Info, Bell } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import RideCard from '../components/RideCard';

export default function SearchResultsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { originId, originName, destId, destName, date } = useLocalSearchParams();
  
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchResults = async (signal: { cancelled: boolean } = { cancelled: false }) => {
    try {
      setIsLoading(true);
      const queryParams: any = {};

      if (originId && String(originId).trim() !== '' && String(originId) !== 'undefined' && String(originName) !== t('any', 'Any')) {
        queryParams.origin_city_id = originId;
      }
      if (destId && String(destId).trim() !== '' && String(destId) !== 'undefined' && String(destName) !== t('any', 'Any')) {
        queryParams.destination_city_id = destId;
      }
      if (date && String(date).trim() !== '' && String(date) !== 'undefined') {
        queryParams.date = date;
      }

      const res = await client.get('/rides/search', { params: queryParams });
      if (signal.cancelled) return;
      const allResults = Array.isArray(res.data) ? res.data : [];

      const activeRides = allResults.filter(ride => {
        if (!ride?.departure_time) return false;
        const dt = new Date(ride.departure_time).getTime();
        return Number.isFinite(dt)
          && ride.status !== 'completed'
          && ride.status !== 'cancelled'
          && dt > Date.now();
      });

      setResults(activeRides);
    } catch (error: any) {
      console.error('Search request failed:', error?.response?.data || error.message);
      if (!signal.cancelled) setResults([]);
    } finally {
      if (!signal.cancelled) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchResults(signal);
    return () => { signal.cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originId, destId, date]);

  const handleNotifyMe = async () => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

    const norm = (v: any) => {
      const s = v == null ? '' : String(v).trim();
      if (!s || s === 'undefined' || s === 'null') return null;
      return UUID_RE.test(s) ? s : null;
    };
    const originPayload = norm(originId);
    const destPayload = norm(destId);

    if (!originPayload && !destPayload) {
      Alert.alert(
        t('error', 'Error'),
        t('alert_needs_route', 'Pick an origin or destination first.')
      );
      return;
    }

    const dateStr = typeof date === 'string' && DATE_RE.test(date)
      ? date
      : new Date().toISOString().split('T')[0];

    try {
      await client.post('/rides/alerts', {
        origin_city_id: originPayload,
        destination_city_id: destPayload,
        target_date: dateStr,
      });
      Alert.alert(
        t('alert_set_title', 'Alert Set'),
        t('alert_set_desc', "We'll notify you when a matching ride is posted for this route.")
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      Alert.alert(
        t('error', 'Error'),
        Array.isArray(msg) ? msg[0] : (msg || t('alert_fail', 'Could not set alert. Please try again.'))
      );
    }
  };

  const formatQueryDate = (dStr: any) => {
    if (!dStr || dStr === 'undefined') return '';
    const parts = String(dStr).split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dStr;
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 pt-4 pb-4 border-b border-border bg-card flex-row items-center shadow-sm justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-foreground" />
          </TouchableOpacity>
          <View className="flex-1 px-2">
            <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
              {originName || t('any', 'Any')} → {destName || t('any', 'Any')}
            </Text>
            {/* ✅ Displays DD-MM-YYYY */}
            <Text className="text-xs text-muted-foreground">{formatQueryDate(date)}</Text>
          </View>
        </View>

        {/* ✅ Bell Notification Icon added */}
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={handleNotifyMe} className="p-2 bg-primary/10 rounded-full">
            <Bell size={20} className="text-primary" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 bg-muted rounded-full">
            <Filter size={20} className="text-foreground" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f97316" />
          <Text className="mt-4 text-muted-foreground font-medium">{t('searching', 'Finding rides...')}</Text>
        </View>
      ) : results.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <View className="bg-muted p-6 rounded-full mb-4"><Info size={40} className="text-muted-foreground" /></View>
          <Text className="text-xl font-bold text-foreground text-center">{t('no_rides_found', 'No rides found')}</Text>
          <Text className="text-muted-foreground text-center mt-2 leading-5">
            {t('no_rides_desc', 'There are no active rides available for this search.')}
          </Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={{ padding: 20 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchResults(); }} />}
        >
          {results.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}