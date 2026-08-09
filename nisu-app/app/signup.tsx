import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const passwordValid = hasMinLength && hasUppercase && hasLowercase && hasDigit;

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !gender || !phone.trim()) {
      return Alert.alert(t('error', 'Error'), t('fill_required_fields', 'Please fill in all required fields.'));
    }
    if (!passwordValid) {
      return Alert.alert(
        t('error', 'Error'),
        t('password_complexity_error', 'Password must be at least 8 characters with uppercase, lowercase, and a number.')
      );
    }

    setIsLoading(true);
    try {
      await client.post('/auth/register', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone_number: phone.trim(),
        gender,
      });
      // Defer navigation to next tick to avoid crash during state update
      setTimeout(() => {
        router.replace(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&fromSignup=1`);
      }, 0);
    } catch (error: any) {
      const msg = error.response?.data?.message || t('signup_error', 'Failed to create account.');
      Alert.alert(t('signup_failed', 'Signup Failed'), Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRule = ({ met, label }: { met: boolean; label: string }) => (
    <View className="flex-row items-center gap-2">
      <View className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
      <Text className={`text-xs ${met ? 'text-primary' : 'text-muted-foreground'}`}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-card rounded-full items-center justify-center border border-border mb-6"
          >
            <ArrowLeft size={20} color="#78716c" />
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground mb-2">
              {t('create_account', 'Create Account')}
            </Text>
            <Text className="text-muted-foreground text-base">
              {t('signup_subtitle', 'Join Nisu and start sharing rides today.')}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4 mb-6">
            {/* Name Row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">
                  {t('first_name', 'First Name')} *
                </Text>
                <View className="bg-card rounded-3xl border border-border flex-row items-center px-4 h-14">
                  <User size={18} color="#a8a29e" />
                  <TextInput
                    className="flex-1 text-foreground text-base ml-3"
                    placeholder={t('first_name_placeholder', 'John')}
                    placeholderTextColor="#a8a29e"
                    value={firstName}
                    onChangeText={setFirstName}
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">
                  {t('last_name', 'Last Name')} *
                </Text>
                <View className="bg-card rounded-3xl border border-border flex-row items-center px-4 h-14">
                  <TextInput
                    ref={lastNameRef}
                    className="flex-1 text-foreground text-base"
                    placeholder={t('last_name_placeholder', 'Doe')}
                    placeholderTextColor="#a8a29e"
                    value={lastName}
                    onChangeText={setLastName}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
              </View>
            </View>

            {/* Gender */}
            <View>
              <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">
                {t('gender_label', 'Gender')} *
              </Text>
              <View className="flex-row gap-3">
                {[
                  { key: 'M', label: t('gender_male', 'Male') },
                  { key: 'F', label: t('gender_female', 'Female') },
                  { key: 'O', label: t('gender_other', 'Other') },
                ].map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setGender(key)}
                    className={`flex-1 h-14 rounded-3xl border items-center justify-center ${
                      gender === key ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className={`font-bold text-sm ${gender === key ? 'text-primary' : 'text-muted-foreground'}`}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Email */}
            <View>
              <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">
                {t('email_label', 'Email')} *
              </Text>
              <View className="bg-card rounded-3xl border border-border flex-row items-center px-4 h-14">
                <Mail size={18} color="#a8a29e" />
                <TextInput
                  ref={emailRef}
                  className="flex-1 text-foreground text-base ml-3"
                  placeholder={t('email_placeholder', 'your@email.com')}
                  placeholderTextColor="#a8a29e"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                />
              </View>
            </View>

            {/* Phone */}
            <View>
              <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">
                {t('phone_label', 'Phone Number')} *
              </Text>
              <View className="bg-card rounded-3xl border border-border flex-row items-center px-4 h-14">
                <Phone size={18} color="#a8a29e" />
                <TextInput
                  ref={phoneRef}
                  className="flex-1 text-foreground text-base ml-3"
                  placeholder="+383 44 123 456"
                  placeholderTextColor="#a8a29e"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">
                {t('password_label', 'Password')} *
              </Text>
              <View className="bg-card rounded-3xl border border-border flex-row items-center px-4 h-14">
                <Lock size={18} color="#a8a29e" />
                <TextInput
                  ref={passwordRef}
                  className="flex-1 text-foreground text-base ml-3"
                  placeholder="••••••••"
                  placeholderTextColor="#a8a29e"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleSignup}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2 -mr-2">
                  {showPassword ? <EyeOff size={18} color="#a8a29e" /> : <Eye size={18} color="#a8a29e" />}
                </TouchableOpacity>
              </View>

              {password.length > 0 && (
                <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-2 ml-1">
                  <PasswordRule met={hasMinLength} label={t('rule_8_chars', '8+ chars')} />
                  <PasswordRule met={hasUppercase} label={t('rule_uppercase', 'Uppercase')} />
                  <PasswordRule met={hasLowercase} label={t('rule_lowercase', 'Lowercase')} />
                  <PasswordRule met={hasDigit} label={t('rule_digit', 'Number')} />
                </View>
              )}
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity onPress={handleSignup} disabled={isLoading} activeOpacity={0.85} style={{ shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 }}>
            <LinearGradient
              colors={['#f97316', '#f43f5e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {t('sign_up', 'Sign Up')}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Terms */}
          <View className="mt-4 mb-8 px-4">
            <Text className="text-center text-muted-foreground text-xs leading-5">
              {t('signup_terms_prefix', 'By signing up, you agree to our ')}{' '}
              <Text
                className="text-primary underline"
                onPress={() => router.push('/terms-of-service')}
              >
                {t('terms_of_service', 'Terms of Service')}
              </Text>
              {' '}{t('and', 'and')}{' '}
              <Text
                className="text-primary underline"
                onPress={() => router.push('/privacy-policy')}
              >
                {t('privacy_policy', 'Privacy Policy')}
              </Text>
              .
            </Text>
          </View>

          {/* Already have account */}
          <View className="flex-row justify-center mb-8">
            <Text className="text-muted-foreground">
              {t('already_have_account', 'Already have an account? ')}
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary font-bold">{t('sign_in', 'Sign In')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
