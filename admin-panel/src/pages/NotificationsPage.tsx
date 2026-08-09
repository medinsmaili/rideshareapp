import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useUsers } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Users, User, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

interface SentNotification {
  id: string;
  title: string;
  body: string;
  audience: string;
  sent_at: string;
  recipients: number;
}

export default function NotificationsPage() {
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const users = extractArray(usersData);
  const verifiedDrivers = users.filter((u: any) => u.is_verified_driver);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceType, setAudienceType] = useState<"all" | "drivers" | "specific">("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [sending, setSending] = useState(false);

  const getRecipientCount = () => {
    if (audienceType === "all") return users.length;
    if (audienceType === "drivers") return verifiedDrivers.length;
    return selectedUserId ? 1 : 0;
  };

  const getAudienceLabel = () => {
    if (audienceType === "all") return "All Users";
    if (audienceType === "drivers") return "Verified Drivers";
    const u = users.find((u: any) => u.id === selectedUserId);
    return u ? `${(u as any).first_name} ${(u as any).last_name}` : "Specific User";
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    if (audienceType === "specific" && !selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setSending(true);
    try {
      const res = await api.broadcastNotification({
        title: title.trim(),
        message: body.trim(),
        audience: audienceType,
        user_id: audienceType === "specific" ? selectedUserId : undefined,
      }) as any;

      const recipientCount = res?.recipients ?? getRecipientCount();
      const audienceLabel = getAudienceLabel();

      setHistory(prev => [{
        id: `n${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        audience: audienceLabel,
        sent_at: new Date().toISOString(),
        recipients: recipientCount,
      }, ...prev]);

      setTitle("");
      setBody("");
      setAudienceType("all");
      setSelectedUserId("");
      toast.success(`Notification sent to ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Push Notifications" description="Send push notifications to app users" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Compose Notification
              </CardTitle>
              <CardDescription>Create and send a push notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input placeholder="Notification title" value={title} onChange={e => setTitle(e.target.value)} maxLength={65} />
                <p className="text-xs text-muted-foreground mt-1">{title.length}/65</p>
              </div>

              <div>
                <Label>Body</Label>
                <Textarea placeholder="Notification message…" value={body} onChange={e => setBody(e.target.value)} rows={4} maxLength={240} className="resize-none" />
                <p className="text-xs text-muted-foreground mt-1">{body.length}/240</p>
              </div>

              <div>
                <Label className="mb-2 block">Audience</Label>
                <RadioGroup value={audienceType} onValueChange={(v: any) => setAudienceType(v)} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="flex items-center gap-1.5 cursor-pointer font-normal">
                      <Users className="h-3.5 w-3.5" /> All Users
                      {!usersLoading && <Badge variant="secondary" className="text-xs ml-1">{users.length}</Badge>}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="drivers" id="drivers" />
                    <Label htmlFor="drivers" className="flex items-center gap-1.5 cursor-pointer font-normal">
                      <Users className="h-3.5 w-3.5" /> Verified Drivers
                      {!usersLoading && <Badge variant="secondary" className="text-xs ml-1">{verifiedDrivers.length}</Badge>}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="specific" id="specific" />
                    <Label htmlFor="specific" className="flex items-center gap-1.5 cursor-pointer font-normal">
                      <User className="h-3.5 w-3.5" /> Specific User
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {audienceType === "specific" && (
                <div>
                  <Label>Select User</Label>
                  {usersLoading ? (
                    <div className="flex items-center gap-2 py-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Loading users…</span></div>
                  ) : (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name} — {u.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <Button className="w-full" onClick={handleSend} disabled={sending || usersLoading}>
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {sending ? "Sending…" : "Send Notification"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Sent This Session
              </CardTitle>
              <CardDescription>{history.length} notification{history.length !== 1 ? "s" : ""} sent</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(n => (
                    <div key={n.id} className="rounded-lg border bg-muted/30 px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-xs">{n.audience}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">{n.recipients} recipients</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.sent_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
