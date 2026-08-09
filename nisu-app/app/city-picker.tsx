import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, X, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function CityPickerScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { type } = useLocalSearchParams();

  const [cities, setCities] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await client.get('/locations/cities');
        const cityData = Array.isArray(res.data) ? res.data : [];
        setCities(cityData);
        setFilteredCities(cityData);
      } catch (error) { 
        console.error('Failed to fetch cities', error); 
      } finally { setIsLoading(false); }
    };
    fetchCities();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') setFilteredCities(cities);
    else setFilteredCities(cities.filter(city => city.name.toLowerCase().includes(text.toLowerCase())));
  };

  const selectCity = async (city: any) => {
    try {
      const storageKey = type ? `selected_${type}` : 'selected_city';
      await AsyncStorage.setItem(storageKey, JSON.stringify({ id: city.id, name: city.name }));
      router.back();
    } catch (e) { console.error('Failed to save city', e); }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View className="px-6 pt-4 pb-4 border-b border-border flex-row items-center bg-card">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-2">{t('select_city_header', 'Select City')}</Text>
      </View>

      <View className="p-6">
        <View className="flex-row items-center bg-muted px-4 py-3 rounded-3xl">
          <Search size={20} className="text-muted-foreground" />
          <TextInput 
            className="flex-1 ml-3 text-base text-foreground" 
            placeholder={t('search_city_placeholder', 'Search for a city...')} 
            placeholderTextColor="#78716c"
            value={searchQuery} 
            onChangeText={handleSearch} 
            autoFocus 
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <X size={20} className="text-muted-foreground" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? <ActivityIndicator size="large" color="#f97316" className="mt-5" /> : (
        <FlatList
          data={filteredCities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => selectCity(item)} className="flex-row items-center px-6 py-4 border-b border-border">
              <View className="bg-primary/10 p-2.5 rounded-xl mr-4">
                <MapPin size={20} className="text-primary" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground">{item.name}</Text>
                <Text className="text-sm text-muted-foreground mt-1">{item.country}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}