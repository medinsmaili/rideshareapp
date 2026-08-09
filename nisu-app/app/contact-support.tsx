import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, LifeBuoy, Send, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const CATEGORIES = [
  { key: 'account', label: 'Account Issue' },
  { key: 'booking', label: 'Booking Problem' },
  { key: 'payment', label: 'Payment / Refund' },
  { key: 'safety', label: 'Safety Concern' },
  { key: 'driver', label: 'Driver Complaint' },
  { key: 'other', label: 'Other' },
];

export default function ContactSupportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const selectedCategory = CATEGORIES.find(c => c.key === category);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(t('error', 'Error'), t('fill_required_fields', 'Please fill in subject and message.'));
      return;
    }
    setIsSending(true);
    try {
      await client.post('/support', {
        category: selectedCategory?.label || 'General',
        subject: subject.trim(),
        message: message.trim(),
        from_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'App User',
        from_email: user?.email || '',
      });
      Alert.alert(
        t('support_sent_title', 'Message Sent'),
        t('support_sent_desc', "We've received your message and will get back to you shortly."),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      const msg = e.response?.data?.message;
      Alert.alert(t('error', 'Error'), Array.isArray(msg) ? msg[0] : (msg || t('support_send_fail', 'Failed to send message. Please try again.')));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center bg-background">
          <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 bg-card border border-border rounded-2xl items-center justify-center mr-3">
            <ArrowLeft size={20} className="text-foreground" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">{t('contact_support_title', 'Contact Support')}</Text>
            <Text className="text-xs text-muted-foreground">{t('contact_support_subtitle', "We usually respond within 24 hours")}</Text>
          </View>
          <View className="bg-primary/10 w-11 h-11 rounded-2xl items-center justify-center">
            <LifeBuoy size={20} color="#f97316" />
          </View>
        </View>

        <View className="bg-primary/5 border border-primary/20 rounded-3xl p-4 mx-6 mb-2 flex-row items-start">
          <LifeBuoy size={18} color="#f97316" style={{ marginRight: 10, marginTop: 1 }} />
          <View className="flex-1">
            <Text className="text-primary font-semibold text-sm">{t('support_response_info', 'Our support team is here to help')}</Text>
            <Text className="text-primary/70 text-xs mt-0.5">{t('support_email_info', 'Responses are sent to your registered email.')}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Category picker */}
          <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">{t('category_label', 'Category')}</Text>
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            className={`bg-card border rounded-3xl px-4 py-4 flex-row items-center justify-between mb-1 ${showCategoryPicker ? 'border-primary' : 'border-border'}`}
          >
            <Text className={selectedCategory ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
              {selectedCategory ? t(`cat_${selectedCategory.key}`, selectedCategory.label) : t('select_category', 'Select a category...')}
            </Text>
            <ChevronDown size={18} color="#a8a29e" style={{ transform: [{ rotate: showCategoryPicker ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          {showCategoryPicker && (
            <View className="bg-card border border-border rounded-3xl overflow-hidden mb-4">
              {CATEGORIES.map((cat, i) => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => { setCategory(cat.key); setShowCategoryPicker(false); }}
                  className={`px-4 py-3 flex-row items-center justify-between ${i < CATEGORIES.length - 1 ? 'border-b border-border' : ''} ${category === cat.key ? 'bg-primary/5' : ''}`}
                >
                  <Text className={`font-medium ${category === cat.key ? 'text-primary' : 'text-foreground'}`}>
                    {t(`cat_${cat.key}`, cat.label)}
                  </Text>
                  {category === cat.key && <View className="w-2 h-2 rounded-full bg-primary" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Subject */}
          <Text className="text-xs font-bold text-muted-foreground uppercase mb-2 mt-2">{t('subject_label', 'Subject')} *</Text>
          <TextInput
            className="bg-card border border-border rounded-3xl px-4 py-4 text-foreground text-base mb-4"
            placeholder={t('subject_placeholder', 'Brief description of your issue')}
            placeholderTextColor="#a8a29e"
            value={subject}
            onChangeText={setSubject}
            maxLength={100}
          />

          {/* Message */}
          <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">{t('message_label', 'Message')} *</Text>
          <TextInput
            className="bg-card border border-border rounded-3xl px-4 py-4 text-foreground text-base mb-6"
            placeholder={t('message_placeholder', 'Describe your issue in detail. Include any relevant ride IDs or dates.')}
            placeholderTextColor="#a8a29e"
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            style={{ height: 140 }}
          />

          <TouchableOpacity onPress={handleSend} disabled={isSending} activeOpacity={0.85} style={{ shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 }}>
            <LinearGradient
              colors={['#f97316', '#f43f5e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', opacity: isSending ? 0.7 : 1 }}
            >
              {isSending ? <ActivityIndicator color="#fff" /> : (
                <View className="flex-row items-center gap-2">
                  <Send size={20} color="#fff" />
                  <Text className="text-white font-bold text-lg">{t('send_message_btn', 'Send Message')}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
