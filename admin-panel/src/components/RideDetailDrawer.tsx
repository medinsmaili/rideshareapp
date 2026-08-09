import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageCircle } from "lucide-react";

function getRideName(ride: any, field: "origin" | "destination") {
  if (field === "origin") return ride?.origin_city?.name || ride?.originCity?.name || ride?.origin_city || "?";
  return ride?.destination_city?.name || ride?.destinationCity?.name || ride?.destination_city || "?";
}

function getDriverName(ride: any) {
  if (ride?.driver) return `${ride.driver.first_name} ${ride.driver.last_name}`;
  return ride?.driver_name || "—";
}

interface Props {
  rideId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRide?: any;
}

export function RideDetailDrawer({ rideId, open, onOpenChange, initialRide }: Props) {
  const [ride, setRide] = useState<any | null>(initialRide || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !rideId) return;
    if (initialRide && initialRide.id === rideId) {
      setRide(initialRide);
    } else {
      setLoading(true);
      setError(null);
      api.getRide(rideId)
        .then(r => setRide(r))
        .catch(err => setError(err?.message || "Failed to load ride"))
        .finally(() => setLoading(false));
    }
  }, [open, rideId, initialRide]);

  useEffect(() => {
    if (!open || !rideId) return;
    setChatLoading(true);
    setChatError(null);
    setChatMessages([]);
    api.getChatMessages(rideId)
      .then((data: any) => {
        const msgs = Array.isArray(data) ? data : data?.messages || data?.data || [];
        setChatMessages(msgs);
      })
      .catch((err: any) => setChatError(err?.message || "Failed to load chat"))
      .finally(() => setChatLoading(false));
  }, [open, rideId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-auto">
        <SheetHeader>
          <SheetTitle>Ride Details</SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="mt-6 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
        )}

        {ride && !loading && (
          <div className="mt-6 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-muted-foreground">Origin:</span><p className="mt-0.5 font-medium">{getRideName(ride, "origin")}</p></div>
              <div><span className="text-muted-foreground">Destination:</span><p className="mt-0.5 font-medium">{getRideName(ride, "destination")}</p></div>
              <div><span className="text-muted-foreground">Driver:</span><p className="mt-0.5">{getDriverName(ride)}</p></div>
              <div><span className="text-muted-foreground">Vehicle:</span><p className="mt-0.5">{ride.vehicle ? `${ride.vehicle.brand} ${ride.vehicle.model || ""} (${ride.vehicle.color})` : ride.vehicle_name || '—'}</p></div>
              <div><span className="text-muted-foreground">Price/Seat:</span><p className="mt-0.5 font-mono-data">€{ride.price_per_seat}</p></div>
              {ride.student_price && <div><span className="text-muted-foreground">Student Price:</span><p className="mt-0.5 font-mono-data">€{ride.student_price}</p></div>}
              <div><span className="text-muted-foreground">Seats:</span><p className="mt-0.5">{ride.seats_taken ?? 0}/{ride.total_seats ?? ride.seats_available ?? 0}</p></div>
              <div><span className="text-muted-foreground">Status:</span><div className="mt-0.5"><StatusBadge status={ride.status} /></div></div>
              <div><span className="text-muted-foreground">Departure:</span><p className="mt-0.5 font-mono-data text-xs">{ride.departure_time ? new Date(ride.departure_time).toLocaleString() : "—"}</p></div>
              {ride.is_female_only && <div><span className="text-muted-foreground">Female Only:</span><p className="mt-0.5">Yes</p></div>}
              {ride.description && <div className="col-span-2"><span className="text-muted-foreground">Description:</span><p className="mt-0.5">{ride.description}</p></div>}
              {ride.cancellation_reason && <div className="col-span-2"><span className="text-muted-foreground">Cancellation Reason:</span><p className="mt-0.5">{ride.cancellation_reason}</p></div>}
              <div className="col-span-2"><span className="text-muted-foreground">ID:</span><p className="mt-0.5 font-mono-data text-xs break-all">{ride.id}</p></div>
            </div>

            <Separator className="my-4" />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Chat Messages</span>
                {!chatLoading && <span className="text-xs text-muted-foreground">({chatMessages.length})</span>}
              </div>

              {chatLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {chatError && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{chatError}</p>
              )}

              {!chatLoading && !chatError && chatMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No messages in this ride</p>
              )}

              {!chatLoading && chatMessages.length > 0 && (
                <ScrollArea className="max-h-80">
                  <div className="space-y-2 pr-2">
                    {chatMessages.map((msg: any, i: number) => (
                      <div key={msg.id || i} className="rounded-md border bg-muted/50 px-3 py-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {msg.sender?.first_name || msg.user?.first_name || "User"}{" "}
                            {msg.sender?.last_name || msg.user?.last_name || ""}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono-data">
                            {msg.created_at ? new Date(msg.created_at).toLocaleString() : ""}
                          </span>
                        </div>
                        <p className="text-xs whitespace-pre-wrap break-words">{msg.content || msg.message || msg.text || ""}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
