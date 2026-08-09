import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useVehicles, useDeleteVehicle } from "@/lib/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Trash2, Search } from "lucide-react";
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

export default function VehiclesPage() {
  const { data, isLoading, error } = useVehicles();
  const deleteVehicle = useDeleteVehicle();
  const vehicles = extractArray(data);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const filtered = useMemo(() => {
    if (!search) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter((v: any) =>
      (v.brand || "").toLowerCase().includes(q) ||
      (v.model || "").toLowerCase().includes(q) ||
      (v.color || "").toLowerCase().includes(q) ||
      (v.license_plate || "").toLowerCase().includes(q) ||
      (v.owner ? `${v.owner.first_name} ${v.owner.last_name}` : "").toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteVehicle.mutate(String(deleteTarget.id), {
      onSuccess: () => {
        toast.success(`${deleteTarget.brand} ${deleteTarget.model || ""} deleted`);
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to delete vehicle — it may be linked to active rides"),
    });
  };

  const selection = useRowSelection<any>(filtered, v => String(v.id));
  const visibleAllSelected = paged.length > 0 && paged.every(v => selection.isSelected(String(v.id)));
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
      ids.map(id => Promise.resolve(api.deleteVehicle(id)).then(r => {
        setBulkProgress(p => ({ ...p, done: p.done + 1 }));
        return r;
      }))
    );
    const failed = results.filter(r => r.status === "rejected").length;
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    setBulkRunning(false);
    setBulkOpen(false);
    if (failed === 0) {
      toast.success(`${ids.length} vehicle${ids.length > 1 ? "s" : ""} deleted`);
      selection.clear();
    } else {
      toast.error(`${failed} of ${ids.length} failed (likely linked to active rides)`);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-destructive">Failed to load vehicles</p></div>;

  return (
    <div>
      <PageHeader title="Vehicles" description={`${vehicles.length} registered vehicles`} />
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search vehicles..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
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
              <TableHead>Vehicle</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>License Plate</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((v: any) => (
              <TableRow key={v.id} data-state={selection.isSelected(String(v.id)) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selection.isSelected(String(v.id))}
                    onCheckedChange={() => selection.toggle(String(v.id))}
                    aria-label="Select vehicle"
                  />
                </TableCell>
                <TableCell className="font-medium text-sm">{v.brand} {v.model || ""}</TableCell>
                <TableCell className="text-sm">{v.color}</TableCell>
                <TableCell className="font-mono-data text-sm">{v.license_plate}</TableCell>
                <TableCell className="text-sm">
                  {v.owner ? `${v.owner.first_name} ${v.owner.last_name}` : v.owner_name || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(v)}
                    title="Delete vehicle"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No vehicles found</TableCell></TableRow>
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

      {/* Bulk Delete */}
      <Dialog open={bulkOpen} onOpenChange={open => !open && !bulkRunning && setBulkOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {selection.count} vehicle{selection.count > 1 ? "s" : ""}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Vehicles linked to active rides cannot be removed and will be skipped.
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
          <DialogHeader><DialogTitle>Delete Vehicle</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.brand} {deleteTarget?.model || ""}</strong>
            {deleteTarget?.license_plate && <> (<code>{deleteTarget.license_plate}</code>)</>}?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteVehicle.isPending}>
              {deleteVehicle.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
