import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, ArrowLeft, Send, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const QUICK_TAGS = [
  { key: 'punctual', label: 'On time', positive: true },
  { key: 'clean_car', label: 'Clean car', positive: true },
  { key: 'safe_driver', label: 'Safe driver', positive: true },
  { key: 'friendly', label: 'Friendly', positive: true },
  { key: 'late', label: 'Was late', positive: false },
  { key: 'reckless', label: 'Reckless driving', positive: false },
];

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function RatingReviewScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { driverId, driverName, driverAvatar } = useLocalSearchParams();

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAvatarUrl = (path?: string, firstName: string = 'User') => {
    if (!path) return `https://ui-avatars.com/api/?name=${firstName}&background=f97316&color=fff`;
    if (path.startsWith('http')) return path;
    return `https://api.nisu.app/${path.startsWith('/') ? path.substring(1) : path}`;
  };

  const toggleTag = (key: string) => {
    setSelectedTags(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const buildFeedbackText = () => {
    const parts: string[] = [];
    if (selectedTags.length > 0) {
      const tagLabels = selectedTags.map(k => QUICK_TAGS.find(t => t.key === k)?.label).filter(Boolean);
      parts.push(tagLabels.join(', '));
    }
    if (feedback.trim()) parts.push(feedback.trim());
    return parts.join(' — ');
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(t('rating_required', 'Rating Required'), t('select_star_prompt', 'Please select a star rating.'));
      return;
    }
    setIsSubmitting(true);
    try {
      await client.post(`/users/${driverId}/rate`, {
        rating,
        feedback: buildFeedbackText() || undefined,
      });
      Alert.alert(t('success', 'Thank You!'), t('review_thank_you', 'Your feedback helps make Nisu better for everyone.'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(t('error', 'Error'), error.response?.data?.message || t('rating_submit_error', 'Could not submit rating.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayStar = rating;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-row items-center px-6 pt-4 pb-4 border-b border-border bg-card">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-muted rounded-full items-center justify-center mr-4">
            <ArrowLeft size={20} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">{t('rate_driver', 'Rate Driver')}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Driver profile */}
          <View className="items-center mb-8">
            <View className="relative mb-4">
              <Image source={{ uri: getAvatarUrl(String(driverAvatar || '')) }} className="w-24 h-24 rounded-full bg-muted" />
              <View className="absolute -bottom-2 -right-2 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-background">
                <Star size={14} color="#fff" fill="#fff" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-foreground">{driverName || t('unknown_driver', 'Driver')}</Text>
            <Text className="text-muted-foreground mt-1 text-sm">{t('how_was_ride', 'How was your ride with this driver?')}</Text>
          </View>

          {/* Stars */}
          <View className="bg-card border border-border rounded-3xl p-6 mb-4">
            <View className="flex-row justify-center gap-3 mb-3">
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  className="p-1"
                  activeOpacity={0.7}
                >
                  <Star
                    size={44}
                    color={displayStar >= star ? '#f59e0b' : '#e2e8f0'}
                    fill={displayStar >= star ? '#f59e0b' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {displayStar > 0 && (
              <Text className="text-center text-lg font-bold text-foreground">{t(`star_${displayStar}`, STAR_LABELS[displayStar])}</Text>
            )}
          </View>

          {/* Quick tags */}
          <Text className="text-sm font-bold text-muted-foreground uppercase mb-3">{t('quick_feedback', 'Quick Tags')}</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {QUICK_TAGS.map(tag => {
              const active = selectedTags.includes(tag.key);
              return (
                <TouchableOpacity
                  key={tag.key}
                  onPress={() => toggleTag(tag.key)}
                  className={`flex-row items-center px-3 py-2 rounded-full border ${active ? (tag.positive ? 'bg-primary/10 border-primary' : 'bg-destructive/10 border-destructive') : 'bg-card border-border'}`}
                >
                  {tag.positive
                    ? <ThumbsUp size={13} color={active ? '#f97316' : '#a8a29e'} style={{ marginRight: 5 }} />
                    : <ThumbsDown size={13} color={active ? '#ef4444' : '#a8a29e'} style={{ marginRight: 5 }} />
                  }
                  <Text className={`text-sm font-semibold ${active ? (tag.positive ? 'text-primary' : 'text-destructive') : 'text-muted-foreground'}`}>
                    {t(`tag_${tag.key}`, tag.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Free text */}
          <Text className="text-sm font-bold text-muted-foreground uppercase mb-3">{t('leave_feedback', 'Additional Comments')}</Text>
          <TextInput
            className="bg-card border border-border rounded-3xl p-4 text-foreground text-base h-28 mb-8"
            placeholder={t('feedback_placeholder', 'What stood out about this trip?')}
            placeholderTextColor="#a8a29e"
            multiline
            textAlignVertical="top"
            value={feedback}
            onChangeText={setFeedback}
          />

          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting || rating === 0} activeOpacity={0.85} style={rating > 0 ? { shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 } : undefined}>
            <LinearGradient
              colors={rating > 0 ? ['#f97316', '#f43f5e'] : ['#a8a29e', '#a8a29e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : (
                <View className="flex-row items-center">
                  <Send size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold text-lg">{t('submit_review', 'Submit Review')}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} className="mt-4 py-3 items-center">
            <Text className="text-muted-foreground font-medium">{t('skip_for_now', 'Skip for now')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
