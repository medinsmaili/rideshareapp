import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function ShortLinkRedirect() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (id) router.replace(`/ride-detail?id=${id}`);
    else router.replace('/');
    // router is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#f97316" />
    </View>
  );
}