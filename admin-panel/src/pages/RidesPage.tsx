import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useRides, useDeleteRide } from "@/lib/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Eye, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/DataPagination";
import { RideDetailDrawer } from "@/components/RideDetailDrawer";
import { BulkActionBar } from "@/components/BulkActionBar";
import { useRowSelection } from "@/hooks/useRowSelection";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

function getRideName(ride: any, field: "origin" | "destination") {
  if (field === "origin") return ride.origin_city?.name || ride.originCity?.name || ride.origin_city || "?";
  return ride.destination_city?.name || ride.destinationCity?.name || ride.destination_city || "?";
}

function getDriverName(ride: any) {
  if (ride.driver) return `${ride.driver.first_name} ${ride.driver.last_name}`;
  return ride.driver_name || "—";
}

export default function RidesPage() {
  const { data, isLoading, error } = useRides();
  const deleteRide = useDeleteRide();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const rides = extractArray(data);

  const filtered = rides.filter(r =>
    `${getRideName(r, "origin")} ${getRideName(r, "destination")} ${getDriverName(r)}`.toLowerCase().includes(search.toLowerCase())
  );

  const paged = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  const selection = useRowSelection<any>(filtered, r => r.id);
  const visibleAllSelected = paged.length > 0 && paged.every(r => selection.isSelected(r.id));
  const qc = useQueryClient();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const runBulkDelete = async () => {
    const ids = selection.selectedIds;
    if (ids.length === 0) return;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: ids.length });
    const results = await Promise.allSettled(
      ids.map(id => Promise.resolve(api.deleteRide(id)).then(r => {
        setBulkProgress(p => ({ ...p, done: p.done + 1 }));
        return r;
      }))
    );
    const failed = results.filter(r => r.status === "rejected").length;
    qc.invalidateQueries({ queryKey: ["rides"] });
    setBulkRunning(false);
    setBulkDeleteOpen(false);
    if (failed === 0) {
      toast.success(`${ids.length} ride${ids.length > 1 ? "s" : ""} deleted`);
      selection.clear();
    } else {
      toast.error(`${failed} of ${ids.length} failed`);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRide.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Ride deleted");
        setDeleteTarget(null);
        if (selected?.id === deleteTarget.id) setDrawerOpen(false);
      },
      onError: () => toast.error("Failed to delete ride"),
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-destructive">Failed to load rides</p></div>;

  return (
    <div>
      <PageHeader title="Rides" description={`${rides.length} total rides`} />
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search rides..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
        </div>

        <BulkActionBar
          count={selection.count}
          total={filtered.length}
          onClear={selection.clear}
          onSelectAllVisible={() => selection.toggleAll(filtered)}
          visibleCount={filtered.length}
        >
          <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
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
              <TableHead>Route</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map(ride => (
              <TableRow key={ride.id} data-state={selection.isSelected(ride.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selection.isSelected(ride.id)}
                    onCheckedChange={() => selection.toggle(ride.id)}
                    aria-label="Select ride"
                  />
                </TableCell>
                <TableCell className="font-medium text-sm">{getRideName(ride, "origin")} → {getRideName(ride, "destination")}</TableCell>
                <TableCell className="text-sm">{getDriverName(ride)}</TableCell>
                <TableCell className="font-mono-data text-xs">{new Date(ride.departure_time).toLocaleString()}</TableCell>
                <TableCell className="font-mono-data text-sm">€{ride.price_per_seat}</TableCell>
                <TableCell className="text-sm">{ride.seats_taken ?? 0}/{ride.total_seats ?? ride.seats_available ?? 0}</TableCell>
                <TableCell><StatusBadge status={ride.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(ride); setDrawerOpen(true); }} title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(ride)} title="Delete ride">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No rides found</TableCell></TableRow>}
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

      <RideDetailDrawer
        rideId={selected?.id || null}
        initialRide={selected}
        open={drawerOpen}
        onOpenChange={(open) => { setDrawerOpen(open); if (!open) setSelected(null); }}
      />

      {/* Bulk Delete */}
      <Dialog open={bulkDeleteOpen} onOpenChange={open => !open && !bulkRunning && setBulkDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {selection.count} ride{selection.count > 1 ? "s" : ""}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            All bookings and chat messages for the selected rides will be removed. This cannot be undone.
          </p>
          {bulkRunning && (
            <p className="text-xs text-muted-foreground">Processing {bulkProgress.done} / {bulkProgress.total}...</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkRunning}>Cancel</Button>
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
          <DialogHeader><DialogTitle>Delete Ride</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete the ride from{" "}
            <strong>{deleteTarget ? getRideName(deleteTarget, "origin") : ""}</strong>
            {" "}→{" "}
            <strong>{deleteTarget ? getRideName(deleteTarget, "destination") : ""}</strong>?
            All associated bookings and chat messages will also be removed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteRide.isPending}>
              {deleteRide.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete Ride
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
