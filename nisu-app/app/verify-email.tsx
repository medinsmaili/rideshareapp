import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const { user, signIn, userToken } = useAuth();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const routerEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const currentEmail = routerEmail || user?.email || '';
  const emailToVerify = currentEmail || manualEmail.trim().toLowerCase();

  const code = digits.join('');

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '');
    if (digit.length > 1) {
      const pasted = digit.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
    }
  };

  const handleVerify = async () => {
    if (!emailToVerify) {
      return Alert.alert(t('error_title', 'Error'), t('missing_email', 'Please enter your email address.'));
    }
    if (code.length !== 6) {
      return Alert.alert(t('error_title', 'Error'), t('code_length_error', 'Please enter all 6 digits.'));
    }

    setIsLoading(true);
    try {
      await client.post('/auth/verify-email', { email: emailToVerify, code });

      if (user && userToken) {
        // Already logged in but unverified — update auth state and go to app
        await signIn(userToken, { ...user, is_email_verified: true });
        setTimeout(() => router.replace('/(tabs)'), 0);
      } else {
        // From signup or manual — go to login
        Alert.alert(
          t('success_title', 'Verified!'),
          t('email_verified_login', 'Your email is verified. Please sign in to continue.'),
          [{ text: t('sign_in', 'Sign In'), onPress: () => router.replace('/login') }]
        );
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || t('invalid_code_error', 'Incorrect code. Please try again.');
      Alert.alert(t('error_title', 'Error'), Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!emailToVerify) {
      return Alert.alert(t('error_title', 'Error'), t('missing_email', 'Please enter your email first.'));
    }
    setIsResending(true);
    try {
      await client.post('/auth/resend-code', { email: emailToVerify });
      Alert.alert(t('success_title', 'Code Sent'), t('code_resent', 'A new 6-digit code has been sent to your email.'));
    } catch (e: any) {
      const msg = e.response?.data?.message || t('resend_failed', 'Failed to resend code.');
      Alert.alert(t('error_title', 'Error'), Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 py-3 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 bg-card rounded-2xl items-center justify-center border border-border"
          >
            <ArrowLeft size={20} color="#78716c" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6 justify-center">
          {/* Icon & Title */}
          <View className="items-center mb-8">
            <View className="bg-primary/10 w-20 h-20 rounded-full items-center justify-center mb-5">
              <ShieldCheck size={40} color="#f97316" />
            </View>
            <Text className="text-3xl font-bold text-foreground text-center mb-2">
              {t('check_email_header', 'Verify Your Email')}
            </Text>
            {emailToVerify ? (
              <Text className="text-muted-foreground text-center text-base px-4">
                {t('code_sent_instructions', "We've sent a 6-digit code to")}{'\n'}
                <Text className="font-bold text-foreground">{emailToVerify}</Text>
              </Text>
            ) : (
              <Text className="text-muted-foreground text-center text-base px-4">
                {t('enter_email_for_verify', 'Enter the email you registered with.')}
              </Text>
            )}
          </View>

          {/* Manual email input (fail-safe) — shown when no email from route params or auth */}
          {!currentEmail && (
            <View className="bg-card rounded-3xl border border-border flex-row items-center px-4 h-14 mb-6">
              <Mail size={20} color="#a8a29e" />
              <TextInput
                className="flex-1 text-foreground text-base ml-3"
                placeholder={t('email_placeholder', 'your@email.com')}
                placeholderTextColor="#a8a29e"
                value={manualEmail}
                onChangeText={setManualEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {/* 6-digit code input */}
          <View className="flex-row justify-center gap-3 mb-8">
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                className={`w-12 h-14 rounded-2xl text-center text-2xl font-bold border-2 ${
                  digit ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-foreground'
                }`}
                value={digit}
                onChangeText={(text) => handleDigitChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
                autoFocus={i === 0 && !!emailToVerify}
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={isLoading || code.length !== 6}
            activeOpacity={0.85}
            style={code.length === 6 ? { shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 } : undefined}
          >
            <LinearGradient
              colors={code.length === 6 ? ['#f97316', '#f43f5e'] : ['#a8a29e', '#a8a29e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24, opacity: isLoading ? 0.7 : code.length === 6 ? 1 : 0.4 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {t('verify_email_btn', 'Verify Email')}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend */}
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={isResending}
            className="items-center py-2"
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#f97316" />
            ) : (
              <Text className="text-primary font-semibold">
                {t('resend_code_btn', "Didn't receive a code? Resend")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
