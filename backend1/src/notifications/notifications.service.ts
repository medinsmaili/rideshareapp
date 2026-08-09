import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class NotificationsService {
  constructor(
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {}

  private async getCredentials() {
    const [appId, apiKey] = await Promise.all([
      this.settingsService.getString('onesignal_app_id', this.configService.get<string>('ONESIGNAL_APP_ID') || ''),
      this.settingsService.getString('onesignal_api_key', this.configService.get<string>('ONESIGNAL_REST_API_KEY') || ''),
    ]);
    return { appId, apiKey };
  }

  // Resolve a per-language template from settings: `push_<key>_<lang>` → falls back to fallback strings.
  private async resolveTemplate(key: string, defaults: { heading: string; content: string }, vars: Record<string, string> = {}) {
    const langs = ['en', 'sq'];
    const out: { headings: Record<string, string>; contents: Record<string, string> } = {
      headings: {}, contents: {},
    };
    for (const lang of langs) {
      const h = await this.settingsService.getString(`push_${key}_heading_${lang}`, defaults.heading);
      const c = await this.settingsService.getString(`push_${key}_content_${lang}`, defaults.content);
      out.headings[lang] = this.interpolate(h, vars);
      out.contents[lang] = this.interpolate(c, vars);
    }
    return out;
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return Object.keys(vars).reduce((acc, k) => acc.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), vars[k] ?? ''), template);
  }

  async sendNotification(targetExternalIds: string[], headings: string, contents: string, data?: any) {
    if (!targetExternalIds?.length) return;
    const { appId, apiKey } = await this.getCredentials();
    if (!appId || !apiKey) return;

    const validIds = targetExternalIds.filter(id => id && typeof id === 'string' && id.length > 5);
    if (validIds.length === 0) return;

    // OneSignal REST API v2 — uses include_aliases with external_id
    const payload = {
      app_id: appId,
      include_aliases: {
        external_id: validIds,
      },
      target_channel: 'push',
      headings: { en: headings, sq: headings },
      contents: { en: contents, sq: contents },
      data: data || {},
    };

    try {
      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log('[OneSignal] Sent:', JSON.stringify(result));
    } catch (error) {
      console.error('[OneSignal] Error:', error);
    }
  }

  // Send a templated notification (uses per-language templates from settings, with fallbacks and var interpolation).
  async sendTemplated(
    targetExternalIds: string[],
    templateKey: string,
    defaults: { heading: string; content: string },
    vars: Record<string, string> = {},
    data?: any,
  ) {
    if (!targetExternalIds?.length) return;
    const { appId, apiKey } = await this.getCredentials();
    if (!appId || !apiKey) return;

    const validIds = targetExternalIds.filter(id => id && typeof id === 'string' && id.length > 5);
    if (validIds.length === 0) return;

    const { headings, contents } = await this.resolveTemplate(templateKey, defaults, vars);

    const payload = {
      app_id: appId,
      include_aliases: { external_id: validIds },
      target_channel: 'push',
      headings,
      contents,
      data: data || {},
    };

    try {
      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log('[OneSignal] Templated Sent:', JSON.stringify(result));
    } catch (error) {
      console.error('[OneSignal] Error:', error);
    }
  }
}
