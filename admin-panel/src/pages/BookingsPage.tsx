import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useBookings, useRides, useCancelBooking } from "@/lib/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, XCircle, Trash2, Search, MapPin } from "lucide-react";
import { useMemo } from "react";
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

export default function BookingsPage() {
  const { data, isLoading, error } = useBookings();
  const { data: ridesData, isLoading: ridesLoading } = useRides();
  const cancelBooking = useCancelBooking();
  const bookings = extractArray(data);
  const rides = extractArray(ridesData);
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<any | null>(null);

  // Build a ride lookup for route info
  const rideLookup = useMemo(() => {
    const map: Record<string, any> = {};
    rides.forEach((r: any) => { map[r.id] = r; });
    return map;
  }, [rides]);

  const getRideForBooking = (booking: any) => {
    const id = booking.ride?.id || booking.ride_id;
    return rideLookup[id] || booking.ride || null;
  };

  const getRoute = (booking: any) => {
    const ride = getRideForBooking(booking);
    if (ride) {
      const origin = ride.origin_city?.name || "?";
      const dest = ride.destination_city?.name || "?";
      if (origin !== "?" || dest !== "?") return `${origin} → ${dest}`;
    }
    return "—";
  };

  const openRide = (booking: any) => {
    const ride = getRideForBooking(booking);
    const id = ride?.id || booking.ride_id;
    if (!id) return;
    setSelectedRide(ride || null);
    setSelectedRideId(id);
  };

  const getPassengerName = (b: any) =>
    b.passenger ? `${b.passenger.first_name} ${b.passenger.last_name}` : b.passenger_name || "—";

  const filtered = useMemo(() => {
    if (!search) return bookings;
    const q = search.toLowerCase();
    return bookings.filter((b: any) =>
      getPassengerName(b).toLowerCase().includes(q) ||
      getRoute(b).toLowerCase().includes(q) ||
      (b.status || "").toLowerCase().includes(q)
    );
  }, [bookings, search, rideLookup]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  const handleCancel = () => {
    if (!cancelTarget) return;
    cancelBooking.mutate(cancelTarget.id, {
      onSuccess: () => {
        toast.success(`Booking for ${getPassengerName(cancelTarget)} cancelled`);
        setCancelTarget(null);
      },
      onError: () => toast.error("Failed to cancel booking"),
    });
  };

  // Only allow selecting bookings that aren't already cancelled
  const selectableFiltered = useMemo(() => filtered.filter((b: any) => b.status !== "cancelled"), [filtered]);
  const selection = useRowSelection<any>(selectableFiltered, b => b.id);
  const visibleSelectable = paged.filter((b: any) => b.status !== "cancelled");
  const visibleAllSelected = visibleSelectable.length > 0 && visibleSelectable.every(b => selection.isSelected(b.id));
  const qc = useQueryClient();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const runBulkCancel = async () => {
    const ids = selection.selectedIds;
    if (ids.length === 0) return;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: ids.length });
    const results = await Promise.allSettled(
      ids.map(id => Promise.resolve(api.cancelBooking(id)).then(r => {
        setBulkProgress(p => ({ ...p, done: p.done + 1 }));
        return r;
      }))
    );
    const failed = results.filter(r => r.status === "rejected").length;
    qc.invalidateQueries({ queryKey: ["bookings"] });
    setBulkRunning(false);
    setBulkOpen(false);
    if (failed === 0) {
      toast.success(`${ids.length} booking${ids.length > 1 ? "s" : ""} cancelled`);
      selection.clear();
    } else {
      toast.error(`${failed} of ${ids.length} failed`);
    }
  };

  if (isLoading || ridesLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-destructive">Failed to load bookings</p></div>;

  return (
    <div>
      <PageHeader title="Bookings" description={`${bookings.length} total bookings`} />
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search bookings..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
        </div>
        <BulkActionBar
          count={selection.count}
          total={selectableFiltered.length}
          onClear={selection.clear}
          onSelectAllVisible={() => selection.toggleAll(selectableFiltered)}
          visibleCount={selectableFiltered.length}
        >
          <Button size="sm" variant="destructive" onClick={() => setBulkOpen(true)}>
            <XCircle className="h-4 w-4 mr-1" /> Cancel bookings
          </Button>
        </BulkActionBar>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={visibleAllSelected ? true : (selection.count > 0 ? "indeterminate" : false)}
                  onCheckedChange={() => selection.toggleAll(visibleSelectable)}
                  aria-label="Select all"
                  disabled={visibleSelectable.length === 0}
                />
              </TableHead>
              <TableHead>Passenger</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Booked At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((b: any) => (
              <TableRow key={b.id} data-state={selection.isSelected(b.id) ? "selected" : undefined}>
                <TableCell>
                  {b.status !== "cancelled" ? (
                    <Checkbox
                      checked={selection.isSelected(b.id)}
                      onCheckedChange={() => selection.toggle(b.id)}
                      aria-label="Select booking"
                    />
                  ) : null}
                </TableCell>
                <TableCell className="font-medium text-sm">{getPassengerName(b)}</TableCell>
                <TableCell className="text-sm">
                  {(b.ride?.id || b.ride_id) ? (
                    <button
                      onClick={() => openRide(b)}
                      className="inline-flex items-center gap-1 text-primary hover:underline underline-offset-2 font-medium"
                      title="View ride details and chat"
                    >
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{getRoute(b)}</span>
                    </button>
                  ) : (
                    getRoute(b)
                  )}
                </TableCell>
                <TableCell className="text-sm">{b.seats_booked}</TableCell>
                <TableCell className="font-mono-data text-sm">
                  {b.ride?.price_per_seat ? `€${b.ride.price_per_seat}` : "—"}
                </TableCell>
                <TableCell><StatusBadge status={b.status} /></TableCell>
                <TableCell className="font-mono-data text-xs">{new Date(b.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {b.status !== "cancelled" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setCancelTarget(b)}
                      title="Cancel booking"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No bookings found</TableCell></TableRow>
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

      <RideDetailDrawer
        rideId={selectedRideId}
        initialRide={selectedRide}
        open={!!selectedRideId}
        onOpenChange={(open) => { if (!open) { setSelectedRideId(null); setSelectedRide(null); } }}
      />

      {/* Bulk Cancel */}
      <Dialog open={bulkOpen} onOpenChange={open => !open && !bulkRunning && setBulkOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel {selection.count} booking{selection.count > 1 ? "s" : ""}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            All selected passengers will be notified.
          </p>
          {bulkRunning && (
            <p className="text-xs text-muted-foreground">Processing {bulkProgress.done} / {bulkProgress.total}...</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkRunning}>Keep bookings</Button>
            <Button variant="destructive" onClick={runBulkCancel} disabled={bulkRunning}>
              {bulkRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Cancel bookings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <Dialog open={!!cancelTarget} onOpenChange={open => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel Booking</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cancel the booking for <strong>{cancelTarget ? getPassengerName(cancelTarget) : ""}</strong> on route{" "}
            <strong>{cancelTarget ? getRoute(cancelTarget) : ""}</strong>?
            The passenger will be notified.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep Booking</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelBooking.isPending}>
              {cancelBooking.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
