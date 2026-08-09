import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useReports, useUsers, useUpdateReport, useDeleteReport } from "@/lib/hooks";
import { getUploadUrl } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Mail, Phone, ShieldCheck, Calendar, GraduationCap, Star, Loader2, MapPin, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";
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

function getRideRoute(report: any): string {
  const ride = report.ride;
  if (!ride) return "—";
  const origin = ride.origin_city?.name || "?";
  const dest = ride.destination_city?.name || "?";
  if (origin !== "?" || dest !== "?") return `${origin} → ${dest}`;
  // Fallback: show ride ID snippet
  return `Ride ${String(ride.id).slice(0, 8)}…`;
}

export default function ReportsPage() {
  const { data: reportsData, isLoading: rl } = useReports();
  const { data: usersData, isLoading: ul } = useUsers();
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<any | null>(null);

  const reports = extractArray(reportsData);
  const users = extractArray(usersData) as User[];

  const updateStatus = (id: string, status: string) => {
    updateReport.mutate(
      { id, data: { status } },
      { onSuccess: () => toast.success(`Report ${status}`) }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteReport.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Report deleted");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to delete report"),
    });
  };

  const openUser = (userId: string, reportUser?: any) => {
    if (reportUser) {
      setSelectedUser(reportUser as User);
      return;
    }
    const user = users.find(u => u.id === userId);
    if (user) setSelectedUser(user);
  };

  const getReporterName = (report: any) => {
    const rel = report.reporter;
    if (rel) return `${rel.first_name} ${rel.last_name}`;
    return report.reporter_name || "Unknown";
  };

  const getReportedName = (report: any) => {
    const rel = report.reported_user;
    if (rel) return `${rel.first_name} ${rel.last_name}`;
    return report.reported_user_name || "Unknown";
  };

  const filtered = useMemo(() => {
    return reports.filter((r: any) => {
      const statusMatch = statusFilter === "all" || r.status === statusFilter;
      if (!statusMatch) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (r.reason || "").toLowerCase().includes(q) ||
        getReporterName(r).toLowerCase().includes(q) ||
        getReportedName(r).toLowerCase().includes(q)
      );
    });
  }, [reports, search, statusFilter]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  const selection = useRowSelection<any>(filtered, r => r.id);
  const visibleAllSelected = paged.length > 0 && paged.every(r => selection.isSelected(r.id));
  const qc = useQueryClient();
  const [bulkAction, setBulkAction] = useState<null | "resolve" | "dismiss" | "delete">(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const runBulk = async () => {
    if (!bulkAction || selection.count === 0) return;
    const ids = selection.selectedIds;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: ids.length });
    const op = (id: string) => {
      switch (bulkAction) {
        case "resolve": return api.updateReport(id, { status: "resolved" });
        case "dismiss": return api.updateReport(id, { status: "dismissed" });
        case "delete": return api.deleteReport(id);
      }
    };
    const results = await Promise.allSettled(
      ids.map(id => Promise.resolve(op(id)).then(r => {
        setBulkProgress(p => ({ ...p, done: p.done + 1 }));
        return r;
      }))
    );
    const failed = results.filter(r => r.status === "rejected").length;
    qc.invalidateQueries({ queryKey: ["reports"] });
    setBulkRunning(false);
    setBulkAction(null);
    if (failed === 0) {
      toast.success(`${ids.length} report${ids.length > 1 ? "s" : ""} updated`);
      selection.clear();
    } else {
      toast.error(`${failed} of ${ids.length} failed`);
    }
  };

  const isLoading = rl || ul;
  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      <PageHeader title="Reports" description={`${reports.length} total reports`} />
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reports..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
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
          <Button size="sm" variant="outline" onClick={() => setBulkAction("resolve")}>
            <Check className="h-4 w-4 mr-1" /> Resolve
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkAction("dismiss")}>
            <X className="h-4 w-4 mr-1" /> Dismiss
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setBulkAction("delete")}>
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
              <TableHead>Reason</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Reported User</TableHead>
              <TableHead>Ride</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((r: any) => (
              <TableRow key={r.id} data-state={selection.isSelected(r.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selection.isSelected(r.id)}
                    onCheckedChange={() => selection.toggle(r.id)}
                    aria-label="Select report"
                  />
                </TableCell>
                <TableCell className="font-medium text-sm max-w-[200px] truncate">{r.reason}</TableCell>
                <TableCell>
                  <button onClick={() => openUser(r.reporter_id, r.reporter)} className="text-sm text-primary hover:underline underline-offset-2 cursor-pointer font-medium">
                    {getReporterName(r)}
                  </button>
                </TableCell>
                <TableCell>
                  <button onClick={() => openUser(r.reported_user_id, r.reported_user)} className="text-sm text-primary hover:underline underline-offset-2 cursor-pointer font-medium">
                    {getReportedName(r)}
                  </button>
                </TableCell>
                <TableCell>
                  {(r.ride?.id || r.ride_id) ? (
                    <button
                      onClick={() => { setSelectedRide(r.ride || null); setSelectedRideId(r.ride?.id || r.ride_id); }}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2 font-medium"
                      title="View ride details and chat"
                    >
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[150px]">{getRideRoute(r)}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[150px]">{getRideRoute(r)}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="font-mono-data text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {(r.status === 'pending' || r.status === 'investigating') && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateStatus(r.id, 'resolved')} title="Resolve"><Check className="h-4 w-4 text-success" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateStatus(r.id, 'dismissed')} title="Dismiss"><X className="h-4 w-4 text-warning" /></Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(r)} title="Delete report">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No reports</TableCell></TableRow>}
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

      {/* Bulk Action */}
      <Dialog open={!!bulkAction} onOpenChange={open => !open && !bulkRunning && setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "resolve" && `Resolve ${selection.count} report${selection.count > 1 ? "s" : ""}?`}
              {bulkAction === "dismiss" && `Dismiss ${selection.count} report${selection.count > 1 ? "s" : ""}?`}
              {bulkAction === "delete" && `Delete ${selection.count} report${selection.count > 1 ? "s" : ""}?`}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {bulkAction === "delete"
              ? "This action cannot be undone."
              : "Status will be updated for every selected report."}
          </p>
          {bulkRunning && (
            <p className="text-xs text-muted-foreground">Processing {bulkProgress.done} / {bulkProgress.total}...</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)} disabled={bulkRunning}>Cancel</Button>
            <Button variant={bulkAction === "delete" ? "destructive" : "default"} onClick={runBulk} disabled={bulkRunning}>
              {bulkRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Report</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete this report by <strong>{deleteTarget ? getReporterName(deleteTarget) : ""}</strong> against <strong>{deleteTarget ? getReportedName(deleteTarget) : ""}</strong>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteReport.isPending}>
              {deleteReport.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedUser} onOpenChange={open => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {getUploadUrl(selectedUser.profile_picture, "profiles") && <img src={getUploadUrl(selectedUser.profile_picture, "profiles")!} alt="" className="h-10 w-10 rounded-full object-cover" />}
                  {selectedUser.first_name} {selectedUser.last_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{selectedUser.role}</Badge>
                  {selectedUser.driver_verification_status === 'approved' && <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1"><ShieldCheck className="h-3 w-3" /> Driver</Badge>}
                  {selectedUser.student_verification_status === 'approved' && <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1"><GraduationCap className="h-3 w-3" /> Student</Badge>}
                  <Badge variant={selectedUser.is_banned ? "destructive" : "secondary"}>{selectedUser.is_banned ? "Banned" : "Active"}</Badge>
                </div>
                {selectedUser.average_rating && (
                  <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-warning fill-warning" /><span className="font-medium">{selectedUser.average_rating}</span><span className="text-sm text-muted-foreground">({selectedUser.rating_count} ratings)</span></div>
                )}
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{selectedUser.email}</p></div></div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{selectedUser.phone_number || "—"}</p></div></div>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Joined</p><p className="font-medium">{new Date(selectedUser.created_at).toLocaleString()}</p></div></div>
                </div>
                <div className="pt-2 border-t"><p className="text-xs text-muted-foreground font-mono break-all">ID: {selectedUser.id}</p></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
