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
    title: 'Terms of Service',
    intro: 'Welcome to Nisu! By accessing or using our mobile application, you agree to be bound by these Terms of Service.',
    sections: [
      { heading: '1. User Eligibility', body: 'You must be at least 18 years old to use Nisu. Creating an account requires providing accurate and truthful information. Falsifying identities, student statuses, or vehicle details may result in an immediate permanent ban.' },
      { heading: '2. Driver & Passenger Conduct', body: "Drivers must hold a valid driver's license and maintain safe, roadworthy vehicles. Passengers must arrive on time and respect the driver's rules. Nisu maintains a strict zero-tolerance policy for harassment, discrimination, or dangerous behavior." },
      { heading: '3. Bookings and Cancellations', body: 'When a seat is booked, both parties are expected to honor the arrangement. Repeated cancellations without valid reasons or no-shows may negatively impact your rating and lead to automatic account suspension.' },
      { heading: '4. Limitation of Liability', body: 'Nisu acts solely as a platform connecting independent drivers and passengers. We do not provide transportation services ourselves. Nisu is not liable for any accidents, injuries, lost items, or disputes that occur during a ride.' },
      { heading: '5. Account Termination', body: 'We reserve the right to suspend or terminate your account at our sole discretion if you violate these Terms of Service or if a high number of legitimate reports are filed against you by other users on the platform.' },
    ],
  },
  sq: {
    title: 'Kushtet e Shërbimit',
    intro: 'Mirësevini në Nisu! Duke hyrë ose përdorur aplikacionin tonë celular, ju pranoni të jeni të detyruar nga këto Kushte të Shërbimit.',
    sections: [
      { heading: '1. Kriteret e Përdoruesit', body: 'Ju duhet të jeni të paktën 18 vjeç për të përdorur Nisu. Krijimi i një llogarie kërkon dhënien e informacioneve të sakta dhe të vërteta. Falsifikimi i identiteteve, statusit të studentit ose detajeve të automjetit mund të rezultojë në një përjashtim të menjëhershëm dhe të përhershëm.' },
      { heading: '2. Sjellja e Shoferit & Pasagjerit', body: 'Shoferët duhet të kenë një patentë të vlefshme dhe të mbajnë automjete të sigurta. Pasagjerët duhet të arrijnë në kohë dhe të respektojnë rregullat e shoferit. Nisu mban një politikë strikte me tolerancë zero ndaj ngacmimeve, diskriminimit ose sjelljeve të rrezikshme.' },
      { heading: '3. Rezervimet dhe Anulimet', body: 'Kur një vend rezervohet, të dyja palët pritet të respektojnë marrëveshjen. Anulimet e përsëritura pa arsye të vlefshme ose mosparaqitjet mund të ndikojnë negativisht në vlerësimin tuaj dhe të çojnë në pezullim automatik të llogarisë.' },
      { heading: '4. Kufizimi i Përgjegjësisë', body: 'Nisu vepron vetëm si një platformë që lidh shoferët e pavarur dhe pasagjerët. Ne nuk ofrojmë shërbime transporti vetë. Nisu nuk është përgjegjës për asnjë aksident, lëndim, sende të humbura ose mosmarrëveshje që ndodhin gjatë një udhëtimi.' },
      { heading: '5. Mbyllja e Llogarisë', body: 'Ne rezervojmë të drejtën të pezullojmë ose përfundojmë llogarinë tuaj në diskrecionin tonë nëse shkelni këto Kushte të Shërbimit ose nëse një numër i madh raportimesh legjitime ngrihen kundër jush nga përdorues të tjerë.' },
    ],
  },
};

export default function TermsOfServiceScreen() {
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
        const res = await client.get(`/settings/terms_of_service_${lang}`);
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
