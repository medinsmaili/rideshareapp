import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, ArrowRight, Eye, EyeOff, X, KeyRound } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import client, { setClientToken } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return Alert.alert(t('error', 'Error'), t('fill_all_fields', 'Please fill in all fields.'));
    }

    setIsLoading(true);
    try {
      const res = await client.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data?.access_token) {
        const token = res.data.access_token;
        let userData = res.data.user;
        if (!userData) {
          setClientToken(token);
          const profileRes = await client.get('/users/profile');
          userData = profileRes.data;
        }
        await signIn(token, userData || {});

        // Defer navigation to next tick to avoid crash during state update
        setTimeout(() => {
          if (userData?.is_email_verified === false) {
            router.replace('/verify-email');
          } else {
            router.replace('/(tabs)');
          }
        }, 0);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || t('invalid_credentials', 'Invalid email or password.');
      Alert.alert(t('login_failed', 'Login Failed'), Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCode = async () => {
    if (!resetEmail.trim()) {
      return Alert.alert(t('error', 'Error'), t('enter_email', 'Please enter your email address.'));
    }
    setIsResetting(true);
    try {
      await client.post('/auth/forgot-password', { email: resetEmail.trim().toLowerCase() });
      Alert.alert(t('success', 'Success'), t('code_sent', 'A reset code has been sent to your email.'));
      setResetStep(2);
    } catch (error: any) {
      Alert.alert(t('error', 'Error'), error.response?.data?.message || t('reset_failed', 'Failed to send reset code.'));
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || resetCode.length !== 6 || !newPassword) {
      return Alert.alert(t('error', 'Error'), t('fill_reset_fields', 'Please fill in the code and new password.'));
    }
    if (newPassword.length < 8) {
      return Alert.alert(t('error', 'Error'), t('password_length_error', 'Password must be at least 8 characters.'));
    }
    setIsResetting(true);
    try {
      await client.post('/auth/reset-password', {
        email: resetEmail.trim().toLowerCase(),
        code: resetCode,
        newPassword,
      });
      Alert.alert(t('success', 'Success'), t('password_updated', 'Password updated. You can now sign in.'));
      closeForgotModal();
    } catch (error: any) {
      Alert.alert(t('error', 'Error'), error.response?.data?.message || t('reset_failed', 'Failed to reset password.'));
    } finally {
      setIsResetting(false);
    }
  };

  const closeForgotModal = () => {
    setForgotVisible(false);
    setResetStep(1);
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="items-center mb-10">
            <Image
              source={require('../assets/images/logo.png')}
              style={{ width: 88, height: 88, marginBottom: 20 }}
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-foreground mb-2">
              {t('welcome_back', 'Welcome Back')}
            </Text>
            <Text className="text-muted-foreground text-center text-base">
              {t('login_subtitle', 'Sign in to continue your journey.')}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4 mb-6">
            {/* Email */}
            <View>
              <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">
                {t('email_label', 'Email')}
              </Text>
              <View className="bg-card rounded-3xl border border-border flex-row items-center px-4 h-14">
                <Mail size={20} color="#a8a29e" />
                <TextInput
                  className="flex-1 text-foreground text-base ml-3"
                  placeholder={t('email_placeholder', 'your@email.com')}
                  placeholderTextColor="#a8a29e"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">
                {t('password_label', 'Password')}
              </Text>
              <View className="bg-card rounded-3xl border border-border flex-row items-center px-4 h-14">
                <Lock size={20} color="#a8a29e" />
                <TextInput
                  ref={passwordRef}
                  className="flex-1 text-foreground text-base ml-3"
                  placeholder="••••••••"
                  placeholderTextColor="#a8a29e"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2 -mr-2">
                  {showPassword ? <EyeOff size={20} color="#a8a29e" /> : <Eye size={20} color="#a8a29e" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity className="self-end" onPress={() => setForgotVisible(true)}>
              <Text className="text-primary font-semibold text-sm">
                {t('forgot_password', 'Forgot Password?')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.85} style={{ shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 }}>
            <LinearGradient
              colors={['#f97316', '#f43f5e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 56, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white font-bold text-lg mr-2">
                    {t('sign_in', 'Sign In')}
                  </Text>
                  <ArrowRight size={20} color="#ffffff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Bottom Links */}
          <View className="items-center mt-8 gap-4">
            <View className="flex-row">
              <Text className="text-muted-foreground">
                {t('no_account', "Don't have an account? ")}
              </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text className="text-primary font-bold">{t('sign_up', 'Sign Up')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => router.push('/verify-email')}>
              <Text className="text-muted-foreground text-sm underline">
                {t('verify_account', 'Need to verify your account?')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={forgotVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-card w-full rounded-3xl p-6" style={{ maxWidth: 400 }}>
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-foreground">
                {t('reset_password_title', 'Reset Password')}
              </Text>
              <TouchableOpacity onPress={closeForgotModal} className="p-2 -mr-2">
                <X size={22} color="#a8a29e" />
              </TouchableOpacity>
            </View>

            {resetStep === 1 ? (
              <>
                <Text className="text-muted-foreground mb-6">
                  {t('reset_password_desc', "Enter your email and we'll send you a 6-digit reset code.")}
                </Text>
                <View className="bg-muted rounded-2xl flex-row items-center px-4 h-14 mb-6">
                  <Mail size={20} color="#a8a29e" />
                  <TextInput
                    className="flex-1 text-foreground text-base ml-3"
                    placeholder={t('email_placeholder', 'your@email.com')}
                    placeholderTextColor="#a8a29e"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                  />
                </View>
                <TouchableOpacity onPress={handleRequestCode} disabled={isResetting} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#f97316', '#f43f5e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isResetting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-bold text-base">
                        {t('send_code_btn', 'Send Code')}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text className="text-muted-foreground mb-6">
                  {t('enter_code_desc', 'Enter the 6-digit code and your new password.')}
                </Text>
                <View className="gap-4 mb-6">
                  <View className="bg-muted rounded-3xl flex-row items-center px-4 h-14">
                    <KeyRound size={20} color="#a8a29e" />
                    <TextInput
                      className="flex-1 text-foreground text-base ml-3 tracking-widest font-bold"
                      placeholder="000000"
                      placeholderTextColor="#a8a29e"
                      maxLength={6}
                      value={resetCode}
                      onChangeText={setResetCode}
                      keyboardType="number-pad"
                      autoFocus
                    />
                  </View>
                  <View className="bg-muted rounded-3xl flex-row items-center px-4 h-14">
                    <Lock size={20} color="#a8a29e" />
                    <TextInput
                      className="flex-1 text-foreground text-base ml-3"
                      placeholder={t('new_password_placeholder', 'New Password')}
                      placeholderTextColor="#a8a29e"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                  </View>
                </View>
                <TouchableOpacity onPress={handleResetPassword} disabled={isResetting} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#f97316', '#f43f5e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isResetting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-bold text-base">
                        {t('reset_btn', 'Update Password')}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
