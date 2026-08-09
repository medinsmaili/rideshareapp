import { useState, useMemo, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useLanguages, useAppTranslations } from "@/lib/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Save, Edit2, Check, X, Loader2, Download, Upload, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DataPagination } from "@/components/DataPagination";

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

export default function TranslationsPage() {
  const { data: langData, isLoading: ll } = useLanguages();
  const { data: transData, isLoading: tl } = useAppTranslations();
  const qc = useQueryClient();

  const languages = extractArray(langData);
  const translations = extractArray(transData);

  const [selectedLang, setSelectedLang] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValues, setNewValues] = useState<Record<number, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return translations.filter((t: any) => {
      const langMatch = selectedLang === "all" || String(t.language_id) === selectedLang;
      const q = search.toLowerCase();
      const searchMatch = !q || (t.key || "").toLowerCase().includes(q) || (t.value || "").toLowerCase().includes(q);
      return langMatch && searchMatch;
    });
  }, [translations, selectedLang, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const uniqueKeys = useMemo(() => [...new Set(translations.map((t: any) => t.key))], [translations]);

  const getLangCode = (id: number | string) => languages.find((l: any) => String(l.id) === String(id))?.code ?? "??";

  const startEdit = (t: any) => { setEditingId(t.id); setEditValue(t.value || ""); };

  const saveEdit = async (t: any) => {
    try {
      await api.updateTranslation(t.id, { value: editValue });
      qc.invalidateQueries({ queryKey: ["app-translations"] });
      toast.success("Translation updated");
    } catch { toast.error("Failed to update"); }
    setEditingId(null);
  };

  const addTranslation = async () => {
    if (!newKey.trim()) { toast.error("Key is required"); return; }
    try {
      for (const lang of languages) {
        const val = newValues[lang.id];
        if (!val?.trim()) continue;
        await api.createTranslation({ language_id: lang.id, key: newKey.trim(), value: val });
      }
      qc.invalidateQueries({ queryKey: ["app-translations"] });
      toast.success("Translation key added");
      setNewKey("");
      setNewValues({});
      setAddOpen(false);
    } catch { toast.error("Failed to add translation"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteTranslation(deleteTarget.id);
      qc.invalidateQueries({ queryKey: ["app-translations"] });
      toast.success("Translation deleted");
      setDeleteTarget(null);
    } catch { toast.error("Failed to delete"); }
  };

  // --- CSV Export ---
  const exportCsv = () => {
    if (translations.length === 0) { toast.error("No translations to export"); return; }
    const headers = ["id", "language_id", "language_code", "key", "value"];
    const rows = translations.map((t: any) => [
      t.id,
      t.language_id,
      getLangCode(t.language_id),
      (t.key || "").replace(/"/g, '""'),
      (t.value || "").replace(/"/g, '""'),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map(r => r.map((c: any) => `"${c ?? ""}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translations.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${translations.length} translations`);
  };

  // --- CSV Import (tiny parser; accepts language_id or language_code) ---
  const parseCsv = (text: string): Record<string, string>[] => {
    // Strip BOM
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const lines: string[][] = [];
    let current: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { current.push(field); field = ""; }
        else if (c === "\n") { current.push(field); lines.push(current); current = []; field = ""; }
        else if (c === "\r") { /* skip */ }
        else field += c;
      }
    }
    if (field.length > 0 || current.length > 0) { current.push(field); lines.push(current); }
    if (lines.length < 2) return [];
    const headers = lines[0].map(h => h.trim().replace(/^\ufeff/, ""));
    return lines.slice(1).filter(r => r.some(cell => cell.length > 0)).map(r => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
      return obj;
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      let ok = 0, skip = 0, fail = 0;
      for (const row of rows) {
        let languageId: number | undefined;
        if (row.language_id) languageId = Number(row.language_id);
        else if (row.language_code) {
          const lang = languages.find((l: any) => l.code === row.language_code);
          languageId = lang?.id;
        }
        if (!languageId || !row.key || !row.value) { skip++; continue; }
        try {
          await api.createTranslation({ language_id: languageId, key: row.key, value: row.value });
          ok++;
        } catch { fail++; }
      }
      qc.invalidateQueries({ queryKey: ["app-translations"] });
      toast.success(`Imported ${ok}. ${skip ? `Skipped ${skip}.` : ""} ${fail ? `Failed ${fail}.` : ""}`);
    } catch (err: any) {
      toast.error(err?.message || "CSV import failed");
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isLoading = tl || ll;
  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      <PageHeader
        title="Translations"
        description={`${uniqueKeys.length} keys · ${translations.length} strings across ${languages.length} languages`}
        actions={
          <div className="flex items-center gap-2">
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFile} className="hidden" />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importLoading}>
              {importLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Import CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Key</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Translation Key</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Key</Label><Input placeholder="e.g. common.loading" value={newKey} onChange={e => setNewKey(e.target.value)} /></div>
                  {languages.map((lang: any) => (
                    <div key={lang.id}>
                      <Label>{lang.name} ({lang.code})</Label>
                      <Textarea placeholder={`Translation in ${lang.name}`} value={newValues[lang.id] || ""} onChange={e => setNewValues(prev => ({ ...prev, [lang.id]: e.target.value }))} rows={2} />
                    </div>
                  ))}
                  <Button onClick={addTranslation} className="w-full"><Save className="h-4 w-4 mr-1" /> Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search keys or values…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={selectedLang} onValueChange={(v) => { setSelectedLang(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All languages" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              {languages.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Language</TableHead>
              <TableHead className="w-[45%]">Value</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{t.key}</TableCell>
                <TableCell><Badge variant="secondary" className="font-mono text-xs">{getLangCode(t.language_id)}</Badge></TableCell>
                <TableCell>
                  {editingId === t.id ? (
                    <div className="flex items-center gap-2">
                      <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="h-8 text-sm" autoFocus />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(t)}><Check className="h-3.5 w-3.5 text-primary" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  ) : (
                    <span className="text-sm">{t.value || <span className="text-muted-foreground italic">empty</span>}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(t)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No translations found</TableCell></TableRow>}
          </TableBody>
        </Table>

        <DataPagination
          page={page}
          perPage={perPage}
          total={filtered.length}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
          perPageOptions={[25, 50, 100, 250]}
        />
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Translation</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.key}</strong> ({getLangCode(deleteTarget?.language_id)})?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
