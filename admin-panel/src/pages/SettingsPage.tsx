import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2, Save, Image as ImageIcon, Link as LinkIcon, Type, FileText, Palette, Megaphone,
  Key, Mail, Bell, Send, Server, Code2, Scale, Plus, Trash2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

type BannerType = "image" | "ad_code";
interface BannerFields {
  type: BannerType;
  title: string;
  description: string;
  image: string;
  link: string;
  bg_color: string;
  ad_code: string;
  ad_height: string;
}

function parseBannerJson(value: string): BannerFields {
  const empty: BannerFields = { type: "image", title: "", description: "", image: "", link: "", bg_color: "", ad_code: "", ad_height: "120" };
  try {
    const parsed = JSON.parse(value);
    return {
      type: parsed.type === "ad_code" ? "ad_code" : "image",
      title: parsed.title || "",
      description: parsed.description || "",
      image: parsed.image || "",
      link: parsed.link || "",
      bg_color: parsed.bg_color || "",
      ad_code: parsed.ad_code || "",
      ad_height: parsed.ad_height ? String(parsed.ad_height) : "120",
    };
  } catch {
    return empty;
  }
}

function BannerEditor({ setting, onSaved }: { setting: any; onSaved: () => void }) {
  const [fields, setFields] = useState(() => parseBannerJson(setting.value || "{}"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFields(parseBannerJson(setting.value || "{}"));
  }, [setting.value]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = { type: fields.type };
      if (fields.type === "image") {
        if (fields.title) payload.title = fields.title;
        if (fields.description) payload.description = fields.description;
        if (fields.image) payload.image = fields.image;
        if (fields.link) payload.link = fields.link;
        if (fields.bg_color) payload.bg_color = fields.bg_color;
      } else {
        if (fields.ad_code) payload.ad_code = fields.ad_code;
        if (fields.ad_height) payload.ad_height = parseInt(fields.ad_height, 10) || 120;
      }
      await api.updateSetting("active_ad", { value: JSON.stringify(payload) });
      toast.success("Banner updated");
      onSaved();
    } catch {
      toast.error("Failed to update banner");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await api.updateSetting("active_ad", { value: "{}" });
      setFields({ type: "image", title: "", description: "", image: "", link: "", bg_color: "", ad_code: "", ad_height: "120" });
      toast.success("Banner cleared");
      onSaved();
    } catch {
      toast.error("Failed to clear banner");
    } finally {
      setSaving(false);
    }
  };

  const previewHasContent = fields.type === "image"
    ? (fields.title || fields.description || fields.image)
    : !!fields.ad_code;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10"><Megaphone className="h-4 w-4 text-primary" /></div>
          <div>
            <CardTitle className="text-sm font-semibold">Home Screen Banner</CardTitle>
            <CardDescription className="text-xs mt-0.5">Displayed between the search card and recent rides. Leave fields blank to hide the banner.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Banner Type</Label>
          <Select value={fields.type} onValueChange={(v: BannerType) => setFields(f => ({ ...f, type: v }))}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="image">
                <div className="flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" /> Image Banner</div>
              </SelectItem>
              <SelectItem value="ad_code">
                <div className="flex items-center gap-2"><Code2 className="h-3.5 w-3.5" /> Google Ad Code</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {fields.type === "image" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs"><Type className="h-3.5 w-3.5" /> Title</Label>
              <Input value={fields.title} onChange={e => setFields(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Promotion" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs"><Palette className="h-3.5 w-3.5" /> Background Color</Label>
              <div className="flex gap-2">
                <Input value={fields.bg_color} onChange={e => setFields(f => ({ ...f, bg_color: e.target.value }))} placeholder="#f0fdf4 or rgba(…)" className="flex-1" />
                {fields.bg_color && <div className="h-9 w-9 rounded-md border shrink-0" style={{ backgroundColor: fields.bg_color }} />}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="flex items-center gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Description</Label>
              <Textarea value={fields.description} onChange={e => setFields(f => ({ ...f, description: e.target.value }))} placeholder="Short description shown below the title" rows={2} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs"><ImageIcon className="h-3.5 w-3.5" /> Image URL</Label>
              <Input value={fields.image} onChange={e => setFields(f => ({ ...f, image: e.target.value }))} placeholder="https://… (displayed at top of card)" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs"><LinkIcon className="h-3.5 w-3.5" /> Link URL</Label>
              <Input value={fields.link} onChange={e => setFields(f => ({ ...f, link: e.target.value }))} placeholder="https://… (tapping opens this)" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs"><Code2 className="h-3.5 w-3.5" /> Ad Code (HTML)</Label>
              <Textarea
                value={fields.ad_code}
                onChange={e => setFields(f => ({ ...f, ad_code: e.target.value }))}
                placeholder={`<!-- Paste your Google AdSense / ad network HTML+JS snippet here -->\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossorigin="anonymous"></script>\n<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXX" data-ad-slot="YYYY" data-ad-format="auto"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
                rows={10}
                className="font-mono text-xs resize-y"
              />
              <p className="text-[11px] text-muted-foreground">Rendered inside a WebView in the mobile app. Requires <code className="bg-muted px-1 rounded">react-native-webview</code> installed in the mobile package.</p>
            </div>
            <div className="space-y-1.5 max-w-xs">
              <Label className="text-xs">Banner Height (px)</Label>
              <Input type="number" value={fields.ad_height} onChange={e => setFields(f => ({ ...f, ad_height: e.target.value }))} placeholder="120" />
            </div>
          </div>
        )}

        {previewHasContent && fields.type === "image" && (
          <div className="rounded-xl overflow-hidden border mt-2" style={{ backgroundColor: fields.bg_color || "#f0fdf4" }}>
            {fields.image && <img src={fields.image} alt="" className="w-full h-24 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
            <div className="px-4 py-3">
              {fields.title && <p className="font-bold text-sm">{fields.title}</p>}
              {fields.description && <p className="text-xs text-muted-foreground mt-0.5">{fields.description}</p>}
              {fields.link && <p className="text-xs text-primary mt-1 truncate">{fields.link}</p>}
            </div>
          </div>
        )}
        {previewHasContent && fields.type === "ad_code" && (
          <div className="rounded-xl overflow-hidden border mt-2 bg-muted/30">
            <iframe
              title="Ad Preview"
              srcDoc={`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:8px;font-family:-apple-system,sans-serif;}</style></head><body>${fields.ad_code}</body></html>`}
              sandbox="allow-scripts allow-same-origin allow-popups"
              style={{ width: "100%", height: `${parseInt(fields.ad_height, 10) || 120}px`, border: 0 }}
            />
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Banner
          </Button>
          <Button variant="outline" onClick={handleClear} disabled={saving} size="sm">Clear Banner</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ------- Simple key/value card -------
function StringFieldCard({
  icon, title, description, fields, values, onChange, onSave, saving, trailing,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  fields: { key: string; label: string; placeholder?: string; type?: string; multiline?: boolean }[];
  values: Record<string, string>;
  onChange: (key: string, v: string) => void;
  onSave: () => void;
  saving: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">{icon}</div>
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.key} className={`space-y-1 ${f.multiline ? 'sm:col-span-2' : ''}`}>
              <Label className="text-xs">{f.label}</Label>
              {f.multiline ? (
                <Textarea
                  value={values[f.key] ?? ""}
                  onChange={e => onChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={4}
                  className="font-mono text-xs"
                />
              ) : (
                <Input
                  type={f.type || "text"}
                  value={values[f.key] ?? ""}
                  onChange={e => onChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
          {trailing}
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateEditorCard({
  icon, title, description, baseKey, fields, values, onChange, onSave, saving, availableVars,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  baseKey: string;
  fields: { lang: "en" | "sq"; label: string; multiline?: boolean; suffix: string }[];
  values: Record<string, string>;
  onChange: (key: string, v: string) => void;
  onSave: () => void;
  saving: boolean;
  availableVars?: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">{icon}</div>
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {description}
              {availableVars && availableVars.length > 0 && (
                <> Available variables: {availableVars.map(v => <code key={v} className="bg-muted px-1 py-0.5 rounded text-[10px] ml-1">{`{{${v}}}`}</code>)}</>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs defaultValue="en">
          <TabsList>
            <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
            <TabsTrigger value="sq">🇦🇱 Albanian</TabsTrigger>
          </TabsList>
          {(["en", "sq"] as const).map(lang => (
            <TabsContent key={lang} value={lang} className="space-y-3 mt-3">
              {fields.filter(f => f.lang === lang).map(f => {
                const fullKey = `${baseKey}_${f.suffix}_${lang}`;
                return (
                  <div key={fullKey} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    {f.multiline ? (
                      <Textarea
                        value={values[fullKey] ?? ""}
                        onChange={e => onChange(fullKey, e.target.value)}
                        rows={6}
                        className="font-mono text-xs"
                      />
                    ) : (
                      <Input
                        value={values[fullKey] ?? ""}
                        onChange={e => onChange(fullKey, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const PUSH_TEMPLATES: { key: string; title: string; vars: string[]; defaults: { en: { heading: string; content: string }; sq: { heading: string; content: string } } }[] = [
  {
    key: "booking_created",
    title: "Booking Created (to driver)",
    vars: ["passenger", "origin", "destination"],
    defaults: {
      en: { heading: "New Seat Booked! 💺", content: "{{passenger}} booked a seat on your ride from {{origin}} to {{destination}}." },
      sq: { heading: "Vend i Ri i Rezervuar! 💺", content: "{{passenger}} rezervoi një vend në udhëtimin tuaj nga {{origin}} në {{destination}}." },
    },
  },
  {
    key: "booking_cancelled",
    title: "Booking Cancelled (to driver)",
    vars: ["passenger", "destination"],
    defaults: {
      en: { heading: "Seat Cancelled ⚠️", content: "{{passenger}} cancelled their seat on your ride to {{destination}}." },
      sq: { heading: "Vendi u Anulua ⚠️", content: "{{passenger}} anuloi vendin e tij në udhëtimin tuaj drejt {{destination}}." },
    },
  },
  {
    key: "chat_message",
    title: "Chat Message",
    vars: ["sender", "content"],
    defaults: {
      en: { heading: "New message from {{sender}}", content: "{{content}}" },
      sq: { heading: "Mesazh i ri nga {{sender}}", content: "{{content}}" },
    },
  },
  {
    key: "new_ride_alert",
    title: "New Ride Alert",
    vars: ["origin", "destination", "date"],
    defaults: {
      en: { heading: "🚗 New Ride Match!", content: "A new ride from {{origin}} to {{destination}} was just posted for {{date}}. Book it before seats run out!" },
      sq: { heading: "🚗 Udhëtim i Ri!", content: "Një udhëtim i ri nga {{origin}} në {{destination}} u postua për {{date}}. Rezervo para se të mbarojnë vendet!" },
    },
  },
  {
    key: "ride_cancelled",
    title: "Ride Cancelled (to passengers)",
    vars: ["destination", "reason"],
    defaults: {
      en: { heading: "Ride Cancelled ⚠️", content: "The ride to {{destination}} was cancelled. Reason: {{reason}}" },
      sq: { heading: "Udhëtimi u Anulua ⚠️", content: "Udhëtimi drejt {{destination}} u anulua. Arsyeja: {{reason}}" },
    },
  },
];

const EMAIL_TEMPLATES: { key: string; title: string; vars: string[]; defaults: { en: { subject: string; html: string }; sq: { subject: string; html: string } } }[] = [
  {
    key: "email_verification",
    title: "Email Verification",
    vars: ["code"],
    defaults: {
      en: {
        subject: "Your Verification Code 🔐",
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
  <h2 style="color: #3498db;">Welcome to Nisu! 🚗</h2>
  <p>Please use the code below to verify your account:</p>
  <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">{{code}}</h1>
  <p>If you didn't request this, please ignore this email.</p>
</div>`,
      },
      sq: {
        subject: "Kodi juaj i verifikimit 🔐",
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
  <h2 style="color: #3498db;">Mirë se erdhe në Nisu! 🚗</h2>
  <p>Përdor kodin më poshtë për të verifikuar llogarinë tënde:</p>
  <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">{{code}}</h1>
  <p>Nëse nuk e ke kërkuar këtë, injoroje këtë email.</p>
</div>`,
      },
    },
  },
];

type LegalSection = { heading: string; body: string };
type LegalDoc = { title: string; intro: string; sections: LegalSection[] };

const LEGAL_DOCS: { key: string; title: string; description: string }[] = [
  { key: "privacy_policy", title: "Privacy Policy", description: "Shown to users in the app under Profile → Privacy Policy." },
  { key: "terms_of_service", title: "Terms of Service", description: "Shown to users in the app under Profile → Terms of Service." },
];

function parseLegalDoc(value: any): LegalDoc {
  const empty: LegalDoc = { title: "", intro: "", sections: [] };
  if (!value) return empty;
  let parsed: any = value;
  if (typeof value === "string") {
    try { parsed = JSON.parse(value); } catch { return empty; }
  }
  if (!parsed || typeof parsed !== "object") return empty;
  return {
    title: String(parsed.title || ""),
    intro: String(parsed.intro || ""),
    sections: Array.isArray(parsed.sections)
      ? parsed.sections.map((s: any) => ({ heading: String(s?.heading || ""), body: String(s?.body || "") }))
      : [],
  };
}

function LegalDocEditor({
  baseKey, title, description, settings, onSaved,
}: {
  baseKey: string; title: string; description: string; settings: any[]; onSaved: () => void;
}) {
  const findSetting = (k: string) => settings.find((s: any) => s.key === k);
  const initialFor = (lang: "en" | "sq") => parseLegalDoc(findSetting(`${baseKey}_${lang}`)?.value);
  const [docs, setDocs] = useState<{ en: LegalDoc; sq: LegalDoc }>(() => ({ en: initialFor("en"), sq: initialFor("sq") }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDocs({ en: initialFor("en"), sq: initialFor("sq") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const updateDoc = (lang: "en" | "sq", patch: Partial<LegalDoc>) =>
    setDocs(prev => ({ ...prev, [lang]: { ...prev[lang], ...patch } }));

  const updateSection = (lang: "en" | "sq", idx: number, patch: Partial<LegalSection>) =>
    setDocs(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        sections: prev[lang].sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
      },
    }));

  const addSection = (lang: "en" | "sq") =>
    setDocs(prev => ({ ...prev, [lang]: { ...prev[lang], sections: [...prev[lang].sections, { heading: "", body: "" }] } }));

  const removeSection = (lang: "en" | "sq", idx: number) =>
    setDocs(prev => ({
      ...prev,
      [lang]: { ...prev[lang], sections: prev[lang].sections.filter((_, i) => i !== idx) },
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        (["en", "sq"] as const).map(lang =>
          api.updateSetting(`${baseKey}_${lang}`, { value: JSON.stringify(docs[lang]) }),
        ),
      );
      toast.success(`${title} saved`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || `Failed to save ${title}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10"><Scale className="h-4 w-4 text-primary" /></div>
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs defaultValue="en">
          <TabsList>
            <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
            <TabsTrigger value="sq">🇦🇱 Albanian</TabsTrigger>
          </TabsList>
          {(["en", "sq"] as const).map(lang => (
            <TabsContent key={lang} value={lang} className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={docs[lang].title}
                  onChange={e => updateDoc(lang, { title: e.target.value })}
                  placeholder={lang === "en" ? "Privacy Policy" : "Politika e Privatësisë"}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Intro</Label>
                <Textarea
                  value={docs[lang].intro}
                  onChange={e => updateDoc(lang, { intro: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Sections</Label>
                  <Button size="sm" variant="outline" onClick={() => addSection(lang)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Section
                  </Button>
                </div>
                {docs[lang].sections.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No sections yet — add one to start.</p>
                )}
                {docs[lang].sections.map((section, idx) => (
                  <div key={idx} className="border rounded-md p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] uppercase text-muted-foreground">Section {idx + 1}</Label>
                      <Button size="sm" variant="ghost" onClick={() => removeSection(lang, idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      value={section.heading}
                      onChange={e => updateSection(lang, idx, { heading: e.target.value })}
                      placeholder="Heading (e.g. 1. Information We Collect)"
                    />
                    <Textarea
                      value={section.body}
                      onChange={e => updateSection(lang, idx, { body: e.target.value })}
                      rows={4}
                      placeholder="Body text"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save {title}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Known keys handled by dedicated cards — hide them from the generic fallback.
const HANDLED_KEYS = new Set<string>([
  "active_ad",
  "onesignal_app_id", "onesignal_api_key",
  "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "mail_from", "mail_from_name", "support_email_to",
  ...PUSH_TEMPLATES.flatMap(t => ["en", "sq"].flatMap(l => [`push_${t.key}_heading_${l}`, `push_${t.key}_content_${l}`])),
  ...EMAIL_TEMPLATES.flatMap(t => ["en", "sq"].flatMap(l => [`${t.key}_subject_${l}`, `${t.key}_html_${l}`])),
  ...LEGAL_DOCS.flatMap(d => ["en", "sq"].map(l => `${d.key}_${l}`)),
]);

export default function SettingsPage() {
  const { data, isLoading, error } = useSettings();
  const qc = useQueryClient();
  const settings = useMemo(() => extractArray(data), [data]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    const initial: Record<string, string> = {};
    settings.forEach((s: any) => { initial[s.key] = s.value || ""; });

    // Prefill template defaults for any missing key so the editor isn't empty
    for (const t of PUSH_TEMPLATES) {
      (["en", "sq"] as const).forEach(lang => {
        const hK = `push_${t.key}_heading_${lang}`;
        const cK = `push_${t.key}_content_${lang}`;
        if (!initial[hK]) initial[hK] = t.defaults[lang].heading;
        if (!initial[cK]) initial[cK] = t.defaults[lang].content;
      });
    }
    for (const t of EMAIL_TEMPLATES) {
      (["en", "sq"] as const).forEach(lang => {
        const sK = `${t.key}_subject_${lang}`;
        const hK = `${t.key}_html_${lang}`;
        if (!initial[sK]) initial[sK] = t.defaults[lang].subject;
        if (!initial[hK]) initial[hK] = t.defaults[lang].html;
      });
    }
    setValues(initial);
  }, [settings]);

  const update = (key: string, v: string) => setValues(prev => ({ ...prev, [key]: v }));

  const saveKeys = async (keys: string[], groupName: string) => {
    setSavingKey(groupName);
    try {
      await Promise.all(keys.map(k => api.updateSetting(k, { value: values[k] ?? "" })));
      toast.success(`${groupName} saved`);
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (err: any) {
      toast.error(`Failed to save: ${err?.message || "Unknown error"}`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      const res = await api.sendTestEmail(testEmailTo || undefined);
      toast.success(`Test email sent to ${res?.to || testEmailTo || "you"}`);
    } catch (err: any) {
      toast.error(err?.message || "SMTP test failed");
    } finally {
      setSendingTest(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-destructive">Failed to load settings</p></div>;

  const bannerSetting = settings.find((s: any) => s.key === "active_ad") || { key: "active_ad", value: "{}" };
  const otherSettings = settings.filter((s: any) => !HANDLED_KEYS.has(s.key));

  return (
    <div>
      <PageHeader title="Settings" description="Platform configuration — changes take effect immediately (no restart required)." />
      <Tabs defaultValue="general" className="max-w-4xl">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="push">Push</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <BannerEditor setting={bannerSetting} onSaved={() => qc.invalidateQueries({ queryKey: ["settings"] })} />
          {otherSettings.map((setting: any) => (
            <Card key={setting.id || setting.key}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-mono">{setting.key}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={values[setting.key] ?? setting.value ?? ""}
                    onChange={e => update(setting.key, e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => saveKeys([setting.key], setting.key)} disabled={savingKey === setting.key}>
                    {savingKey === setting.key ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4 mt-4">
          <StringFieldCard
            icon={<Key className="h-4 w-4 text-primary" />}
            title="OneSignal (Push Notifications)"
            description="Used to send push notifications to users. Leave blank to fall back to backend env vars."
            fields={[
              { key: "onesignal_app_id", label: "App ID", placeholder: "OneSignal App ID (UUID)" },
              { key: "onesignal_api_key", label: "REST API Key", placeholder: "REST API key", type: "password" },
            ]}
            values={values}
            onChange={update}
            onSave={() => saveKeys(["onesignal_app_id", "onesignal_api_key"], "OneSignal")}
            saving={savingKey === "OneSignal"}
          />
        </TabsContent>

        <TabsContent value="smtp" className="space-y-4 mt-4">
          <StringFieldCard
            icon={<Server className="h-4 w-4 text-primary" />}
            title="SMTP Server"
            description="Outgoing email server. Leave blank to fall back to backend env vars."
            fields={[
              { key: "smtp_host", label: "Host", placeholder: "smtp.example.com" },
              { key: "smtp_port", label: "Port", placeholder: "587" },
              { key: "smtp_user", label: "Username", placeholder: "user@example.com" },
              { key: "smtp_pass", label: "Password", placeholder: "••••••", type: "password" },
              { key: "mail_from", label: "From Email", placeholder: "noreply@nisu.app" },
              { key: "mail_from_name", label: "From Name", placeholder: "Nisu App" },
              { key: "support_email_to", label: "Support Inbox (receives support emails)", placeholder: "support@nisu.app" },
            ]}
            values={values}
            onChange={update}
            onSave={() => saveKeys(
              ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "mail_from", "mail_from_name", "support_email_to"],
              "SMTP",
            )}
            saving={savingKey === "SMTP"}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10"><Send className="h-4 w-4 text-primary" /></div>
                <div>
                  <CardTitle className="text-sm font-semibold">Send Test Email</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Sends a ping through your current SMTP settings.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="recipient@example.com (defaults to your admin email)"
                  value={testEmailTo}
                  onChange={e => setTestEmailTo(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSendTest} disabled={sendingTest}>
                  {sendingTest ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Send Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="push" className="space-y-4 mt-4">
          {PUSH_TEMPLATES.map(t => (
            <TemplateEditorCard
              key={t.key}
              icon={<Bell className="h-4 w-4 text-primary" />}
              title={t.title}
              description="Edit the heading and body per language."
              baseKey={`push_${t.key}`}
              fields={[
                { lang: "en", label: "Heading (EN)", suffix: "heading" },
                { lang: "en", label: "Body (EN)", suffix: "content", multiline: true },
                { lang: "sq", label: "Heading (SQ)", suffix: "heading" },
                { lang: "sq", label: "Body (SQ)", suffix: "content", multiline: true },
              ]}
              values={values}
              onChange={update}
              onSave={() => saveKeys(
                ["en", "sq"].flatMap(l => [`push_${t.key}_heading_${l}`, `push_${t.key}_content_${l}`]),
                t.title,
              )}
              saving={savingKey === t.title}
              availableVars={t.vars}
            />
          ))}
        </TabsContent>

        <TabsContent value="legal" className="space-y-4 mt-4">
          {LEGAL_DOCS.map(doc => (
            <LegalDocEditor
              key={doc.key}
              baseKey={doc.key}
              title={doc.title}
              description={doc.description}
              settings={settings}
              onSaved={() => qc.invalidateQueries({ queryKey: ["settings"] })}
            />
          ))}
        </TabsContent>

        <TabsContent value="email" className="space-y-4 mt-4">
          {EMAIL_TEMPLATES.map(t => (
            <TemplateEditorCard
              key={t.key}
              icon={<Mail className="h-4 w-4 text-primary" />}
              title={t.title}
              description="Edit the subject and HTML body per language."
              baseKey={t.key}
              fields={[
                { lang: "en", label: "Subject (EN)", suffix: "subject" },
                { lang: "en", label: "HTML Body (EN)", suffix: "html", multiline: true },
                { lang: "sq", label: "Subject (SQ)", suffix: "subject" },
                { lang: "sq", label: "HTML Body (SQ)", suffix: "html", multiline: true },
              ]}
              values={values}
              onChange={update}
              onSave={() => saveKeys(
                ["en", "sq"].flatMap(l => [`${t.key}_subject_${l}`, `${t.key}_html_${l}`]),
                t.title,
              )}
              saving={savingKey === t.title}
              availableVars={t.vars}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
