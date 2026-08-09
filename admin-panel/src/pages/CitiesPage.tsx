import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useCities, useCreateCity, useUpdateCity, useDeleteCity } from "@/lib/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Loader2, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataPagination } from "@/components/DataPagination";
import { BulkActionBar } from "@/components/BulkActionBar";
import { useRowSelection } from "@/hooks/useRowSelection";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

export default function CitiesPage() {
  const { data, isLoading, error } = useCities();
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", country: "" });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const cities = extractArray(data);
  const filtered = cities.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.country || "").toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", country: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name || "", country: c.country || "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const payload = { name: form.name.trim(), country: form.country.trim() || undefined };
    if (editing) {
      updateCity.mutate({ id: String(editing.id), data: payload }, {
        onSuccess: () => { toast.success(`City "${payload.name}" updated`); setDialogOpen(false); },
        onError: (e: any) => toast.error(e?.message || "Failed to update city"),
      });
    } else {
      createCity.mutate(payload, {
        onSuccess: () => { toast.success(`City "${payload.name}" created`); setDialogOpen(false); },
        onError: (e: any) => toast.error(e?.message || "Failed to create city"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCity.mutate(String(deleteTarget.id), {
      onSuccess: () => {
        toast.success(`City "${deleteTarget.name}" deleted`);
        setDeleteTarget(null);
      },
      onError: (e: any) => toast.error(e?.message || "Failed to delete city — it may be in use by rides"),
    });
  };

  const selection = useRowSelection<any>(filtered, c => String(c.id));
  const visibleAllSelected = paged.length > 0 && paged.every(c => selection.isSelected(String(c.id)));
  const qc = useQueryClient();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const runBulkDelete = async () => {
    const ids = selection.selectedIds;
    if (ids.length === 0) return;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: ids.length });
    const results = await Promise.allSettled(
      ids.map(id => Promise.resolve(api.deleteCity(id)).then(r => {
        setBulkProgress(p => ({ ...p, done: p.done + 1 }));
        return r;
      }))
    );
    const failed = results.filter(r => r.status === "rejected").length;
    qc.invalidateQueries({ queryKey: ["cities"] });
    setBulkRunning(false);
    setBulkOpen(false);
    if (failed === 0) {
      toast.success(`${ids.length} cit${ids.length > 1 ? "ies" : "y"} deleted`);
      selection.clear();
    } else {
      toast.error(`${failed} of ${ids.length} failed (cities may be in use)`);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-destructive">Failed to load cities</p></div>;

  return (
    <div>
      <PageHeader
        title="Cities"
        description={`${cities.length} cities configured`}
        actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add City</Button>}
      />
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search cities..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
        </div>
        <BulkActionBar
          count={selection.count}
          total={filtered.length}
          onClear={selection.clear}
          onSelectAllVisible={() => selection.toggleAll(filtered)}
          visibleCount={filtered.length}
        >
          <Button size="sm" variant="destructive" onClick={() => setBulkOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </BulkActionBar>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={visibleAllSelected ? true : (selection.count > 0 ? "indeterminate" : false)}
                  onCheckedChange={() => selection.toggleAll(paged)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((city: any) => (
              <TableRow key={city.id} data-state={selection.isSelected(String(city.id)) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selection.isSelected(String(city.id))}
                    onCheckedChange={() => selection.toggle(String(city.id))}
                    aria-label="Select city"
                  />
                </TableCell>
                <TableCell className="font-medium text-sm">{city.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{city.country || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(city)} title="Edit city">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(city)}
                    title="Delete city"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No cities found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <DataPagination
          page={page}
          perPage={perPage}
          total={filtered.length}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>

      {/* Create/Edit City Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit City" : "Add City"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>City Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(c => ({ ...c, name: e.target.value }))}
                placeholder="e.g. Prishtina"
                onKeyDown={e => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={e => setForm(c => ({ ...c, country: e.target.value }))}
                placeholder="e.g. Kosovo"
                onKeyDown={e => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || createCity.isPending || updateCity.isPending}>
              {(createCity.isPending || updateCity.isPending) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              {editing ? "Save Changes" : "Add City"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete */}
      <Dialog open={bulkOpen} onOpenChange={open => !open && !bulkRunning && setBulkOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {selection.count} cit{selection.count > 1 ? "ies" : "y"}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cities referenced by active rides will be skipped.
          </p>
          {bulkRunning && (
            <p className="text-xs text-muted-foreground">Processing {bulkProgress.done} / {bulkProgress.total}...</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkRunning}>Cancel</Button>
            <Button variant="destructive" onClick={runBulkDelete} disabled={bulkRunning}>
              {bulkRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete City</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            Cities referenced by active rides cannot be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCity.isPending}>
              {deleteCity.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
