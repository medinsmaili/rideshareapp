import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useLanguage } from '../context/LanguageContext';
import client from '../api/client';

type Section = { heading: string; body: string };
type LegalDoc = { title: string; intro: string; sections: Section[] };

const FALLBACK: Record<'en' | 'sq', LegalDoc> = {
  en: {
    title: 'Privacy Policy',
    intro: 'Welcome to Nisu! Your privacy is critically important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.',
    sections: [
      { heading: '1. Information We Collect', body: 'We collect information you provide directly to us when you register, such as your name, email address, phone number, profile picture, gender, and verification documents (Driver/Student IDs). We also securely process vehicle details.' },
      { heading: '2. How We Use Your Information', body: 'We use the collected data to securely match drivers and passengers, verify identities for safety features (like student pricing and female-only rides), provide customer support, and communicate updates. Your location is only used to coordinate meeting points safely.' },
      { heading: '3. Sharing of Your Information', body: 'To facilitate carpooling, we share necessary public information (like your first name, profile picture, vehicle details, and average rating) with other users. We do not sell your personal data to third parties. We may disclose information if required by law or to protect the safety of our users.' },
      { heading: '4. Data Security', body: 'We use industry-standard encryption to protect your personal data and uploaded verification documents. However, no method of electronic transmission is completely flawless, and we cannot guarantee absolute security.' },
      { heading: '5. Contact Us & Data Deletion', body: 'If you have questions about this Privacy Policy or wish to request complete data deletion, please contact our support team at support@nisu.app.' },
    ],
  },
  sq: {
    title: 'Politika e Privatësisë',
    intro: 'Mirësevini në Nisu! Privatësia juaj është jashtëzakonisht e rëndësishme për ne. Kjo Politikë e Privatësisë shpjegon se si ne mbledhim, përdorim, zbulojmë dhe mbrojmë informacionin tuaj kur përdorni aplikacionin tonë.',
    sections: [
      { heading: '1. Informacioni që Mbledhim', body: 'Ne mbledhim informacionin që ju na jepni drejtpërdrejt kur regjistroheni, të tilla si emri juaj, adresa e emailit, numri i telefonit, fotografia e profilit, gjinia dhe dokumentet e verifikimit (Karta e Studentit/Patenta). Ne gjithashtu përpunojmë në mënyrë të sigurt detajet e automjetit.' },
      { heading: '2. Si e Përdorim Informacionin Tuaj', body: 'Ne përdorim të dhënat e mbledhura për të lidhur në mënyrë të sigurt shoferët dhe pasagjerët, për të verifikuar identitetin për veçoritë e sigurisë (si çmimet e studentëve dhe udhëtimet vetëm për vajza). Vendndodhja juaj përdoret vetëm për të koordinuar pikat e takimit.' },
      { heading: '3. Ndarja e Informacionit Tuaj', body: 'Për të lehtësuar udhëtimet, ne ndajmë informacionin e nevojshëm publik (si emrin tuaj të parë, foton e profilit, detajet e automjetit dhe vlerësimin mesatar) me përdoruesit e tjerë. Ne nuk shesim të dhënat tuaja personale te palët e treta.' },
      { heading: '4. Siguria e të Dhënave', body: 'Ne përdorim enkriptim standard të industrisë për të mbrojtur të dhënat tuaja personale dhe dokumentet e verifikimit. Sidoqoftë, asnjë metodë e transmetimit elektronik nuk është plotësisht e përsosur dhe ne nuk mund të garantojmë siguri absolute.' },
      { heading: '5. Na Kontaktoni & Fshirja e të Dhënave', body: 'Nëse keni pyetje rreth kësaj Politike të Privatësisë ose dëshironi të kërkoni fshirjen e plotë të të dhënave tuaja, ju lutemi kontaktoni ekipin tonë në support@nisu.app.' },
    ],
  },
};

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fgColor = isDark ? '#fefbf6' : '#1c1917';

  const lang: 'en' | 'sq' = locale === 'sq' || locale === 'al' ? 'sq' : 'en';
  const [doc, setDoc] = useState<LegalDoc>(FALLBACK[lang]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await client.get(`/settings/privacy_policy_${lang}`);
        const remote = res?.data;
        if (!cancelled && remote && typeof remote === 'object' && Array.isArray(remote.sections)) {
          setDoc({
            title: String(remote.title || FALLBACK[lang].title),
            intro: String(remote.intro || FALLBACK[lang].intro),
            sections: remote.sections.map((s: any) => ({
              heading: String(s?.heading || ''),
              body: String(s?.body || ''),
            })).filter((s: Section) => s.heading || s.body),
          });
        } else if (!cancelled) {
          setDoc(FALLBACK[lang]);
        }
      } catch {
        if (!cancelled) setDoc(FALLBACK[lang]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lang]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 py-4 flex-row items-center bg-background">
        <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 rounded-2xl bg-card border border-border items-center justify-center mr-3">
          <ArrowLeft size={20} color={fgColor} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground flex-1">{doc.title}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <Text className="text-foreground text-base mb-6 leading-6">{doc.intro}</Text>
          {doc.sections.map((section, index) => (
            <View key={index} className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-2">{section.heading}</Text>
              <Text className="text-foreground text-base leading-6 text-muted-foreground">{section.body}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
