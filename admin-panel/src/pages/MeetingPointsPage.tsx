import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useMeetingPoints, useCreateMeetingPoint, useUpdateMeetingPoint, useDeleteMeetingPoint, useCities } from "@/lib/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Loader2, Trash2, Pencil, MapPin } from "lucide-react";
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

export default function MeetingPointsPage() {
  const { data, isLoading, error } = useMeetingPoints();
  const { data: citiesData } = useCities();
  const createMP = useCreateMeetingPoint();
  const updateMP = useUpdateMeetingPoint();
  const deleteMP = useDeleteMeetingPoint();

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", city_id: "", address: "" });

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const points = extractArray(data);
  const cities = extractArray(citiesData);

  const filtered = useMemo(() => {
    return points.filter((p: any) => {
      const matchSearch = !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.address?.toLowerCase().includes(search.toLowerCase());
      const matchCity = cityFilter === "all" || String(p.city?.id ?? p.city_id) === cityFilter;
      return matchSearch && matchCity;
    });
  }, [points, search, cityFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", city_id: cities[0] ? String(cities[0].id) : "", address: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      city_id: String(p.city?.id ?? p.city_id ?? ""),
      address: p.address || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.city_id) {
      toast.error("Name and city are required");
      return;
    }
    const payload = { name: form.name.trim(), city_id: form.city_id, address: form.address.trim() || null };
    if (editing) {
      updateMP.mutate({ id: editing.id, data: payload }, {
        onSuccess: () => { toast.success("Meeting point updated"); setDialogOpen(false); },
        onError: (e: any) => toast.error(e?.message || "Failed to update"),
      });
    } else {
      createMP.mutate(payload, {
        onSuccess: () => { toast.success("Meeting point created"); setDialogOpen(false); },
        onError: (e: any) => toast.error(e?.message || "Failed to create"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMP.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success(`"${deleteTarget.name}" deleted`); setDeleteTarget(null); },
      onError: (e: any) => toast.error(e?.message || "Failed to delete"),
    });
  };

  const cityNameOf = (p: any) => p.city?.name ?? cities.find((c: any) => String(c.id) === String(p.city_id))?.name ?? "—";

  const selection = useRowSelection<any>(filtered, p => String(p.id));
  const visibleAllSelected = paged.length > 0 && paged.every(p => selection.isSelected(String(p.id)));
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
      ids.map(id => Promise.resolve(api.deleteMeetingPoint(id)).then(r => {
        setBulkProgress(p => ({ ...p, done: p.done + 1 }));
        return r;
      }))
    );
    const failed = results.filter(r => r.status === "rejected").length;
    qc.invalidateQueries({ queryKey: ["meeting-points"] });
    setBulkRunning(false);
    setBulkOpen(false);
    if (failed === 0) {
      toast.success(`${ids.length} meeting point${ids.length > 1 ? "s" : ""} deleted`);
      selection.clear();
    } else {
      toast.error(`${failed} of ${ids.length} failed`);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-destructive">Failed to load meeting points</p></div>;

  return (
    <div>
      <PageHeader
        title="Meeting Points"
        description={`${points.length} meeting points configured`}
        actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Meeting Point</Button>}
      />

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search meeting points..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={cityFilter} onValueChange={(v) => { setCityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by city" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cities.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
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
              <TableHead>City</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((p: any) => (
              <TableRow key={p.id} data-state={selection.isSelected(String(p.id)) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selection.isSelected(String(p.id))}
                    onCheckedChange={() => selection.toggle(String(p.id))}
                    aria-label="Select meeting point"
                  />
                </TableCell>
                <TableCell className="font-medium text-sm">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" />{p.name}</div>
                </TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">{cityNameOf(p)}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.address || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No meeting points found</TableCell></TableRow>
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

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Meeting Point" : "Add Meeting Point"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="e.g. Main Square" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>City *</Label>
              <Select value={form.city_id} onValueChange={v => setForm(f => ({ ...f, city_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose city" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea placeholder="Street, landmark, etc." value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMP.isPending || updateMP.isPending}>
              {(createMP.isPending || updateMP.isPending) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              {editing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete */}
      <Dialog open={bulkOpen} onOpenChange={open => !open && !bulkRunning && setBulkOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {selection.count} meeting point{selection.count > 1 ? "s" : ""}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Rides referencing these meeting points will have them cleared.
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

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Meeting Point</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.name}</strong>? Rides referencing this meeting point will have it cleared.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMP.isPending}>
              {deleteMP.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
