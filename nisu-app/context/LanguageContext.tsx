import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

type Language = { id: number; name: string; code: string; };

type LanguageContextType = {
  locale: string;
  languages: Language[];
  setLanguage: (code: string) => Promise<void>;
  t: (key: string, defaultValue?: string) => string;
  isLoading: boolean;
  hasChosenLanguage: boolean; // ✅ Added
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState('en');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasChosenLanguage, setHasChosenLanguage] = useState<boolean>(true); // Default to true to prevent flickering

  const fetchTranslations = async (code: string) => {
    try {
      const res = await client.get(`/translations?lang=${code}`);
      setTranslations(res.data || {});
    } catch (error) {
      console.error('Failed to fetch translations', error);
    }
  };

  useEffect(() => {
    const initLanguage = async () => {
      try {
        const langRes = await client.get('/languages');
        const activeLangs = Array.isArray(langRes.data) ? langRes.data.filter((l: any) => l.is_active) : [];
        setLanguages(activeLangs);

        const savedLocale = await AsyncStorage.getItem('user_locale');
        if (savedLocale) {
          setLocale(savedLocale);
          await fetchTranslations(savedLocale);
          setHasChosenLanguage(true);
        } else {
          setHasChosenLanguage(false); // ✅ Trigger selection screen
        }
      } catch (e) {
        console.error('Init language error', e);
      } finally {
        setIsLoading(false);
      }
    };
    initLanguage();
  }, []);

  const setLanguage = async (code: string) => {
    try {
      await fetchTranslations(code);
      setLocale(code);
      await AsyncStorage.setItem('user_locale', code);
      setHasChosenLanguage(true);
    } catch (e) {
      console.error('Set language error:', e);
    }
  };

  const t = (key: string, defaultValue?: string) => translations[key] || defaultValue || key;

  return (
    <LanguageContext.Provider value={{ locale, languages, setLanguage, t, isLoading, hasChosenLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};