import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, Plus, ArrowLeft, Trash2, CheckCircle2, Fuel } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const CAR_COLORS = [
  { name: 'White', hex: '#fefbf6' },
  { name: 'Black', hex: '#1c1917' },
  { name: 'Silver', hex: '#a8a29e' },
  { name: 'Gray', hex: '#78716c' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Brown', hex: '#92400e' },
];

export default function MyVehiclesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [selectedColorHex, setSelectedColorHex] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVehicles = async () => {
    try {
      const res = await client.get('/users/profile');
      setVehicles(Array.isArray(res.data?.vehicles) ? res.data.vehicles : []);
    } catch { setVehicles([]); } finally { setIsLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchVehicles(); }, []));

  const resetForm = () => {
    setBrand(''); setColor(''); setSelectedColorHex(''); setLicensePlate('');
    setIsAdding(false);
  };

  const handleAddVehicle = async () => {
    if (!brand.trim() || !licensePlate.trim()) {
      return Alert.alert(t('error_title', 'Error'), t('fill_fields_error', 'Brand and license plate are required.'));
    }
    setIsSubmitting(true);
    try {
      const colorName = color.trim() || (CAR_COLORS.find(c => c.hex === selectedColorHex)?.name ?? '');
      await client.post('/vehicles', {
        brand: brand.trim(),
        color: colorName,
        license_plate: licensePlate.trim().toUpperCase(),
      });
      Alert.alert(t('success_title', 'Success'), t('vehicle_added_msg', 'Vehicle added to your garage!'));
      resetForm();
      fetchVehicles();
    } catch (error: any) {
      Alert.alert(t('error_title', 'Error'), error.response?.data?.message || t('add_vehicle_fail', 'Could not add vehicle'));
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('delete_title', 'Remove Vehicle'), t('confirm_remove_vehicle', 'Remove this vehicle from your garage?'), [
      { text: t('cancel_btn', 'Cancel'), style: 'cancel' },
      { text: t('delete_btn', 'Remove'), style: 'destructive', onPress: async () => {
          try { await client.delete(`/vehicles/${id}`); fetchVehicles(); }
          catch { Alert.alert(t('error_title', 'Error'), t('delete_fail_msg', 'Could not remove vehicle')); }
      }},
    ]);
  };

  const getCarColorIndicator = (colorName: string) => {
    const found = CAR_COLORS.find(c => c.name.toLowerCase() === colorName?.toLowerCase());
    return found?.hex ?? '#a8a29e';
  };

  if (isLoading) {
    return <View className="flex-1 bg-background justify-center items-center"><ActivityIndicator size="large" color="#f97316" /></View>;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={['#f97316', '#f43f5e', '#f59e0b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="px-6 pt-4 pb-8 rounded-b-[40px]">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mb-4">
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-2xl font-bold">{t('garage_header', 'Digital Garage')}</Text>
              <Text className="text-white/70 text-sm mt-1">{vehicles.length}/4 {t('vehicles_registered', 'vehicles registered')}</Text>
            </View>
            <View className="bg-white/20 w-14 h-14 rounded-2xl items-center justify-center">
              <Car size={28} color="#fff" />
            </View>
          </View>
          {/* Progress bar */}
          <View className="mt-4 bg-white/20 h-2 rounded-full overflow-hidden">
            <View style={{ width: `${(vehicles.length / 4) * 100}%` }} className="bg-white h-full rounded-full" />
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Add form */}
          {isAdding ? (
            <View className="bg-card rounded-3xl border border-border shadow-sm mb-6 overflow-hidden">
              <View className="px-5 pt-5 pb-3 border-b border-border">
                <Text className="text-lg font-bold text-foreground">{t('vehicle_details_header', 'Vehicle Details')}</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{t('fill_fields_instruction', 'Fill in your vehicle information')}</Text>
              </View>
              <View className="p-5 gap-4">
                <View>
                  <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">{t('brand_label', 'Brand & Model')} *</Text>
                  <TextInput
                    className="bg-muted px-4 py-3 rounded-2xl text-foreground text-base"
                    placeholder={t('brand_placeholder', 'e.g. Toyota Corolla')}
                    placeholderTextColor="#a8a29e"
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">{t('color_label', 'Color')}</Text>
                  <View className="flex-row flex-wrap gap-2 mb-2">
                    {CAR_COLORS.map(c => (
                      <TouchableOpacity
                        key={c.hex}
                        onPress={() => { setSelectedColorHex(c.hex); setColor(c.name); }}
                        style={{ backgroundColor: c.hex, borderWidth: selectedColorHex === c.hex ? 3 : 1.5, borderColor: selectedColorHex === c.hex ? '#f97316' : '#e2e8f0' }}
                        className="w-8 h-8 rounded-full items-center justify-center"
                      >
                        {selectedColorHex === c.hex && <CheckCircle2 size={14} color={c.hex === '#fefbf6' || c.hex === '#eab308' ? '#1c1917' : '#fff'} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    className="bg-muted px-4 py-3 rounded-2xl text-foreground text-base"
                    placeholder={t('color_placeholder', 'Or type color name')}
                    placeholderTextColor="#a8a29e"
                    value={color}
                    onChangeText={text => { setColor(text); setSelectedColorHex(''); }}
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">{t('license_plate_label', 'License Plate')} *</Text>
                  <TextInput
                    className="bg-muted px-4 py-3 rounded-2xl text-foreground text-base font-mono tracking-widest"
                    placeholder={t('license_plate_placeholder', 'e.g. AB 123 CD')}
                    placeholderTextColor="#a8a29e"
                    value={licensePlate}
                    onChangeText={setLicensePlate}
                    autoCapitalize="characters"
                  />
                </View>

                <View className="flex-row gap-3 mt-2">
                  <TouchableOpacity onPress={resetForm} className="flex-1 bg-muted p-4 rounded-3xl items-center">
                    <Text className="text-foreground font-bold">{t('cancel_btn', 'Cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAddVehicle} disabled={isSubmitting} className="flex-2 rounded-3xl overflow-hidden" style={{ flex: 2, shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 }}>
                    <LinearGradient colors={['#f97316', '#f43f5e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="p-4 items-center justify-center">
                      {isSubmitting ? <ActivityIndicator color="#fff" /> : (
                        <View className="flex-row items-center gap-2">
                          <Plus size={18} color="#fff" />
                          <Text className="text-white font-bold text-base">{t('save_vehicle_btn', 'Add Vehicle')}</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : vehicles.length < 4 ? (
            <TouchableOpacity
              onPress={() => setIsAdding(true)}
              className="flex-row items-center justify-center p-5 rounded-3xl border-2 border-dashed border-primary bg-primary/5 mb-6"
            >
              <View className="bg-primary/10 w-10 h-10 rounded-full items-center justify-center mr-3">
                <Plus size={20} color="#f97316" />
              </View>
              <View>
                <Text className="text-primary font-bold text-base">{t('add_new_vehicle_btn', 'Add New Vehicle')}</Text>
                <Text className="text-primary/60 text-xs">{4 - vehicles.length} {t('slots_remaining', 'slots remaining')}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-6 flex-row items-center">
              <Fuel size={20} color="#d97706" style={{ marginRight: 12 }} />
              <Text className="text-amber-700 font-medium flex-1">{t('garage_full_msg', 'Garage full — remove a vehicle to add a new one.')}</Text>
            </View>
          )}

          {/* Vehicle list */}
          <Text className="text-base font-bold text-foreground mb-3">{t('registered_vehicles_header', 'Registered Vehicles')}</Text>

          {vehicles.length === 0 ? (
            <View className="items-center py-14 bg-card rounded-3xl border border-dashed border-border">
              <View className="bg-muted w-20 h-20 rounded-full items-center justify-center mb-4">
                <Car size={40} color="#a8a29e" />
              </View>
              <Text className="text-foreground font-bold text-lg mb-1">{t('garage_empty_title', 'No Vehicles Yet')}</Text>
              <Text className="text-muted-foreground text-sm text-center px-8">{t('garage_empty_text', 'Add your first vehicle to start offering rides.')}</Text>
            </View>
          ) : (
            vehicles.map((v, i) => (
              <View key={v.id || i} className="bg-card rounded-3xl mb-4 border border-border shadow-sm overflow-hidden">
                <View className="flex-row items-center p-4">
                  <View className="relative mr-4">
                    <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center">
                      <Car size={28} color="#f97316" />
                    </View>
                    {v.color && (
                      <View
                        style={{ backgroundColor: getCarColorIndicator(v.color), borderWidth: 2, borderColor: '#fff' }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full"
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-bold text-base">{v.brand}</Text>
                    <Text className="text-muted-foreground text-sm">{v.color}</Text>
                  </View>
                  <View className="items-end mr-3">
                    <View className="bg-muted px-3 py-1 rounded-xl">
                      <Text className="text-foreground font-mono font-bold text-sm tracking-wide">{v.license_plate}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(v.id)} className="w-9 h-9 bg-destructive/10 rounded-full items-center justify-center">
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
