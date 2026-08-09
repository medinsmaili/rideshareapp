import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, Shield, Car, GraduationCap, ArrowLeft, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function VerificationUploadScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const isDark = useColorScheme() === 'dark';
  
  const [selectedType, setSelectedType] = useState<'driver' | 'student'>('driver');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ driver: false, student: false });
  const [pending, setPending] = useState({ driver: false, student: false }); 

  const fetchStatus = async () => {
    try {
      const res = await client.get('/users/profile');
      const user = res.data;
      setStatus({ driver: !!user?.is_verified_driver, student: !!user?.is_student_verified });
      setPending({ driver: user?.driver_verification_status === 'pending', student: user?.student_verification_status === 'pending' });
    } catch (error) { console.error('Failed to fetch status:', error); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert(t('permission_denied_title', 'Permission Denied'), t('access_required_msg', 'You need to allow access.'));
    const result = useCamera ? await ImagePicker.launchCameraAsync({ quality: 0.8 }) : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets) setSelectedImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!selectedImage) return Alert.alert(t('error_title', 'Error'), t('select_image_error', 'Please select an image.'));
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', selectedType);
      const filename = selectedImage.split('/').pop() || 'verification.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append('file', { uri: selectedImage, name: filename, type } as any);
      await client.post('/users/verify-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert(t('success_title', 'Success'), t('document_submitted_msg', 'Document submitted for review.'));
      setSelectedImage(null); fetchStatus();
    } catch (error) { Alert.alert(t('error_title', 'Error'), t('upload_fail_msg', 'Upload failed.')); } 
    finally { setIsSubmitting(false); }
  };

  const colors = {
    bg: isDark ? '#1c1917' : '#ffffff',
    text: isDark ? '#ffffff' : '#1c1917',
    muted: isDark ? '#292524' : '#f1f5f9',
    mutedText: '#78716c',
    primary: '#f97316',
    amberBg: 'rgba(245, 158, 11, 0.1)', amberBorder: 'rgba(245, 158, 11, 0.3)', amberText: '#d97706',
    tealBg: 'rgba(20, 184, 166, 0.1)', tealBorder: 'rgba(20, 184, 166, 0.3)',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: isDark ? '#292524' : '#e2e8f0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('verification_header', 'Verification')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.tabContainer, { backgroundColor: colors.muted }]}>
          <TouchableOpacity onPress={() => setSelectedType('driver')} style={[styles.tab, selectedType === 'driver' && styles.activeTab]}>
            <Car size={18} color={selectedType === 'driver' ? colors.primary : colors.mutedText} />
            <Text style={[styles.tabText, { color: selectedType === 'driver' ? colors.text : colors.mutedText }]}>{t('driver_type_label', 'Driver')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedType('student')} style={[styles.tab, selectedType === 'student' && styles.activeTab]}>
            <GraduationCap size={18} color={selectedType === 'student' ? colors.primary : colors.mutedText} />
            <Text style={[styles.tabText, { color: selectedType === 'student' ? colors.text : colors.mutedText }]}>{t('student_type_label', 'Student')}</Text>
          </TouchableOpacity>
        </View>
        {status[selectedType] ? (
          <View style={[styles.statusBox, { backgroundColor: colors.tealBg, borderColor: colors.tealBorder }]}>
            <Shield size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 10 }}>{t('verified_account_text', 'Verified Account')}</Text>
          </View>
        ) : pending[selectedType] ? (
          <View style={[styles.statusBox, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder }]}>
            <Clock size={20} color={colors.amberText} />
            <Text style={{ color: colors.amberText, fontWeight: '700', marginLeft: 10 }}>{t('pending_review_text', 'Pending Review')}</Text>
          </View>
        ) : null}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('document_upload_title', 'Document Upload')}</Text>
          <Text style={{ color: colors.mutedText }}>
            {t('upload_instructions_text', 'Please upload a clear photo of your')} {selectedType === 'driver' ? t('driving_license_label', 'Driving License') : t('student_id_label', 'Student ID card')}.
          </Text>
        </View>
        <TouchableOpacity onPress={() => pickImage(false)} style={[styles.uploadArea, { backgroundColor: colors.muted, borderColor: isDark ? '#44403c' : '#d6d3d1' }]}>
          {selectedImage ? <Image source={{ uri: selectedImage }} style={styles.previewImage} /> : (
            <><Upload size={40} color={colors.mutedText} /><Text style={{ color: colors.mutedText, marginTop: 10 }}>{t('tap_select_image_text', 'Tap to select image')}</Text></>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting || !!status[selectedType] || !!pending[selectedType] || !selectedImage} style={{ marginTop: 20, shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 }}>
          <LinearGradient colors={['#f97316', '#f43f5e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.submitBtn, (isSubmitting || !!status[selectedType] || !!pending[selectedType] || !selectedImage) && { opacity: 0.5 }]}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('submit_verification_btn', 'Submit Verification')}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backButton: { padding: 8, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabContainer: { flexDirection: 'row', padding: 4, borderRadius: 12, marginBottom: 24 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { marginLeft: 8, fontWeight: '600' },
  statusBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  uploadArea: { width: '100%', height: 220, borderRadius: 28, borderStyle: 'dashed', borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  submitBtn: { height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});