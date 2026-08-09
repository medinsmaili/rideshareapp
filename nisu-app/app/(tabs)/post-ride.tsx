import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, Plus, Minus, Car, GraduationCap, CircleCheck, ShieldAlert, Navigation, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useColorScheme } from 'nativewind';
import { useFocusedFetch } from '../../hooks/useFocusedFetch';

export default function PostRideScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [origin, setOrigin] = useState({ id: '', name: '' });
  const [destination, setDestination] = useState({ id: '', name: '' });
  const [originMeetingPoint, setOriginMeetingPoint] = useState<{ id: string; name: string } | null>(null);
  const [destMeetingPoint, setDestMeetingPoint] = useState<{ id: string; name: string } | null>(null);
  const [meetingPoints, setMeetingPoints] = useState<{ origin: any[]; dest: any[] }>({ origin: [], dest: [] });
  const [showMeetingPointModal, setShowMeetingPointModal] = useState<'origin' | 'dest' | null>(null);
  const [departureDate, setDepartureDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState(5.0);
  const [isStudentPricing, setIsStudentPricing] = useState(false);
  const [studentPrice, setStudentPrice] = useState(3.0);
  const [vehicleId, setVehicleId] = useState('');
  const [femaleOnly, setFemaleOnly] = useState(false);

  const fetchMeetingPoints = async (cityId: string, type: 'origin' | 'dest') => {
    try {
      const res = await client.get(`/locations/cities/${cityId}/meeting-points`);
      const points = Array.isArray(res.data) ? res.data : [];
      setMeetingPoints(prev => ({ ...prev, [type]: points }));
    } catch { setMeetingPoints(prev => ({ ...prev, [type]: [] })); }
  };

  const checkSelection = async (signal: { cancelled: boolean }) => {
    try {
      const originStr = await AsyncStorage.getItem('selected_origin');
      const destStr = await AsyncStorage.getItem('selected_destination');
      if (signal.cancelled) return;
      if (originStr && originStr !== 'undefined') {
        try {
          const city = JSON.parse(originStr);
          if (city?.id) {
            setOrigin({ id: city.id, name: city.name });
            setOriginMeetingPoint(null);
            fetchMeetingPoints(city.id, 'origin');
          }
        } catch {}
        await AsyncStorage.removeItem('selected_origin');
      }
      if (destStr && destStr !== 'undefined') {
        try {
          const city = JSON.parse(destStr);
          if (city?.id) {
            setDestination({ id: city.id, name: city.name });
            setDestMeetingPoint(null);
            fetchMeetingPoints(city.id, 'dest');
          }
        } catch {}
        await AsyncStorage.removeItem('selected_destination');
      }
    } catch (e) { console.error('Storage parse error:', e); }
  };

  const fetchVehicles = async (signal: { cancelled: boolean }) => {
    try {
      const res = await client.get('/users/profile');
      if (signal.cancelled) return;
      const userVehicles = Array.isArray(res.data?.vehicles) ? res.data.vehicles : [];
      setVehicles(userVehicles);
      if (userVehicles.length > 0 && !vehicleId) setVehicleId(userVehicles[0].id);
    } catch (e) { console.error('Failed to load vehicles:', e); }
  };

  useFocusedFetch(async (signal) => {
    await Promise.all([checkSelection(signal), fetchVehicles(signal)]);
  }, []);

  const adjustPrice = (setter: any, val: number) => setter((prev: number) => parseFloat(Math.max(0, prev + val).toFixed(2)));

  const formatDisplayDate = (d: Date) => {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    if (d.toDateString() === today.toDateString()) return t('today', 'Today');
    if (d.toDateString() === tomorrow.toDateString()) return t('tomorrow', 'Tomorrow');
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const formatDisplayTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const handlePostRide = async () => {
    if (!origin.id || !destination.id || !vehicleId) {
      Alert.alert(t('error_title', 'Error'), t('fill_all_fields_error', 'Please select cities and a vehicle.'));
      return;
    }

    const finalDateTime = new Date(departureDate);
    finalDateTime.setHours(departureTime.getHours(), departureTime.getMinutes(), 0, 0);

    if (finalDateTime.getTime() < Date.now()) {
      Alert.alert(t('error_title', 'Error'), t('departure_past_error', 'Departure time cannot be in the past.'));
      return;
    }

    setIsLoading(true);
    try {
      await client.post('/rides', {
        origin_city_id: origin.id,
        destination_city_id: destination.id,
        origin_meeting_point_id: originMeetingPoint?.id || undefined,
        destination_meeting_point_id: destMeetingPoint?.id || undefined,
        departure_time: finalDateTime.toISOString(),
        available_seats: seats,
        price_per_seat: price,
        is_student_pricing: isStudentPricing,
        student_price_per_seat: isStudentPricing ? studentPrice : null,
        vehicle_id: vehicleId,
        female_only: femaleOnly,
      });

      Alert.alert(t('success_title', 'Success'), t('ride_posted_msg', 'Your ride has been posted!'), [
        { text: t('ok_btn', 'OK'), onPress: () => router.replace('/(tabs)/my-rides') }
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message;
      Alert.alert(t('error_title', 'Error'), Array.isArray(errorMsg) ? errorMsg[0] : (errorMsg || t('post_ride_fail', 'Failed to post ride')));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100, flexGrow: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">{t('post_ride_header', 'Offer a Ride')}</Text>
          <Text className="text-muted-foreground text-sm mt-1">{t('post_ride_subtitle', 'Share your journey, split the cost')}</Text>
        </View>

        {/* ── Route Card ── */}
        <Text className="text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-wide">{t('route_section', 'Route')}</Text>
        <View className="bg-card border border-border rounded-3xl p-1 mb-6 shadow-sm">
          <TouchableOpacity onPress={() => router.push('/city-picker?type=origin')} className="flex-row items-center p-3.5" activeOpacity={0.7}>
            <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
              <MapPin size={18} color="#f97316" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">{t('origin_label', 'Pickup')}</Text>
              <Text className={origin.name ? "text-foreground text-base font-semibold" : "text-muted-foreground text-base"} numberOfLines={1}>
                {origin.name || t('select_city_placeholder', 'Select City')}
              </Text>
            </View>
          </TouchableOpacity>

          <View className="h-[1px] bg-border mx-4" />

          <TouchableOpacity onPress={() => router.push('/city-picker?type=destination')} className="flex-row items-center p-3.5" activeOpacity={0.7}>
            <View className="bg-destructive/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
              <MapPin size={18} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">{t('destination_label', 'Drop-off')}</Text>
              <Text className={destination.name ? "text-foreground text-base font-semibold" : "text-muted-foreground text-base"} numberOfLines={1}>
                {destination.name || t('select_city_placeholder', 'Select City')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Meeting Points */}
        {(origin.id || destination.id) && (meetingPoints.origin.length > 0 || meetingPoints.dest.length > 0) && (
          <View className="flex-row gap-3 mb-6 -mt-3">
            {origin.id && meetingPoints.origin.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowMeetingPointModal('origin')}
                className="flex-1 bg-card border border-border rounded-2xl p-3 flex-row items-center"
                activeOpacity={0.7}
              >
                <Navigation size={14} color="#f97316" style={{ marginRight: 6 }} />
                <Text className={`text-xs flex-1 ${originMeetingPoint ? 'text-foreground font-semibold' : 'text-muted-foreground'}`} numberOfLines={1}>
                  {originMeetingPoint?.name || t('pickup_point', 'Pickup Point')}
                </Text>
              </TouchableOpacity>
            )}
            {destination.id && meetingPoints.dest.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowMeetingPointModal('dest')}
                className="flex-1 bg-card border border-border rounded-2xl p-3 flex-row items-center"
                activeOpacity={0.7}
              >
                <Navigation size={14} color="#ef4444" style={{ marginRight: 6 }} />
                <Text className={`text-xs flex-1 ${destMeetingPoint ? 'text-foreground font-semibold' : 'text-muted-foreground'}`} numberOfLines={1}>
                  {destMeetingPoint?.name || t('dropoff_point', 'Drop-off Point')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Date & Time ── */}
        <Text className="text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-wide">{t('when_section', 'When')}</Text>
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity onPress={() => setShowDatePicker(true)} className="flex-1 bg-card border border-border rounded-2xl p-3.5 flex-row items-center shadow-sm" activeOpacity={0.7}>
            <View className="bg-primary/10 w-9 h-9 rounded-lg items-center justify-center mr-3">
              <Calendar size={16} color="#f97316" />
            </View>
            <View>
              <Text className="text-[10px] text-muted-foreground uppercase font-bold">{t('date_label', 'Date')}</Text>
              <Text className="text-foreground font-bold text-sm">{formatDisplayDate(departureDate)}</Text>
            </View>
          </TouchableOpacity>

          <View className="flex-1 bg-card border border-border rounded-2xl p-2 flex-row items-center justify-between shadow-sm">
            <TouchableOpacity onPress={() => { const d = new Date(departureTime); d.setMinutes(d.getMinutes() - 15); setDepartureTime(d); }} className="bg-muted w-9 h-9 rounded-lg items-center justify-center">
              <Minus size={16} color="#f97316" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} className="items-center">
              <Text className="text-[10px] text-muted-foreground uppercase font-bold">{t('time_label', 'Time')}</Text>
              <Text className="text-foreground font-bold text-sm">{formatDisplayTime(departureTime)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { const d = new Date(departureTime); d.setMinutes(d.getMinutes() + 15); setDepartureTime(d); }} className="bg-muted w-9 h-9 rounded-lg items-center justify-center">
              <Plus size={16} color="#f97316" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Seats & Price ── */}
        <Text className="text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-wide">{t('details_section', 'Details')}</Text>
        <View className="flex-row gap-3 mb-6">
          {/* Seats */}
          <View className="flex-1 bg-card border border-border rounded-2xl p-2 shadow-sm">
            <Text className="text-[10px] text-muted-foreground uppercase font-bold text-center mb-2">{t('seats_label', 'Seats')}</Text>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setSeats(Math.max(1, seats - 1))} className="bg-muted w-9 h-9 rounded-lg items-center justify-center">
                <Minus size={16} color="#f97316" />
              </TouchableOpacity>
              <View className="items-center">
                <Text className="text-foreground font-extrabold text-2xl">{seats}</Text>
              </View>
              <TouchableOpacity onPress={() => setSeats(Math.min(6, seats + 1))} className="bg-muted w-9 h-9 rounded-lg items-center justify-center">
                <Plus size={16} color="#f97316" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Price */}
          <View className="flex-1 bg-card border border-border rounded-2xl p-2 shadow-sm">
            <Text className="text-[10px] text-muted-foreground uppercase font-bold text-center mb-2">{t('price_per_seat_label', 'Price (€)')}</Text>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => adjustPrice(setPrice, -0.5)} className="bg-muted w-9 h-9 rounded-lg items-center justify-center">
                <Minus size={16} color="#f97316" />
              </TouchableOpacity>
              <Text className="text-foreground font-extrabold text-2xl">
                {price === 0 ? t('free', 'Free') : price.toFixed(1)}
              </Text>
              <TouchableOpacity onPress={() => adjustPrice(setPrice, 0.5)} className="bg-muted w-9 h-9 rounded-lg items-center justify-center">
                <Plus size={16} color="#f97316" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Options ── */}
        <Text className="text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-wide">{t('options_section', 'Options')}</Text>
        <View className="gap-3 mb-6">
          {/* Student Pricing Toggle */}
          <TouchableOpacity
            onPress={() => setIsStudentPricing(!isStudentPricing)}
            className={`flex-row items-center justify-between p-4 rounded-2xl border ${isStudentPricing ? 'bg-amber-500/5 border-amber-500/40' : 'bg-card border-border'}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <View className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${isStudentPricing ? 'bg-amber-500/10' : 'bg-muted'}`}>
                <GraduationCap size={18} color={isStudentPricing ? '#d97706' : '#a8a29e'} />
              </View>
              <View className="flex-1">
                <Text className={`font-bold ${isStudentPricing ? 'text-amber-700' : 'text-foreground'}`}>{t('student_pricing_btn', 'Student Pricing')}</Text>
                <Text className="text-[11px] text-muted-foreground mt-0.5">{t('student_pricing_desc', 'Offer a discount for verified students')}</Text>
              </View>
            </View>
            <View className={`w-11 h-6 rounded-full px-0.5 justify-center ${isStudentPricing ? 'bg-amber-500' : 'bg-muted'}`}>
              <View className={`w-5 h-5 bg-white rounded-full shadow-sm ${isStudentPricing ? 'self-end' : 'self-start'}`} />
            </View>
          </TouchableOpacity>

          {/* Student Price Adjuster */}
          {isStudentPricing && (
            <View className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex-row items-center justify-between">
              <Text className="text-amber-700 font-medium">{t('discounted_price_text', 'Student Price:')}</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={() => adjustPrice(setStudentPrice, -0.5)} className="bg-amber-500/10 w-8 h-8 rounded-lg items-center justify-center">
                  <Minus size={14} color="#d97706" />
                </TouchableOpacity>
                <Text className="text-amber-700 font-extrabold text-xl min-w-[50] text-center">€{studentPrice.toFixed(1)}</Text>
                <TouchableOpacity onPress={() => adjustPrice(setStudentPrice, 0.5)} className="bg-amber-500/10 w-8 h-8 rounded-lg items-center justify-center">
                  <Plus size={14} color="#d97706" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Female Only Toggle */}
          <TouchableOpacity
            onPress={() => setFemaleOnly(!femaleOnly)}
            className={`flex-row items-center justify-between p-4 rounded-2xl border ${femaleOnly ? 'bg-pink-500/5 border-pink-500/40' : 'bg-card border-border'}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <View className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${femaleOnly ? 'bg-pink-500/10' : 'bg-muted'}`}>
                <ShieldAlert size={18} color={femaleOnly ? '#db2777' : '#a8a29e'} />
              </View>
              <View className="flex-1">
                <Text className={`font-bold ${femaleOnly ? 'text-pink-600' : 'text-foreground'}`}>{t('female_only_btn', 'Female Only')}</Text>
                <Text className="text-[11px] text-muted-foreground mt-0.5">{t('female_only_desc', 'Only female passengers can book')}</Text>
              </View>
            </View>
            <View className={`w-11 h-6 rounded-full px-0.5 justify-center ${femaleOnly ? 'bg-pink-500' : 'bg-muted'}`}>
              <View className={`w-5 h-5 bg-white rounded-full shadow-sm ${femaleOnly ? 'self-end' : 'self-start'}`} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Vehicle Selection ── */}
        <Text className="text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-wide">{t('select_vehicle_label', 'Vehicle')}</Text>
        <View style={styles.vehicleGrid}>
          {vehicles.map((v) => {
            const isActive = vehicleId === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                onPress={() => setVehicleId(v.id)}
                style={styles.vehicleItem}
                className={`border-2 ${isActive ? 'bg-primary/5 border-primary' : 'bg-card border-border'}`}
                activeOpacity={0.7}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Car size={20} color={isActive ? '#f97316' : '#a8a29e'} />
                </View>
                <Text className={`font-bold text-sm ${isActive ? 'text-primary' : 'text-foreground'}`} numberOfLines={1}>{v.brand}</Text>
                <Text className="text-[10px] text-muted-foreground uppercase mt-0.5">{v.color} • {v.license_plate}</Text>
                {isActive && (
                  <View className="absolute top-2.5 right-2.5">
                    <CircleCheck size={16} color="#f97316" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {vehicles.length < 4 && (
            <TouchableOpacity
              onPress={() => router.push('/my-vehicles')}
              style={styles.vehicleItem}
              className="bg-muted/50 border-2 border-dashed border-border items-center justify-center"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center bg-muted mb-2">
                <Plus size={20} color="#a8a29e" />
              </View>
              <Text className="text-muted-foreground text-xs font-medium">{t('add_vehicle_btn', 'Add Vehicle')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Summary Preview ── */}
        {origin.name && destination.name && vehicleId && (
          <View className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mt-6 mb-2">
            <Text className="text-xs font-bold text-primary uppercase mb-2">{t('summary_label', 'Summary')}</Text>
            <Text className="text-foreground font-semibold text-sm">
              {origin.name} → {destination.name}
            </Text>
            <Text className="text-muted-foreground text-xs mt-1">
              {formatDisplayDate(departureDate)} • {formatDisplayTime(departureTime)} • {seats} {t('seats_label', 'seats')} • {price === 0 ? t('free', 'Free') : `${price.toFixed(1)}€`}
              {selectedVehicle ? ` • ${selectedVehicle.brand}` : ''}
            </Text>
          </View>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity className="overflow-hidden rounded-3xl mt-6" onPress={handlePostRide} disabled={isLoading} activeOpacity={0.85} style={{ shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 }}>
          <LinearGradient colors={['#f97316', '#f43f5e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">{t('post_ride_btn', 'Post Ride')}</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {showDatePicker && <DateTimePicker value={departureDate} mode="date" minimumDate={new Date()} onChange={(e, d) => { setShowDatePicker(false); if (d) setDepartureDate(d); }} />}
        {showTimePicker && <DateTimePicker value={departureTime} mode="time" is24Hour={true} onChange={(e, d) => { setShowTimePicker(false); if (d) setDepartureTime(d); }} />}
      </ScrollView>

      {/* Meeting Point Selection Modal */}
      <Modal visible={showMeetingPointModal !== null} animationType="slide" transparent onRequestClose={() => setShowMeetingPointModal(null)}>
        <View style={mpStyles.overlay}>
          <View style={[mpStyles.sheet, { backgroundColor: isDark ? '#292524' : '#ffffff' }]}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">
                {showMeetingPointModal === 'origin' ? t('select_pickup_point', 'Select Pickup Point') : t('select_dropoff_point', 'Select Drop-off Point')}
              </Text>
              <TouchableOpacity onPress={() => setShowMeetingPointModal(null)} className="bg-muted p-2 rounded-full">
                <X size={18} className="text-foreground" />
              </TouchableOpacity>
            </View>

            {/* None option */}
            <TouchableOpacity
              onPress={() => {
                if (showMeetingPointModal === 'origin') setOriginMeetingPoint(null);
                else setDestMeetingPoint(null);
                setShowMeetingPointModal(null);
              }}
              className="flex-row items-center p-4 rounded-2xl mb-2 border border-border bg-card"
            >
              <Text className="text-muted-foreground font-medium">{t('no_meeting_point', 'No specific point')}</Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 300 }}>
              {(showMeetingPointModal === 'origin' ? meetingPoints.origin : meetingPoints.dest).map((point: any) => {
                const isSelected = showMeetingPointModal === 'origin'
                  ? originMeetingPoint?.id === point.id
                  : destMeetingPoint?.id === point.id;
                return (
                  <TouchableOpacity
                    key={point.id}
                    onPress={() => {
                      const mp = { id: point.id, name: point.name };
                      if (showMeetingPointModal === 'origin') setOriginMeetingPoint(mp);
                      else setDestMeetingPoint(mp);
                      setShowMeetingPointModal(null);
                    }}
                    className={`flex-row items-center p-4 rounded-2xl mb-2 border ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                  >
                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Navigation size={14} color={isSelected ? '#f97316' : '#a8a29e'} />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{point.name}</Text>
                      {point.address && <Text className="text-xs text-muted-foreground mt-0.5">{point.address}</Text>}
                    </View>
                    {isSelected && <CircleCheck size={18} color="#f97316" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vehicleItem: { width: '47%', borderRadius: 16, padding: 14, minHeight: 100, justifyContent: 'center' },
});

const mpStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '60%' },
});
