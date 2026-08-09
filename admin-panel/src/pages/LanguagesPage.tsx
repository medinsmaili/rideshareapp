import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useLanguages } from "@/lib/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

export default function LanguagesPage() {
  const { data, isLoading, error } = useLanguages();
  const qc = useQueryClient();
  const languages = extractArray(data);
  const [addOpen, setAddOpen] = useState(false);
  const [newLang, setNewLang] = useState({ name: "", code: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleActive = async (id: number, currentValue: boolean) => {
    try {
      await api.updateLanguage(id, { is_active: !currentValue });
      qc.invalidateQueries({ queryKey: ["languages"] });
      toast.success("Language updated");
    } catch {
      toast.error("Failed to update language");
    }
  };

  const handleCreate = async () => {
    if (!newLang.name.trim() || !newLang.code.trim()) return;
    setSaving(true);
    try {
      await api.createLanguage({ name: newLang.name.trim(), code: newLang.code.trim().toLowerCase(), is_active: true });
      qc.invalidateQueries({ queryKey: ["languages"] });
      toast.success(`Language "${newLang.name}" added`);
      setNewLang({ name: "", code: "" });
      setAddOpen(false);
    } catch {
      toast.error("Failed to add language");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteLanguage(deleteTarget.id);
      qc.invalidateQueries({ queryKey: ["languages"] });
      toast.success(`Language "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete language — it may still have translations");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-destructive">Failed to load languages</p></div>;

  return (
    <div>
      <PageHeader
        title="Languages"
        description={`${languages.length} languages configured`}
        actions={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Language</Button>}
      />
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Language</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {languages.map((lang: any) => (
              <TableRow key={lang.id}>
                <TableCell className="font-medium text-sm">{lang.name}</TableCell>
                <TableCell><Badge variant="secondary" className="font-mono-data text-xs">{lang.code}</Badge></TableCell>
                <TableCell>
                  <Switch checked={lang.is_active} onCheckedChange={() => toggleActive(lang.id, lang.is_active)} />
                </TableCell>
                <TableCell className="font-mono-data text-xs">{new Date(lang.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(lang)}
                    title="Delete language"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {languages.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No languages configured</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Language */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Language</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Language Name *</Label>
              <Input value={newLang.name} onChange={e => setNewLang(l => ({ ...l, name: e.target.value }))} placeholder="e.g. Albanian" />
            </div>
            <div className="space-y-1.5">
              <Label>Language Code *</Label>
              <Input value={newLang.code} onChange={e => setNewLang(l => ({ ...l, code: e.target.value }))} placeholder="e.g. sq" maxLength={10} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newLang.name.trim() || !newLang.code.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add Language
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Language</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.name}</strong> (<code>{deleteTarget?.code}</code>)?
            All translations for this language will also be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
