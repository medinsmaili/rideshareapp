import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, User, Mail, Phone, ArrowLeft, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext'; // ✅ Added to sync global state

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { signIn, userToken } = useAuth(); // ✅ Added to sync global state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await client.get('/users/profile');
        const user = res.data;
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setEmail(user.email || '');
        setPhone(user.phone_number || '');
        setGender(user.gender || '');
        if (user.profile_picture) {
          const cleanPath = user.profile_picture.startsWith('/') ? user.profile_picture.substring(1) : user.profile_picture;
          setProfilePicture(cleanPath.startsWith('http') ? cleanPath : `https://api.nisu.app/${cleanPath}`);
        }
      } catch (error) { Alert.alert(t('error_title', 'Error'), t('profile_load_error', 'Failed to load profile.')); } 
      finally { setIsLoading(false); }
    };
    fetchProfile();
  }, []);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert(t('permission_denied_title', 'Permission Required'), t('gallery_access_desc', 'Access to photos is needed.'));
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) handleAvatarUpload(result.assets[0].uri);
  };

  const handleAvatarUpload = async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;
    formData.append('file', { uri, name: filename, type } as any);
    try {
      setIsSubmitting(true);
      const res = await client.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const picPath = res.data?.profile_picture;
      if (picPath) {
        const cleanPath = picPath.startsWith('/') ? picPath.substring(1) : picPath;
        setProfilePicture(cleanPath.startsWith('http') ? cleanPath : `https://api.nisu.app/${cleanPath}`);
      }
      Alert.alert(t('success_title', 'Success'), t('avatar_updated_msg', 'Profile picture updated!'));
    } catch (error) { Alert.alert(t('upload_fail_title', 'Upload Failed'), t('avatar_upload_fail_desc', 'Could not update picture.')); } 
    finally { setIsSubmitting(false); }
  };

  const handleSaveProfile = async () => {
    if (!firstName || !lastName) return Alert.alert(t('error_title', 'Error'), t('names_required_msg', 'Names are required.'));
    setIsSubmitting(true);
    try {
      await client.put('/users/profile', { first_name: firstName, last_name: lastName, phone_number: phone, gender: gender });
      
      // ✅ BUG FIX: Synchronize the local changes to the Auth Context to prevent Female-Only lockouts
      const newProfileRes = await client.get('/users/profile');
      if (userToken) {
        await signIn(userToken, newProfileRes.data);
      }

      Alert.alert(t('success_title', 'Success'), t('profile_updated_msg', 'Profile updated!'));
      router.back();
    } catch (error) { Alert.alert(t('update_fail_title', 'Update Failed'), t('profile_save_fail_desc', 'Could not save changes.')); } 
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return <View className="flex-1 bg-background justify-center items-center"><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2"><ArrowLeft size={24} className="text-foreground" /></TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">{t('edit_profile_header', 'Edit Profile')}</Text>
        <TouchableOpacity onPress={handleSaveProfile} disabled={isSubmitting}><Check size={24} className={isSubmitting ? "text-muted-foreground" : "text-primary"} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <View className="items-center mb-8">
          <TouchableOpacity onPress={pickImage} className="relative">
            <View className="w-32 h-32 rounded-full bg-muted items-center justify-center overflow-hidden border-2 border-primary/20">
              {profilePicture ? <Image source={{ uri: profilePicture }} className="w-full h-full" /> : <User size={64} className="text-muted-foreground" />}
            </View>
            <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-background"><Camera size={20} color="white" /></View>
          </TouchableOpacity>
        </View>
        <View className="gap-5">
          <View><Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">{t('first_name_label', 'First Name')}</Text><View className="bg-card border border-border rounded-3xl flex-row items-center px-4 py-3"><User size={20} className="text-muted-foreground mr-3" /><TextInput className="flex-1 text-foreground text-base" value={firstName} onChangeText={setFirstName} /></View></View>
          <View><Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">{t('last_name_label', 'Last Name')}</Text><View className="bg-card border border-border rounded-3xl flex-row items-center px-4 py-3"><User size={20} className="text-muted-foreground mr-3" /><TextInput className="flex-1 text-foreground text-base" value={lastName} onChangeText={setLastName} /></View></View>
          <View><Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">{t('phone_label', 'Phone Number')}</Text><View className="bg-card border border-border rounded-3xl flex-row items-center px-4 py-3"><Phone size={20} className="text-muted-foreground mr-3" /><TextInput className="flex-1 text-foreground text-base" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></View></View>
          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">{t('email_label', 'Email')}</Text>
            {/* ✅ Issue #6: Email locked/read-only */}
            <View className="bg-muted border border-border rounded-3xl flex-row items-center px-4 py-3 opacity-60">
              <Mail size={20} className="text-muted-foreground mr-3" />
              <TextInput className="flex-1 text-muted-foreground text-base" value={email} editable={false} />
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">{t('gender_label', 'Gender (Locked)')}</Text>
            {/* ✅ Issue #6: Gender locked/read-only */}
            <View className="flex-row gap-3">
              {['M', 'F', 'O'].map((g) => (
                <View key={g} className={`flex-1 py-3 rounded-3xl border items-center justify-center ${gender === g ? 'bg-primary/10 border-primary' : 'bg-muted border-border opacity-40'}`}>
                  <Text className={`font-bold ${gender === g ? 'text-primary' : 'text-muted-foreground'}`}>
                    {g === 'M' ? t('gender_male', 'Male') : g === 'F' ? t('gender_female', 'Female') : t('gender_other', 'Other')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}