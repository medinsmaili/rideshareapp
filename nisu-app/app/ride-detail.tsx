import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, Linking, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusedFetch } from '../hooks/useFocusedFetch';
import { MapPin, Calendar, Clock, Users, Euro, MessageCircle, ArrowLeft, Car, ShieldCheck, GraduationCap, CheckCircle, Star, XCircle, Info, Phone, Flag, Share2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RideDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth(); 
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fgColor = isDark ? '#fefbf6' : '#1c1917';

  const rideId = Array.isArray(id) ? id[0] : id;

  const [ride, setRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportedUser, setReportedUser] = useState<{id: string, name: string} | null>(null);

  const fetchRideDetails = async (signal: { cancelled: boolean } = { cancelled: false }) => {
    try {
      const res = await client.get(`/rides/${rideId}`);
      if (signal.cancelled) return;
      setRide(res.data);
    } catch (error) {
      if (signal.cancelled) return;
      Alert.alert(t('error', 'Error'), t('load_details_error', 'Could not load ride details.'));
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } finally {
      if (!signal.cancelled) setIsLoading(false);
    }
  };

  useFocusedFetch((signal) => fetchRideDetails(signal), [rideId]);

  const isDriver = user?.id === ride?.driver?.id || user?.id === ride?.driver_id;
  const booking = ride?.bookings?.find((b: any) => b.passenger?.id === user?.id || b.user_id === user?.id);
  const isBooked = !!booking;
  const reservedSpots = ride?.reserved_spots || 0;
  const seatsRemaining = (ride?.total_seats || 0) - (ride?.seats_taken || 0) - reservedSpots;
  
  const departureDate = ride?.departure_time ? new Date(ride.departure_time) : null;
  const departureMs = departureDate && !isNaN(departureDate.getTime()) ? departureDate.getTime() : null;
  const isPastDeparture = departureMs !== null && departureMs < Date.now();
  const isCompleted = ride?.status === 'completed';
  const isCancelled = ride?.status === 'cancelled';

  const isPastGracePeriod = departureMs !== null && Date.now() > departureMs + 30 * 60000;
  const isChatDisabled = (!isDriver && !isBooked) || isCancelled || isCompleted || isPastGracePeriod;
  
  const isCallDisabled = isPastDeparture || isCompleted || isCancelled;

  const rawGender = String(user?.gender || '').toUpperCase().trim();
  const isFemale = rawGender.startsWith('F') || rawGender === 'FEMALE' || rawGender === 'ZENSKI' || rawGender === 'ŽENSKI' || rawGender === 'WEIBLICH';
  const isFemaleOnlyRestricted = ride?.female_only && !isFemale && !isDriver;

  const handleReserveSpot = async () => {
    setIsActionLoading(true);
    try {
      await client.put(`/rides/${ride.id}/reserve-spot`);
      Alert.alert(t('success', 'Success'), t('spot_reserved', 'A spot has been reserved.'));
      fetchRideDetails();
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.response?.data?.message || t('action_failed', 'Action failed.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnreserveSpot = async () => {
    setIsActionLoading(true);
    try {
      await client.put(`/rides/${ride.id}/unreserve-spot`);
      Alert.alert(t('success', 'Success'), t('spot_unreserved', 'Reserved spot has been released.'));
      fetchRideDetails();
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.response?.data?.message || t('action_failed', 'Action failed.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const openChatScreen = () => {
    if (isChatDisabled) return;
    const chatTitle = encodeURIComponent(`${ride.origin_city?.name} → ${ride.destination_city?.name}`);
    router.push(`/group-chat?rideId=${ride.id}&title=${chatTitle}`);
  };

  const handleShare = async () => {
    try {
      const origin = ride.origin_city?.name || '';
      const dest = ride.destination_city?.name || '';
      const msg = `${t('share_ride_message', 'Join my ride on Nisu')} ${origin ? `(${origin} → ${dest})` : ''}\n${t('download_app_text', 'Download Nisu to book:')} https://nisu.app`;
      await Share.share({
        title: `Nisu Ride: ${origin} → ${dest}`,
        message: msg,
      });
    } catch (error) {
      console.error('Error sharing ride:', error);
    }
  };
  
  const handleBooking = async () => {
    if (isBooked || isDriver) {
      openChatScreen();
      return;
    }
    const priceToPay = user?.is_student_verified && ride.is_student_pricing ? ride.student_price_per_seat : ride.price_per_seat;
    Alert.alert(t('book_seat', 'Book Seat'), `${t('book_confirm', 'Do you want to book 1 seat for')} ${priceToPay}€?`, [
      { text: t('cancel', 'Cancel'), style: 'cancel' },
      { text: t('book_now', 'Book Now'), onPress: async () => {
          setIsActionLoading(true);
          try {
            await client.post('/bookings', { ride_id: ride.id, seats: 1 });
            Alert.alert(t('success', 'Success'), t('seat_booked_success', 'Seat booked!'));
            fetchRideDetails();
          } catch (e: any) { Alert.alert(t('booking_failed', 'Booking Failed'), e.response?.data?.message || t('try_again', 'Try again later.')); }
          finally { setIsActionLoading(false); }
      }}
    ]);
  };

  const handleCancelBooking = () => {
    Alert.alert(t('cancel_booking', 'Cancel Booking'), t('cancel_booking_confirm', 'Are you sure you want to cancel your seat?'), [
      { text: t('no', 'No'), style: 'cancel' },
      { text: t('yes_cancel', 'Yes, Cancel'), style: 'destructive', onPress: async () => {
          setIsActionLoading(true);
          try {
            await client.delete(`/bookings/${booking.id}`);
            Alert.alert(t('cancelled', 'Cancelled'), t('booking_removed', 'Your booking has been removed.'));
            fetchRideDetails();
          } catch (e) { Alert.alert(t('error', 'Error'), t('cancel_error', 'Could not cancel booking.')); }
          finally { setIsActionLoading(false); }
      }}
    ]);
  };

  const submitCancelRide = async () => {
    if (!cancelReason || cancelReason.trim().length < 5) {
      Alert.alert(t('error', 'Error'), t('valid_reason_error', 'Please provide a valid reason (min 5 characters).'));
      return;
    }
    setIsActionLoading(true);
    try {
      await client.put(`/rides/${ride.id}/cancel`, { reason: cancelReason });
      setIsCancelModalVisible(false);
      Alert.alert(t('ride_cancelled', 'Ride Cancelled'), t('passengers_notified', 'Passengers have been notified.'));
      fetchRideDetails();
    } catch (e) { Alert.alert(t('error', 'Error'), t('cancel_error', 'Could not cancel ride.')); }
    finally { setIsActionLoading(false); }
  };

  const handleCompleteRide = () => {
    Alert.alert(t('complete_ride', 'Complete Ride'), t('mark_completed_confirm', 'Mark this ride as completed?'), [
      { text: t('cancel', 'Cancel'), style: 'cancel' },
      { text: t('mark_completed', 'Mark Completed'), onPress: async () => {
          setIsActionLoading(true);
          try {
            await client.put(`/rides/${ride.id}`, { status: 'completed' });
            Alert.alert(t('success', 'Success'), t('ride_completed_success', 'Ride marked as completed!'));
            fetchRideDetails();
          } catch (e) { Alert.alert(t('error', 'Error'), t('status_update_error', 'Could not update status.')); }
          finally { setIsActionLoading(false); }
      }}
    ]);
  };

  const handleCall = (phone?: string) => {
    if (isCallDisabled) return;
    if (!phone) {
      Alert.alert(t('error', 'Error'), t('no_phone', 'Phone number not available.'));
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleReportClick = (id: string, name: string) => {
    setReportedUser({ id, name });
    setIsReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!reportReason || reportReason.trim().length < 5) {
      Alert.alert(t('error', 'Error'), t('valid_reason_error', 'Please provide a valid reason.'));
      return;
    }
    setIsActionLoading(true);
    try {
      await client.post('/reports', {
        reported_user_id: reportedUser?.id,
        ride_id: ride.id,
        reason: reportReason
      });
      setIsReportModalVisible(false);
      setReportReason('');
      Alert.alert(t('success', 'Success'), t('report_submitted', 'Thank you. Report submitted successfully.'));
    } catch (e) {
      Alert.alert(t('error', 'Error'), t('report_error', 'Failed to submit report.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const getAvatarUrl = (path?: string, firstName: string = 'User') => {
    if (!path) return `https://ui-avatars.com/api/?name=${firstName}&background=f97316&color=fff`;
    if (path.startsWith('http')) return path;
    return `https://api.nisu.app/${path.startsWith('/') ? path.substring(1) : path}`;
  };

  const openRatingScreen = () => {
    const driverName = encodeURIComponent(ride.driver?.first_name || '');
    const driverAvatar = encodeURIComponent(ride.driver?.profile_picture || '');
    router.push(`/rating-review?driverId=${ride.driver?.id}&driverName=${driverName}&driverAvatar=${driverAvatar}`);
  };

  if (isLoading) return <View style={styles.centerBox}><ActivityIndicator size="large" color="#f97316" /></View>;
  if (!ride) return <View style={styles.centerBox}><Text style={{ color: fgColor, fontWeight: 'bold' }}>{t('ride_not_found', 'Ride not found')}</Text></View>;

  const displayDate = !departureDate || isNaN(departureDate.getTime())
    ? '--'
    : `${String(departureDate.getDate()).padStart(2, '0')}-${String(departureDate.getMonth() + 1).padStart(2, '0')}-${departureDate.getFullYear()}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border bg-card">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2"><ArrowLeft size={24} color={fgColor} /></TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">{t('ride_details', 'Ride Details')}</Text>
        
        {/* ✅ Share Icon added to Header */}
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={handleShare}>
            <Share2 size={24} color="#f97316" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openChatScreen} disabled={isChatDisabled} className={isChatDisabled ? "opacity-20" : ""}>
            <MessageCircle size={24} color="#f97316" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, flexGrow: 1 }} style={{ flex: 1 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchRideDetails} tintColor="#f97316" />}>
        {isCancelled && (
          <View className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl mb-6 flex-row items-center justify-center">
            <XCircle size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text className="text-destructive font-bold text-base">{t('ride_cancelled_status', 'This ride has been cancelled')}</Text>
          </View>
        )}
        {isCompleted && (
          <View className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-6 flex-row items-center justify-center">
            <CheckCircle size={20} color="#059669" style={{ marginRight: 8 }} />
            <Text className="text-emerald-600 font-bold text-base">{t('ride_completed_status', 'This ride has been completed')}</Text>
          </View>
        )}

        <View className="bg-card rounded-3xl p-6 border border-border shadow-sm mb-6">
          <View className="flex-row items-center mb-6">
            <View className="items-center mr-4">
              <View className="w-3 h-3 rounded-full bg-primary" />
              <View className="w-0.5 h-12 bg-border my-1" />
              <View className="w-3 h-3 rounded-full bg-destructive" />
            </View>
            <View className="flex-1 justify-between h-20">
              <View>
                <Text className="text-xs text-muted-foreground uppercase font-bold">{t('departure_label', 'Departure')}</Text>
                <Text className="text-xl font-bold text-foreground">{ride.origin_city?.name}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted-foreground uppercase font-bold">{t('destination_label', 'Destination')}</Text>
                <Text className="text-xl font-bold text-foreground">{ride.destination_city?.name}</Text>
              </View>
            </View>
          </View>
          {/* Meeting Points */}
          {(ride.origin_meeting_point || ride.destination_meeting_point) && (
            <View className="border-t border-border pt-3 mb-3">
              {ride.origin_meeting_point && (
                <View className="flex-row items-center mb-1.5">
                  <MapPin size={12} color="#f97316" style={{ marginRight: 6 }} />
                  <Text className="text-xs text-muted-foreground">{t('pickup_at', 'Pickup:')} <Text className="font-semibold text-foreground">{ride.origin_meeting_point.name}</Text></Text>
                </View>
              )}
              {ride.destination_meeting_point && (
                <View className="flex-row items-center">
                  <MapPin size={12} color="#ef4444" style={{ marginRight: 6 }} />
                  <Text className="text-xs text-muted-foreground">{t('dropoff_at', 'Drop-off:')} <Text className="font-semibold text-foreground">{ride.destination_meeting_point.name}</Text></Text>
                </View>
              )}
            </View>
          )}

          <View className="flex-row justify-between border-t border-border pt-4">
            <View className="flex-row items-center">
              <Calendar size={16} color="#a8a29e" style={{ marginRight: 8 }} />
              <Text className="text-foreground font-semibold">{displayDate}</Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={16} color="#f97316" style={{ marginRight: 8 }} />
              <Text className="text-foreground font-semibold">{new Date(ride.departure_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false})}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {ride.female_only && (
            <View className="bg-pink-500/10 px-3 py-1.5 rounded-full flex-row items-center border border-pink-500/20">
              <Info size={14} color="#db2777" style={{ marginRight: 8 }} />
              <Text className="text-pink-600 font-bold text-xs">{t('female_only_badge', 'Female Only')}</Text>
            </View>
          )}
          <View className="bg-primary/10 px-3 py-1.5 rounded-full flex-row items-center border border-primary/20">
            <Users size={14} color="#f97316" style={{ marginRight: 8 }} />
            <Text className="text-primary font-bold text-xs">{seatsRemaining} {t('seats_left', 'Seats Left')}</Text>
          </View>
          {reservedSpots > 0 && (
            <View className="bg-amber-500/10 px-3 py-1.5 rounded-full flex-row items-center border border-amber-500/20">
              <Text className="text-amber-600 font-bold text-xs">{reservedSpots} {t('reserved_badge', 'Reserved')}</Text>
            </View>
          )}
        </View>

        <Text className="text-lg font-bold text-foreground mb-3">{t('driver', 'Driver')}</Text>
        <View className="flex-row items-center bg-card p-4 rounded-3xl border border-border mb-6">
          <Image source={{ uri: getAvatarUrl(ride.driver?.profile_picture, ride.driver?.first_name) }} className="w-14 h-14 rounded-full mr-4" />
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">{ride.driver?.first_name} {ride.driver?.last_name}</Text>
            <View className="flex-row items-center">
              <ShieldCheck size={14} color="#f97316" style={{ marginRight: 4 }} />
              <Text className="text-xs text-muted-foreground">{ride.driver?.is_verified_driver ? t('verified_driver', 'Verified Driver') : t('standard_member', 'Standard Member')}</Text>
            </View>
          </View>
          {!isDriver && (
            <View className="flex-row items-center gap-4">
              {isBooked && (
                <TouchableOpacity onPress={() => handleCall(ride.driver?.phone_number)} disabled={isCallDisabled} className={`p-2 rounded-full ${isCallDisabled ? 'bg-muted/50' : 'bg-primary/10'}`}>
                  <Phone size={20} color={isCallDisabled ? '#a8a29e' : '#f97316'} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleReportClick(ride.driver?.id, ride.driver?.first_name)} className="bg-destructive/10 p-2 rounded-full">
                <Flag size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text className="text-lg font-bold text-foreground mb-3">{t('vehicle_info', 'Vehicle Info')}</Text>
        <View className="bg-card p-4 rounded-3xl border border-border mb-6 flex-row items-center">
          <View className="bg-muted p-3 rounded-xl mr-4">
            <Car size={24} color="#f97316" />
          </View>
          <View>
             <Text className="text-foreground font-bold text-base">{ride.vehicle?.brand || t('unknown_car', 'Vehicle')}</Text>
             <Text className="text-muted-foreground text-xs uppercase">{ride.vehicle?.color} • {ride.vehicle?.license_plate}</Text>
          </View>
        </View>

        {isDriver ? (
          <>
            <Text className="text-lg font-bold text-foreground mb-3">{t('passenger_list', 'Passenger List')} ({ride.bookings?.length || 0})</Text>
            {ride.bookings?.length === 0 ? (
              <View className="p-8 items-center bg-muted/30 rounded-3xl border border-dashed border-border mb-6">
                <Users size={32} color="#a8a29e" style={{ marginBottom: 8 }} />
                <Text className="text-muted-foreground">{t('no_bookings_yet', 'No bookings yet.')}</Text>
              </View>
            ) : (
              ride.bookings?.map((booking: any) => (
                <View key={booking.id} className="flex-row items-center bg-card p-3 rounded-2xl border border-border mb-2">
                  <Image source={{ uri: getAvatarUrl(booking.passenger?.profile_picture, booking.passenger?.first_name) }} className="w-10 h-10 rounded-full mr-3" />
                  <View className="flex-1"><Text className="text-foreground font-bold">{booking.passenger?.first_name} {booking.passenger?.last_name}</Text></View>
                  <View className="flex-row items-center gap-4 px-2">
                    <TouchableOpacity onPress={() => handleCall(booking.passenger?.phone_number)} disabled={isCallDisabled} className={`p-2 rounded-full ${isCallDisabled ? 'bg-muted/50' : 'bg-primary/10'}`}>
                      <Phone size={20} color={isCallDisabled ? '#a8a29e' : '#f97316'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReportClick(booking.passenger?.id, booking.passenger?.first_name)} className="bg-destructive/10 p-2 rounded-full">
                      <Flag size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            
            {!isCompleted && !isCancelled && (
              <View className="bg-card p-4 rounded-3xl border border-border mb-6">
                <Text className="text-lg font-bold text-foreground mb-1">{t('reserve_spot_title', 'Reserve a Spot')}</Text>
                <Text className="text-muted-foreground text-xs mb-4">{t('reserve_spot_desc', 'Block a seat for a friend or companion without reducing capacity.')}</Text>

                {/* Reserved spots indicator */}
                {reservedSpots > 0 && (
                  <View className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 mb-3 flex-row items-center justify-between">
                    <Text className="text-amber-700 font-semibold text-sm">{reservedSpots} {reservedSpots === 1 ? t('spot_reserved_single', 'spot reserved') : t('spots_reserved_plural', 'spots reserved')}</Text>
                    <TouchableOpacity onPress={handleUnreserveSpot} disabled={isActionLoading} className="bg-amber-500/10 px-3 py-1.5 rounded-lg">
                      <Text className="text-amber-700 font-bold text-xs">{t('release_spot', 'Release')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity onPress={handleReserveSpot} disabled={isActionLoading || seatsRemaining <= 0} className={`py-3.5 rounded-xl items-center flex-row justify-center ${seatsRemaining <= 0 ? 'bg-muted' : 'bg-primary/10 border border-primary/20'}`}>
                  <Users size={16} color={seatsRemaining <= 0 ? '#a8a29e' : '#f97316'} style={{ marginRight: 8 }} />
                  <Text className={`font-bold ${seatsRemaining <= 0 ? 'text-muted-foreground' : 'text-primary'}`}>{t('reserve_a_spot', 'Reserve a Spot')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isCompleted && !isCancelled && (
              <View className="gap-3 mt-2">
                {!isPastDeparture && (
                  <TouchableOpacity onPress={() => setIsCancelModalVisible(true)} disabled={isActionLoading} className="bg-destructive/10 border border-destructive py-4 rounded-3xl items-center flex-row justify-center">
                    <XCircle size={20} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text className="font-bold text-lg text-destructive">{t('cancel_ride', 'Cancel Ride')}</Text>
                  </TouchableOpacity>
                )}
                {isPastDeparture && (
                  <TouchableOpacity onPress={handleCompleteRide} disabled={isActionLoading} className="bg-emerald-500 py-4 rounded-3xl items-center shadow-lg flex-row justify-center">
                    <CheckCircle size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text className="font-bold text-lg text-white">{t('mark_completed', 'Mark Completed')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        ) : (
          <View className="mt-4 bg-card p-6 rounded-3xl border border-border shadow-xl">
            <View className="flex-row items-center justify-between mb-4">
               <View>
                 <Text className="text-muted-foreground text-[10px] uppercase font-bold mb-1">{t('price_label', 'Price per seat')}</Text>
                 <View className="flex-row items-center">
                    <Euro size={20} color="#f97316" />
                    <Text className="text-3xl font-extrabold text-foreground ml-1">
                      {user?.is_student_verified && ride.is_student_pricing ? ride.student_price_per_seat : ride.price_per_seat}
                    </Text>
                 </View>
               </View>
               
               {user?.is_student_verified && ride.is_student_pricing && (
                 <View className="bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                   <View className="flex-row items-center">
                     <GraduationCap size={12} color="#d97706" style={{ marginRight: 4 }} />
                     <Text className="text-amber-600 font-bold text-[10px]">{t('student_price', 'Student')}</Text>
                   </View>
                   <Text className="text-amber-700 font-bold text-center">{ride.student_price_per_seat}€</Text>
                 </View>
               )}
            </View>
            
            {!isCancelled && (
              <View className="gap-3">
                {isBooked && (isCompleted || isPastDeparture) ? (
                  <TouchableOpacity onPress={openRatingScreen} className="bg-amber-500 py-4 rounded-3xl items-center shadow-lg w-full flex-row justify-center">
                    <Star color="white" fill="white" size={20} style={{ marginRight: 8 }} />
                    <Text className="font-bold text-lg text-white">{t('rate_driver', 'Rate Driver')}</Text>
                  </TouchableOpacity>
                ) : (!isCompleted && (
                  <>
                    <TouchableOpacity 
                      onPress={handleBooking} 
                      disabled={isActionLoading || (seatsRemaining <= 0 && !isBooked) || isFemaleOnlyRestricted} 
                      className={`py-4 rounded-3xl items-center shadow-lg w-full ${isBooked ? 'bg-primary' : (seatsRemaining > 0 && !isFemaleOnlyRestricted ? 'bg-primary' : 'bg-muted')}`}
                    >
                      {isActionLoading ? <ActivityIndicator color="white" /> : (
                        <Text className={`font-bold text-lg ${isBooked || (seatsRemaining > 0 && !isFemaleOnlyRestricted) ? 'text-white' : 'text-muted-foreground'}`}>
                          {isFemaleOnlyRestricted ? t('female_only_error', 'Female Only Ride') : (isBooked ? t('open_chat', 'Open Chat') : (seatsRemaining > 0 ? t('book_now', 'Book Now') : t('full', 'Full')))}
                        </Text>
                      )}
                    </TouchableOpacity>
                    {isBooked && !isPastDeparture && (
                      <TouchableOpacity onPress={handleCancelBooking} disabled={isActionLoading} className="py-4 border border-destructive rounded-3xl items-center w-full">
                        <Text className="font-bold text-lg text-destructive">{t('cancel_my_seat', 'Cancel My Seat')}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={isCancelModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsCancelModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-card w-full p-6 rounded-3xl">
            <Text className="text-xl font-bold text-foreground mb-2">{t('cancel_ride_title', 'Cancel Ride')}</Text>
            <Text className="text-muted-foreground mb-4">{t('cancel_reason_prompt', 'Please provide a reason for cancelling.')}</Text>
            <TextInput className="bg-muted p-4 rounded-2xl text-foreground text-base mb-6" placeholder={t('reason_placeholder', 'Reason...')} placeholderTextColor="#a8a29e" value={cancelReason} onChangeText={setCancelReason} autoFocus />
            <View className="flex-row gap-4">
              <TouchableOpacity onPress={() => setIsCancelModalVisible(false)} className="flex-1 p-4 rounded-2xl bg-muted items-center"><Text className="text-foreground font-bold">{t('back', 'Back')}</Text></TouchableOpacity>
              <TouchableOpacity onPress={submitCancelRide} disabled={isActionLoading} className="flex-1 p-4 rounded-2xl bg-destructive items-center"><Text className="text-white font-bold">{t('confirm_cancel', 'Confirm')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isReportModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsReportModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-card w-full p-6 rounded-3xl">
            <Text className="text-xl font-bold text-foreground mb-2">{t('report_user_title', 'Report User')}</Text>
            <Text className="text-muted-foreground mb-4">{t('reporting_text', 'You are reporting:')} {reportedUser?.name}</Text>
            <TextInput className="bg-muted p-4 rounded-2xl text-foreground text-base h-24 mb-6" placeholder={t('report_reason_placeholder', 'What happened?')} placeholderTextColor="#a8a29e" multiline textAlignVertical="top" value={reportReason} onChangeText={setReportReason} autoFocus />
            <View className="flex-row gap-4">
              <TouchableOpacity onPress={() => setIsReportModalVisible(false)} className="flex-1 p-4 rounded-2xl bg-muted items-center"><Text className="text-foreground font-bold">{t('cancel', 'Cancel')}</Text></TouchableOpacity>
              <TouchableOpacity onPress={submitReport} disabled={isActionLoading} className="flex-1 p-4 rounded-2xl bg-destructive items-center">
                {isActionLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">{t('submit_report', 'Submit')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});