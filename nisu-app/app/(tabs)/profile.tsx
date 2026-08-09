import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Car, Settings, ChevronRight, LogOut, Bell, Globe, Check, X, ShieldCheck, FileText, LifeBuoy, Star, Sun, Moon, Smartphone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useFocusedFetch } from '../../hooks/useFocusedFetch';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t, locale, setLanguage, languages } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const c = useThemeColors();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);

  const themeLabel =
    themeMode === 'light'
      ? t('theme_light', 'Light')
      : themeMode === 'dark'
      ? t('theme_dark', 'Dark')
      : t('theme_system', 'System');

  useFocusedFetch(async (signal) => {
    try {
      const res = await client.get('/users/profile');
      if (signal.cancelled) return;
      setProfile(res.data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      if (!signal.cancelled) setIsLoading(false);
    }
  }, []);

  const getAvatarUrl = (path?: string, firstName: string = 'User') => {
    if (!path) return `https://ui-avatars.com/api/?name=${firstName}&background=f97316&color=fff`;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `https://api.nisu.app/${cleanPath}`;
  };

  const handleLogout = async () => {
    Alert.alert(t('logout_confirm_title', 'Log Out'), t('logout_confirm_desc', 'Are you sure you want to sign out?'), [
      { text: t('cancel_btn', 'Cancel'), style: 'cancel' },
      { text: t('logout_btn', 'Log Out'), style: 'destructive', onPress: async () => await signOut() },
    ]);
  };

  const rating = Number(profile?.average_rating || 0).toFixed(1);
  const ridesCount = profile?.rides_as_driver?.length || 0;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Header — Sunset Gradient Hero */}
        <View className="mx-5 mt-5 rounded-[32px] overflow-hidden" style={{ shadowColor: c.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 6 }}>
          <LinearGradient
            colors={[c.primary, c.accentRose, c.accentAmber]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, alignItems: 'center' }}
          >
            <TouchableOpacity className="absolute top-4 right-4 p-2.5 bg-white/20 rounded-full" onPress={() => router.push('/edit-profile')}>
              <Settings size={18} color="#ffffff" />
            </TouchableOpacity>

            <View className="relative mb-3">
              <Image source={{ uri: getAvatarUrl(profile?.profile_picture, profile?.first_name) }} className="w-24 h-24 rounded-full border-[3px] border-white/40" />
              {profile?.is_verified_driver && (
                <View className="absolute -bottom-1 -right-1 bg-white w-8 h-8 rounded-full items-center justify-center">
                  <ShieldCheck size={16} color={c.primary} />
                </View>
              )}
            </View>

            <Text className="text-2xl font-bold text-white">{profile?.first_name || 'User'} {profile?.last_name || ''}</Text>
            <Text className="text-sm text-white/80 mt-0.5">{profile?.email || ''}</Text>

            <View className="flex-row items-center mt-3 bg-white/20 px-3 py-1.5 rounded-full">
              <Shield size={12} color="#ffffff" style={{ marginRight: 4 }} />
              <Text className="text-white text-xs font-bold">
                {profile?.is_verified_driver ? t('verified_driver_badge', 'Verified Driver') : t('standard_member_badge', 'Standard Member')}
              </Text>
            </View>
          </LinearGradient>

          {/* Stats Row */}
          <View className="flex-row bg-card">
            <View className="flex-1 items-center py-4 border-r border-border">
              <View className="flex-row items-center">
                <Star size={14} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 4 }} />
                <Text className="text-foreground font-bold text-base">{rating > '0.0' ? rating : '--'}</Text>
              </View>
              <Text className="text-muted-foreground text-[11px] mt-0.5">{t('rating_label', 'Rating')}</Text>
            </View>
            <View className="flex-1 items-center py-4 border-r border-border">
              <Text className="text-foreground font-bold text-base">{ridesCount}</Text>
              <Text className="text-muted-foreground text-[11px] mt-0.5">{t('rides_label', 'Rides')}</Text>
            </View>
            <View className="flex-1 items-center py-4">
              <Text className="text-foreground font-bold text-base">{profile?.vehicles?.length || 0}</Text>
              <Text className="text-muted-foreground text-[11px] mt-0.5">{t('vehicles_label', 'Vehicles')}</Text>
            </View>
          </View>
        </View>

        {/* Dashboard Section */}
        <View className="px-5 mt-6">
          <Text className="text-xs font-bold text-muted-foreground mb-2.5 ml-1 uppercase tracking-wide">{t('dashboard_section', 'Dashboard')}</Text>
          <View className="bg-card rounded-3xl border border-border overflow-hidden">
            <MenuItem
              icon={<Car size={20} color="#f97316" />}
              title={t('digital_garage_title', 'Digital Garage')}
              subtitle={`${profile?.vehicles?.length || 0} ${t('vehicles_count_text', 'vehicles registered')}`}
              onPress={() => router.push('/my-vehicles')}
            />
            <View className="h-[1px] bg-border mx-4" />
            <MenuItem
              icon={<Shield size={20} color="#f97316" />}
              title={t('verifications_title', 'Verifications')}
              subtitle={t('verifications_desc_text', 'Upload Driver or Student ID')}
              onPress={() => router.push('/verification-upload')}
            />
          </View>
        </View>

        {/* Settings Section */}
        <View className="px-5 mt-5">
          <Text className="text-xs font-bold text-muted-foreground mb-2.5 ml-1 uppercase tracking-wide">{t('settings_section', 'Settings')}</Text>
          <View className="bg-card rounded-3xl border border-border overflow-hidden">
            <MenuItem
              icon={<Bell size={20} color="#f97316" />}
              title={t('notifications_title', 'Notifications')}
              subtitle={t('notifications_desc_text', 'Manage alerts')}
              onPress={() => router.push('/notifications-settings')}
            />
            <View className="h-[1px] bg-border mx-4" />
            <MenuItem
              icon={<Globe size={20} color="#f97316" />}
              title={t('language_title', 'Language')}
              subtitle={`${languages.find(l => l.code === locale)?.name || locale.toUpperCase()}`}
              onPress={() => setIsLangModalVisible(true)}
            />
            <View className="h-[1px] bg-border mx-4" />
            <MenuItem
              icon={isDark ? <Moon size={20} color="#f97316" /> : <Sun size={20} color="#f97316" />}
              title={t('theme_title', 'Appearance')}
              subtitle={themeLabel}
              onPress={() => setIsThemeModalVisible(true)}
            />
          </View>
        </View>

        {/* Legal & Support Section */}
        <View className="px-5 mt-5">
          <Text className="text-xs font-bold text-muted-foreground mb-2.5 ml-1 uppercase tracking-wide">{t('legal_section', 'Legal & Support')}</Text>
          <View className="bg-card rounded-3xl border border-border overflow-hidden">
            <MenuItem
              icon={<LifeBuoy size={20} color="#f97316" />}
              title={t('contact_support_title', 'Contact Support')}
              subtitle={t('contact_support_desc', 'Get help with your account or rides')}
              onPress={() => router.push('/contact-support')}
            />
            <View className="h-[1px] bg-border mx-4" />
            <MenuItem
              icon={<Shield size={20} color="#f97316" />}
              title={t('privacy_policy_title', 'Privacy Policy')}
              subtitle={t('privacy_policy_desc', 'Read how we protect your data')}
              onPress={() => router.push('/privacy-policy')}
            />
            <View className="h-[1px] bg-border mx-4" />
            <MenuItem
              icon={<FileText size={20} color="#f97316" />}
              title={t('terms_of_service_title', 'Terms of Service')}
              subtitle={t('terms_of_service_desc', 'Read our platform rules')}
              onPress={() => router.push('/terms-of-service')}
            />
          </View>
        </View>

        {/* Logout */}
        <View className="px-5 mt-6 mb-8">
          <TouchableOpacity onPress={handleLogout} className="bg-destructive/10 rounded-3xl p-4 flex-row items-center justify-center border border-destructive/20">
            <LogOut size={18} color="#ef4444" style={{ marginRight: 8 }} />
            <Text className="text-destructive font-bold text-base">{t('logout_btn_text', 'Log Out')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal animationType="slide" transparent={true} visible={isLangModalVisible} onRequestClose={() => setIsLangModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#292524' : '#ffffff' }]}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-foreground">{t('select_language_header', 'Select Language')}</Text>
              <TouchableOpacity onPress={() => setIsLangModalVisible(false)} className="bg-muted p-2 rounded-full"><X size={20} className="text-foreground" /></TouchableOpacity>
            </View>
            {languages.map((lang) => (
              <TouchableOpacity key={lang.code} onPress={async () => { await setLanguage(lang.code); setIsLangModalVisible(false); }} className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border ${locale === lang.code ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                <View className="flex-row items-center">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${locale === lang.code ? 'bg-primary' : 'bg-muted'}`}><Text className="text-white font-bold">{lang.code.toUpperCase()}</Text></View>
                  <Text className={`text-lg font-semibold ${locale === lang.code ? 'text-primary' : 'text-foreground'}`}>{lang.name}</Text>
                </View>
                {locale === lang.code && <Check size={24} className="text-primary" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Theme Modal */}
      <Modal animationType="slide" transparent={true} visible={isThemeModalVisible} onRequestClose={() => setIsThemeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#292524' : '#ffffff' }]}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-foreground">{t('theme_title', 'Appearance')}</Text>
              <TouchableOpacity onPress={() => setIsThemeModalVisible(false)} className="bg-muted p-2 rounded-full"><X size={20} className="text-foreground" /></TouchableOpacity>
            </View>
            {([
              { key: 'system' as ThemeMode, label: t('theme_system', 'System'), desc: t('theme_system_desc', 'Match phone settings'), Icon: Smartphone },
              { key: 'light' as ThemeMode, label: t('theme_light', 'Light'), desc: t('theme_light_desc', 'Always light'), Icon: Sun },
              { key: 'dark' as ThemeMode, label: t('theme_dark', 'Dark'), desc: t('theme_dark_desc', 'Always dark'), Icon: Moon },
            ]).map(({ key, label, desc, Icon }) => {
              const active = themeMode === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={async () => { await setThemeMode(key); setIsThemeModalVisible(false); }}
                  className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border ${active ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                >
                  <View className="flex-row items-center flex-1">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${active ? 'bg-primary' : 'bg-muted'}`}>
                      <Icon size={18} color={active ? '#ffffff' : '#78716c'} />
                    </View>
                    <View className="flex-1">
                      <Text className={`text-base font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>{label}</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">{desc}</Text>
                    </View>
                  </View>
                  {active && <Check size={22} className="text-primary" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MenuItem({ icon, title, subtitle, onPress }: { icon: any; title: string; subtitle: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center px-4 py-3.5" activeOpacity={0.6}>
      <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mr-3">{icon}</View>
      <View className="flex-1">
        <Text className="text-foreground font-semibold text-[15px]">{title}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text>
      </View>
      <ChevronRight size={18} color="#a8a29e" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '60%' },
});
