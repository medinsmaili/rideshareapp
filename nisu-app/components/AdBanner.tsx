import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import { ExternalLink } from 'lucide-react-native';

export interface BannerPayload {
  type?: 'image' | 'ad_code';
  title?: string;
  description?: string;
  image?: string;
  link?: string;
  bg_color?: string;
  ad_code?: string;
  ad_height?: number | string;
}

// Dynamically require react-native-webview so the app doesn't crash when it's not installed.
let WebViewComponent: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  WebViewComponent = require('react-native-webview').WebView;
} catch {
  WebViewComponent = null;
}

function isEmpty(banner: BannerPayload | null | undefined): boolean {
  if (!banner) return true;
  if ((banner.type ?? 'image') === 'ad_code') return !banner.ad_code;
  return !(banner.title || banner.description || banner.image);
}

export default function AdBanner({ banner }: { banner: BannerPayload | null | undefined }) {
  if (isEmpty(banner)) return null;
  const type = banner!.type ?? 'image';

  if (type === 'ad_code' && banner!.ad_code) {
    if (!WebViewComponent) {
      if (__DEV__) {
        console.warn('[AdBanner] react-native-webview is not installed — ad_code banner will not render.');
      }
      return null;
    }
    const height = Number(banner!.ad_height) || 120;
    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}body{padding:4px;overflow:hidden;}</style></head><body>${banner!.ad_code}</body></html>`;

    return (
      <View
        className="mx-6 mt-6 rounded-3xl overflow-hidden border border-border"
        style={{ height, backgroundColor: banner!.bg_color || 'transparent' }}
      >
        <WebViewComponent
          originWhitelist={['*']}
          source={{ html }}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          javaScriptEnabled
          domStorageEnabled
          scalesPageToFit={Platform.OS === 'android'}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(req: any) => {
            // Open ad clicks in external browser instead of inside the WebView.
            if (req.url && req.url !== 'about:blank' && !req.url.startsWith('data:')) {
              Linking.openURL(req.url).catch(() => {});
              return false;
            }
            return true;
          }}
        />
      </View>
    );
  }

  // Image banner
  const b = banner!;
  return (
    <TouchableOpacity
      onPress={() => b.link && Linking.openURL(b.link)}
      activeOpacity={b.link ? 0.8 : 1}
      className="mx-6 mt-6 rounded-3xl overflow-hidden shadow-sm border border-border"
      style={{ backgroundColor: b.bg_color || '#f0fdf4' }}
    >
      {b.image ? (
        <Image source={{ uri: b.image }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
      ) : null}
      <View className="p-4 flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          {b.title ? <Text className="font-bold text-base text-foreground">{b.title}</Text> : null}
          {b.description ? <Text className="text-sm text-muted-foreground mt-0.5">{b.description}</Text> : null}
        </View>
        {b.link ? <ExternalLink size={18} color="#f97316" /> : null}
      </View>
    </TouchableOpacity>
  );
}
