import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, BellOff, Trash2, MapPin, Calendar } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { OneSignal } from 'react-native-onesignal';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await client.get('/rides/alerts/my');
      setAlerts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const checkPushStatus = async () => {
    try {
      const permission = await OneSignal.Notifications.getPermissionAsync();
      const optedIn = OneSignal.User.pushSubscription.getOptedIn();
      setPushEnabled(permission && optedIn);
    } catch {
      setPushEnabled(true);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchAlerts();
    checkPushStatus();
  }, []));

  const togglePush = () => {
    if (pushEnabled) {
      OneSignal.User.pushSubscription.optOut();
      setPushEnabled(false);
      Alert.alert(t('notifications_disabled_title', 'Notifications Disabled'), t('notifications_disabled_desc', 'You will no longer receive push notifications.'));
    } else {
      OneSignal.User.pushSubscription.optIn();
      setPushEnabled(true);
      Alert.alert(t('notifications_enabled_title', 'Notifications Enabled'), t('notifications_enabled_desc', 'You will receive push notifications again.'));
    }
  };

  const deleteAlert = (alertId: string) => {
    Alert.alert(t('delete_alert_title', 'Remove Alert'), t('delete_alert_desc', 'Stop receiving notifications for this route?'), [
      { text: t('cancel', 'Cancel'), style: 'cancel' },
      { text: t('remove', 'Remove'), style: 'destructive', onPress: async () => {
        try {
          await client.delete(`/rides/alerts/${alertId}`);
          setAlerts(prev => prev.filter(a => a.id !== alertId));
        } catch {
          Alert.alert(t('error', 'Error'), t('delete_alert_fail', 'Could not remove alert.'));
        }
      }},
    ]);
  };

  const formatDate = (d: string) => {
    if (!d) return '--';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return d;
  };

  // Filter: only show alerts with target_date >= today
  const today = new Date().toISOString().split('T')[0];
  const activeAlerts = alerts.filter(a => a.target_date >= today);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 py-4 bg-background flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 bg-card border border-border rounded-2xl items-center justify-center mr-3">
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground flex-1">{t('notifications_settings_title', 'Notifications')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} tintColor="#f97316" />}
      >
        {/* Push Notifications Toggle */}
        <Text className="text-xs font-bold text-muted-foreground mb-2.5 ml-1 uppercase tracking-wide">{t('general_section', 'General')}</Text>
        <TouchableOpacity
          onPress={togglePush}
          className={`flex-row items-center justify-between p-4 rounded-3xl border mb-6 ${pushEnabled ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'}`}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center flex-1">
            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${pushEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
              {pushEnabled ? <Bell size={20} color="#f97316" /> : <BellOff size={20} color="#a8a29e" />}
            </View>
            <View className="flex-1">
              <Text className={`font-bold ${pushEnabled ? 'text-primary' : 'text-foreground'}`}>{t('push_notifications_label', 'Push Notifications')}</Text>
              <Text className="text-[11px] text-muted-foreground mt-0.5">{t('push_notifications_desc', 'Bookings, cancellations, and messages')}</Text>
            </View>
          </View>
          <View className={`w-11 h-6 rounded-full px-0.5 justify-center ${pushEnabled ? 'bg-primary' : 'bg-muted'}`}>
            <View className={`w-5 h-5 bg-white rounded-full shadow-sm ${pushEnabled ? 'self-end' : 'self-start'}`} />
          </View>
        </TouchableOpacity>

        {/* Ride Alerts */}
        <Text className="text-xs font-bold text-muted-foreground mb-2.5 ml-1 uppercase tracking-wide">{t('ride_alerts_section', 'Ride Alerts')}</Text>
        <Text className="text-sm text-muted-foreground mb-4 ml-1">{t('ride_alerts_desc', "You'll be notified when a new ride is posted matching these routes.")}</Text>

        {isLoading ? (
          <ActivityIndicator color="#f97316" style={{ marginTop: 20 }} />
        ) : activeAlerts.length === 0 ? (
          <View className="items-center py-10 bg-card rounded-3xl border border-border">
            <View className="bg-muted p-4 rounded-full mb-3">
              <BellOff size={28} color="#a8a29e" />
            </View>
            <Text className="text-foreground font-bold text-base">{t('no_alerts_title', 'No Active Alerts')}</Text>
            <Text className="text-muted-foreground text-sm mt-1 text-center px-8">{t('no_alerts_desc', 'Search for a ride and tap the bell icon to get notified when new rides are posted.')}</Text>
          </View>
        ) : (
          <View className="gap-3">
            {activeAlerts.map(alert => (
              <View key={alert.id} className="bg-card rounded-3xl border border-border p-4 flex-row items-center">
                <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
                  <Bell size={18} color="#f97316" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <MapPin size={12} color="#f97316" style={{ marginRight: 4 }} />
                    <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
                      {alert.origin_city_id ? (alert.origin_city?.name || t('specific_city', 'Specific City')) : t('any', 'Any')}
                      {' → '}
                      {alert.destination_city_id ? (alert.destination_city?.name || t('specific_city', 'Specific City')) : t('any', 'Any')}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <Calendar size={11} color="#a8a29e" style={{ marginRight: 4 }} />
                    <Text className="text-muted-foreground text-xs">{formatDate(alert.target_date)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteAlert(alert.id)} className="bg-destructive/10 p-2.5 rounded-xl ml-2">
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
