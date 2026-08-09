import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Setting) private repo: Repository<Setting>) {}

  // ADDED: Support for listing all config keys in the Admin Panel
  async findAll(): Promise<Setting[]> {
    return this.repo.find();
  }

  async getActiveAd() {
    const setting = await this.repo.findOneBy({ key: 'active_ad' });
    if (!setting || !setting.value) return null;
    try {
      let parsed: any = JSON.parse(setting.value);
      // Unwrap legacy double-wrapped values: {"value":"{...}"} → {...}
      while (parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        && Object.keys(parsed).length === 1 && 'value' in parsed
        && typeof parsed.value === 'string') {
        try { parsed = JSON.parse(parsed.value); } catch { parsed = parsed.value; break; }
      }
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  async updateSetting(key: string, body: any) {
    // Accept either { value: X } wrappers from the admin UI or a raw value.
    let rawValue: any = body;
    if (body && typeof body === 'object' && !Array.isArray(body) && 'value' in body) {
      rawValue = (body as any).value;
    }
    const stringValue = typeof rawValue === 'object' && rawValue !== null
      ? JSON.stringify(rawValue)
      : String(rawValue ?? '');

    let setting = await this.repo.findOneBy({ key });
    if (setting) {
      setting.value = stringValue;
    } else {
      setting = this.repo.create({ key, value: stringValue });
    }
    return this.repo.save(setting);
  }

  async getSettingByKey(key: string) {
    const setting = await this.repo.findOneBy({ key });
    if (!setting || !setting.value) return null;
    try {
      // Attempt to parse JSON (for Ads/Configs)
      return JSON.parse(setting.value);
    } catch (e) {
      // Fallback to raw string (for legal text like Privacy Policy)
      return setting.value;
    }
  }

  // Get a raw string setting value. Unwraps legacy {"value":"..."} wrappers. Returns env fallback or "" if missing.
  async getString(key: string, envFallback?: string): Promise<string> {
    const setting = await this.repo.findOneBy({ key });
    if (!setting?.value || setting.value.trim() === '') return envFallback ?? '';
    let v: any = setting.value.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('{') && v.endsWith('}'))) {
      try { v = JSON.parse(v); } catch { return String(v); }
    }
    // Unwrap { value: "..." } possibly stringified again
    let guard = 0;
    while (v && typeof v === 'object' && !Array.isArray(v)
      && Object.keys(v).length === 1 && 'value' in v && guard++ < 4) {
      v = (v as any).value;
      if (typeof v === 'string') {
        const s = v.trim();
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith('{') && s.endsWith('}'))) {
          try { v = JSON.parse(s); } catch { break; }
        }
      }
    }
    return typeof v === 'string' ? v : String(v ?? '');
  }
}