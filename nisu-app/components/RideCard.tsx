import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, ShieldCheck } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface RideCardProps {
  ride: any;
  variant?: 'default' | 'compact' | 'driver';
  showStatus?: { label: string; color: string; bg: string };
}

export default function RideCard({ ride, variant = 'default', showStatus }: RideCardProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();

  const isStudentEligible = user?.is_student_verified && ride.is_student_pricing;
  const finalPrice = isStudentEligible ? ride.student_price_per_seat : ride.price_per_seat;
  const seatsLeft = (ride.total_seats || 0) - (ride.seats_taken || 0) - (ride.reserved_spots || 0);

  const depDate = new Date(ride.departure_time);
  const now = new Date();
  const isToday = now.toDateString() === depDate.toDateString();
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === depDate.toDateString();

  const timeStr = (() => {
    try {
      const d = new Date(ride.departure_time);
      return isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return '--:--'; }
  })();

  const dateStr = isToday
    ? t('today', 'Today')
    : isTomorrow
      ? t('tomorrow', 'Tomorrow')
      : `${String(depDate.getDate()).padStart(2, '0')}.${String(depDate.getMonth() + 1).padStart(2, '0')}`;

  const getAvatarUrl = (path?: string, firstName: string = 'U') => {
    if (!path) return `https://ui-avatars.com/api/?name=${firstName}&background=f97316&color=fff`;
    if (path.startsWith('http')) return path;
    return `https://api.nisu.app/${path.startsWith('/') ? path.substring(1) : path}`;
  };

  const rating = Number(ride.driver?.average_rating || 5).toFixed(1);
  const isDriverVariant = variant === 'driver';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/ride-detail?id=${ride.id}`)}
      className="bg-card rounded-3xl mb-3 border border-border overflow-hidden"
      activeOpacity={0.7}
    >
      {/* ── Top accent bar with female-only indicator ── */}
      {ride.female_only && (
        <View className="bg-pink-500/10 px-4 py-1.5">
          <Text className="text-pink-600 text-[11px] font-bold text-center">
            {'👩 '}{t('female_only_badge', 'Female Only')}
          </Text>
        </View>
      )}

      <View className="p-4">
        {/* ── Row 1: Driver avatar + Route + Time ── */}
        <View className="flex-row items-center">
          {/* Driver avatar */}
          {!isDriverVariant && (
            <View className="mr-3">
              <Image
                source={{ uri: getAvatarUrl(ride.driver?.profile_picture, ride.driver?.first_name) }}
                className="w-11 h-11 rounded-full bg-muted"
              />
              {ride.driver?.is_verified_driver && (
                <View className="absolute -bottom-0.5 -right-0.5 bg-card rounded-full p-0.5">
                  <ShieldCheck size={12} color="#f97316" />
                </View>
              )}
            </View>
          )}

          {/* Route + driver name */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-foreground font-bold text-[15px]" numberOfLines={1}>
                {ride.origin_city?.name || t('unknown_city', 'Unknown')}
              </Text>
              <Text className="mx-1.5 text-muted-foreground">{'→'}</Text>
              <Text className="text-foreground font-bold text-[15px] flex-shrink" numberOfLines={1}>
                {ride.destination_city?.name || t('unknown_city', 'Unknown')}
              </Text>
            </View>
            {!isDriverVariant && (
              <View className="flex-row items-center mt-0.5">
                <Text className="text-muted-foreground text-xs">{ride.driver?.first_name || t('driver', 'Driver')}</Text>
                <Text className="text-muted-foreground text-xs mx-1">{'·'}</Text>
                <Star size={10} color="#f59e0b" fill="#f59e0b" />
                <Text className="text-muted-foreground text-xs ml-0.5">{rating}</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View className="ml-2 items-end">
            <Text className="text-primary font-extrabold text-lg">
              {finalPrice === 0 ? t('free', 'Free') : `${finalPrice}€`}
            </Text>
            {isStudentEligible && (
              <Text className="text-amber-600 text-[10px] font-bold mt--0.5">
                {'🎓 '}{ride.student_price_per_seat}€
              </Text>
            )}
          </View>
        </View>

        {/* ── Row 2: Info chips ── */}
        <View className="flex-row items-center mt-3 gap-1.5">
          {/* Status badge (for my-rides) */}
          {showStatus && (
            <View className="px-2 py-1 rounded-md" style={{ backgroundColor: showStatus.bg }}>
              <Text className="text-[11px] font-bold" style={{ color: showStatus.color }}>{showStatus.label}</Text>
            </View>
          )}

          {/* Time */}
          <View className="bg-primary/8 px-2 py-1 rounded-md flex-row items-center">
            <Text className="text-[11px] font-bold text-primary">{'🕐 '}{timeStr}</Text>
          </View>

          {/* Date */}
          <View className="bg-muted px-2 py-1 rounded-md">
            <Text className="text-[11px] font-medium text-muted-foreground">{'📅 '}{dateStr}</Text>
          </View>

          {/* Seats */}
          <View className={`px-2 py-1 rounded-md ${seatsLeft <= 1 ? 'bg-amber-500/10' : 'bg-muted'}`}>
            <Text className={`text-[11px] font-bold ${seatsLeft <= 1 ? 'text-amber-600' : 'text-muted-foreground'}`}>
              {seatsLeft <= 1 ? '🔥 ' : '💺 '}{isDriverVariant ? `${ride.seats_taken || 0}/${ride.total_seats || 0}` : `${seatsLeft} ${t('left', 'left')}`}
            </Text>
          </View>

          {/* Vehicle (compact) */}
          {ride.vehicle && (
            <View className="bg-muted px-2 py-1 rounded-md flex-row items-center flex-shrink">
              <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
                {'🚗 '}{ride.vehicle.brand}
              </Text>
            </View>
          )}
        </View>

        {/* ── Row 3: Meeting points (search results only, if available) ── */}
        {variant === 'default' && (ride.origin_meeting_point || ride.destination_meeting_point) && (
          <View className="mt-2.5 pt-2.5 border-t border-border/50">
            {ride.origin_meeting_point && (
              <Text className="text-[11px] text-muted-foreground mb-0.5" numberOfLines={1}>
                {'📍 '}{ride.origin_meeting_point.name}
              </Text>
            )}
            {ride.destination_meeting_point && (
              <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
                {'🏁 '}{ride.destination_meeting_point.name}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
