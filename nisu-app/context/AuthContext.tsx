import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';
import { setClientToken, setUnauthorizedHandler } from '../api/client';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  gender?: string;
  profile_picture?: string;
  is_verified_driver: boolean;
  is_student_verified: boolean;
  is_email_verified?: boolean;
}

interface AuthContextType {
  userToken: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function registerOneSignal(userId: string) {
  try {
    // Login links this device to the user's external ID
    OneSignal.login(String(userId));
    // Ensure the push subscription is active
    OneSignal.User.pushSubscription.optIn();
  } catch (e) {
    console.warn('OneSignal registration error:', e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const oneSignalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted auth on app start
  useEffect(() => {
    let cancelled = false;
    const loadStorageData = async () => {
      try {
        const token = await AsyncStorage.getItem('user_token');
        const userData = await AsyncStorage.getItem('user_data');
        if (cancelled) return;
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUserToken(token);
          setUser(parsedUser);
          setClientToken(token);
          if (parsedUser?.id) {
            // Small delay to let OneSignal.initialize() + requestPermission() finish first
            oneSignalTimerRef.current = setTimeout(() => {
              if (!cancelled) registerOneSignal(parsedUser.id);
            }, 1500);
          }
        }
      } catch (e) {
        console.error('Storage Loading Error:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadStorageData();
    return () => {
      cancelled = true;
      if (oneSignalTimerRef.current) clearTimeout(oneSignalTimerRef.current);
    };
  }, []);

  const signIn = async (token: string, userData: any) => {
    try {
      await AsyncStorage.setItem('user_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setClientToken(token);
      setUserToken(token);
      setUser(userData);
      if (userData?.id) {
        registerOneSignal(userData.id);
      }
    } catch (e) {
      console.error('Sign In Error:', e);
    }
  };

  const signOut = async () => {
    try {
      OneSignal.logout();
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_data');
      setClientToken(null);
      setUserToken(null);
      setUser(null);
    } catch (e) {
      console.error('Sign Out Error:', e);
    }
  };

  // Wire 401 responses to auto sign-out (handler ref so the latest signOut closure runs)
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;
  useEffect(() => {
    setUnauthorizedHandler(() => { void signOutRef.current(); });
  }, []);

  return (
    <AuthContext.Provider value={{ userToken, user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
