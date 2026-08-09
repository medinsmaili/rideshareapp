import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useUsers, useUpdateUser, useCreateUser, useDeleteUser } from "@/lib/hooks";
import { getUploadUrl } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Eye, Ban, ShieldCheck, GraduationCap, Star, Loader2, Save, Mail, MailCheck, Plus, Trash2, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";
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

export default function UsersPage() {
  const { data, isLoading, error } = useUsers();
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const [search, setSearch] = useState("");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: "", last_name: "", email: "", phone_number: "", password: "", role: "user",
  });

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Bulk action state
  const qc = useQueryClient();
  const [bulkAction, setBulkAction] = useState<null | "delete" | "ban" | "unban" | "verify-email">(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const users = extractArray(data) as User[];

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q);
      const matchDriver = driverFilter === "all" || u.driver_verification_status === driverFilter;
      const matchStudent = studentFilter === "all" || u.student_verification_status === studentFilter;
      return matchSearch && matchDriver && matchStudent;
    });
  }, [users, search, driverFilter, studentFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const selection = useRowSelection<User>(filtered, u => u.id);
  const visibleAllSelected = paged.length > 0 && paged.every(u => selection.isSelected(u.id));

  const openDetail = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      gender: user.gender || "",
      role: user.role || "user",
      is_banned: user.is_banned || false,
      ban_reason: user.ban_reason || "",
      is_email_verified: user.is_email_verified || false,
      driver_verification_status: user.driver_verification_status || "none",
      is_verified_driver: user.is_verified_driver || false,
      student_verification_status: user.student_verification_status || "none",
      is_student_verified: user.is_student_verified || false,
    });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!selectedUser) return;
    const payload = {
      ...editForm,
      is_verified_driver: editForm.driver_verification_status === "approved",
      is_student_verified: editForm.student_verification_status === "approved",
    };
    updateUser.mutate(
      { id: selectedUser.id, data: payload },
      {
        onSuccess: () => {
          toast.success(`${editForm.first_name} ${editForm.last_name} updated`);
          setDrawerOpen(false);
        },
        onError: () => toast.error("Failed to update user"),
      }
    );
  };

  const handleCreate = () => {
    if (!createForm.first_name.trim() || !createForm.last_name.trim() || !createForm.email.trim() || !createForm.password) {
      toast.error("First name, last name, email, and password are required");
      return;
    }
    createUser.mutate(createForm, {
      onSuccess: () => {
        toast.success(`${createForm.first_name} created`);
        setCreateOpen(false);
        setCreateForm({ first_name: "", last_name: "", email: "", phone_number: "", password: "", role: "user" });
      },
      onError: (e: any) => toast.error(e?.message || "Failed to create user"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.first_name} deleted`);
        setDeleteTarget(null);
      },
      onError: (e: any) => toast.error(e?.message || "Failed to delete user"),
    });
  };

  const quickToggleBan = (user: User) => {
    updateUser.mutate(
      { id: user.id, data: { is_banned: !user.is_banned } },
      {
        onSuccess: () => toast.success(`${user.first_name} ${user.is_banned ? "unbanned" : "banned"}`),
        onError: () => toast.error("Failed to update"),
      }
    );
  };

  const runBulk = async () => {
    if (!bulkAction || selection.count === 0) return;
    const ids = selection.selectedIds;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: ids.length });

    const op = (id: string) => {
      switch (bulkAction) {
        case "delete":
          return api.deleteUser(id);
        case "ban":
          return api.updateUser(id, { is_banned: true });
        case "unban":
          return api.updateUser(id, { is_banned: false });
        case "verify-email":
          return api.updateUser(id, { is_email_verified: true });
      }
    };

    const results = await Promise.allSettled(
      ids.map(id =>
        Promise.resolve(op(id)).then(r => {
          setBulkProgress(p => ({ ...p, done: p.done + 1 }));
          return r;
        })
      )
    );
    const failed = results.filter(r => r.status === "rejected").length;
    qc.invalidateQueries({ queryKey: ["users"] });
    setBulkRunning(false);
    setBulkAction(null);

    if (failed === 0) {
      toast.success(`${ids.length} user${ids.length > 1 ? "s" : ""} updated`);
      selection.clear();
    } else {
      toast.error(`${failed} of ${ids.length} failed`);
    }
  };

  const quickToggleEmailVerify = (user: User) => {
    updateUser.mutate(
      { id: user.id, data: { is_email_verified: !user.is_email_verified } },
      {
        onSuccess: () => toast.success(`Email ${user.is_email_verified ? "unverified" : "verified"} for ${user.first_name}`),
        onError: () => toast.error("Failed to update"),
      }
    );
  };

  const profilePicUrl = (user: User) => getUploadUrl(user.profile_picture, "profiles");

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-destructive">Failed to load users</p><p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p></div>;

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${users.length} registered users`}
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add User</Button>}
      />

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={driverFilter} onValueChange={(v) => { setDriverFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Driver status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All drivers</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="refused">Refused</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
          <Select value={studentFilter} onValueChange={(v) => { setStudentFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Student status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All students</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="refused">Refused</SelectItem>
              <SelectItem value="none">None</SelectItem>
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
          <Button size="sm" variant="outline" onClick={() => setBulkAction("verify-email")}>
            <MailCheck className="h-4 w-4 mr-1" /> Verify email
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkAction("ban")}>
            <Ban className="h-4 w-4 mr-1" /> Ban
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkAction("unban")}>
            <ShieldOff className="h-4 w-4 mr-1" /> Unban
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map(user => (
              <TableRow key={user.id} data-state={selection.isSelected(user.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selection.isSelected(user.id)}
                    onCheckedChange={() => selection.toggle(user.id)}
                    aria-label={`Select ${user.first_name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {profilePicUrl(user) ? (
                      <img src={profilePicUrl(user)!} alt="" className="h-7 w-7 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-semibold">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                    )}
                    {user.first_name} {user.last_name}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-mono-data">{user.email}</TableCell>
                <TableCell className="text-sm font-mono-data">{user.phone_number || '—'}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs capitalize">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  {user.is_email_verified ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs gap-1"><MailCheck className="h-3 w-3" /> Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs gap-1"><Mail className="h-3 w-3" /> No</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.driver_verification_status === 'approved' ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
                  ) : user.driver_verification_status === 'pending' ? (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Pending</Badge>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {user.student_verification_status === 'approved' ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs gap-1"><GraduationCap className="h-3 w-3" /> Verified</Badge>
                  ) : user.student_verification_status === 'pending' ? (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Pending</Badge>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {user.is_banned ? (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Banned</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(user)} title="View / Edit"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => quickToggleEmailVerify(user)} title={user.is_email_verified ? 'Unverify email' : 'Verify email'}>
                      {user.is_email_verified ? <MailCheck className="h-4 w-4 text-success" /> : <Mail className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => quickToggleBan(user)} title={user.is_banned ? 'Unban' : 'Ban'}>
                      <Ban className={`h-4 w-4 ${user.is_banned ? 'text-destructive' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(user)} title="Delete user">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
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

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>First Name *</Label><Input value={createForm.first_name} onChange={e => setCreateForm(f => ({ ...f, first_name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Last Name *</Label><Input value={createForm.last_name} onChange={e => setCreateForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Password *</Label><Input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={createForm.phone_number} onChange={e => setCreateForm(f => ({ ...f, phone_number: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={createForm.role} onValueChange={v => setCreateForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createUser.isPending}>
              {createUser.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Confirmation */}
      <Dialog open={!!bulkAction} onOpenChange={(open) => !open && !bulkRunning && setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "delete" && `Delete ${selection.count} user${selection.count > 1 ? "s" : ""}?`}
              {bulkAction === "ban" && `Ban ${selection.count} user${selection.count > 1 ? "s" : ""}?`}
              {bulkAction === "unban" && `Unban ${selection.count} user${selection.count > 1 ? "s" : ""}?`}
              {bulkAction === "verify-email" && `Mark ${selection.count} email${selection.count > 1 ? "s" : ""} as verified?`}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {bulkAction === "delete"
              ? "This will cascade-remove rides, bookings, messages, reports, and vehicles for each selected user. This cannot be undone."
              : "This action will be applied to every selected user."}
          </p>
          {bulkRunning && (
            <p className="text-xs text-muted-foreground">
              Processing {bulkProgress.done} / {bulkProgress.total}...
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)} disabled={bulkRunning}>Cancel</Button>
            <Button
              variant={bulkAction === "delete" ? "destructive" : "default"}
              onClick={runBulk}
              disabled={bulkRunning}
            >
              {bulkRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.first_name} {deleteTarget?.last_name}</strong>? This will cascade-remove their rides, bookings, messages, reports, and vehicles.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-lg overflow-auto">
          <SheetHeader><SheetTitle>Edit User</SheetTitle></SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-4">
                {profilePicUrl(selectedUser) ? (
                  <img src={profilePicUrl(selectedUser)!} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{selectedUser.first_name} {selectedUser.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  {selectedUser.average_rating && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                      <span className="text-sm font-medium">{selectedUser.average_rating}</span>
                      <span className="text-xs text-muted-foreground">({selectedUser.rating_count} ratings)</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">First Name</Label><Input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Last Name</Label><Input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={editForm.phone_number} onChange={e => setEditForm(f => ({ ...f, phone_number: e.target.value }))} /></div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Gender</Label>
                  <Select value={editForm.gender || "unset"} onValueChange={v => setEditForm(f => ({ ...f, gender: v === "unset" ? null : v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">Not set</SelectItem>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Email Verified</Label>
                    <p className="text-xs text-muted-foreground">Manually verify the user's email</p>
                  </div>
                  <Switch checked={editForm.is_email_verified} onCheckedChange={v => setEditForm(f => ({ ...f, is_email_verified: v }))} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Banned</Label>
                    <p className="text-xs text-muted-foreground">Block user from using the platform</p>
                  </div>
                  <Switch checked={editForm.is_banned} onCheckedChange={v => setEditForm(f => ({ ...f, is_banned: v }))} />
                </div>

                {editForm.is_banned && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ban Reason</Label>
                    <Input value={editForm.ban_reason} onChange={e => setEditForm(f => ({ ...f, ban_reason: e.target.value }))} placeholder="Reason for ban..." />
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Driver Verification</Label>
                  <Select value={editForm.driver_verification_status} onValueChange={v => setEditForm(f => ({ ...f, driver_verification_status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="refused">Refused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Student Verification</Label>
                  <Select value={editForm.student_verification_status} onValueChange={v => setEditForm(f => ({ ...f, student_verification_status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="refused">Refused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(selectedUser.verification_docs_url || selectedUser.student_id_url) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Uploaded Documents</p>
                    {selectedUser.verification_docs_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Driver License</p>
                        <img src={getUploadUrl(selectedUser.verification_docs_url, "driver_licenses")!} alt="Driver License" className="w-full max-h-48 object-contain rounded-lg border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                    {selectedUser.student_id_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Student ID</p>
                        <img src={getUploadUrl(selectedUser.student_id_url, "student_ids")!} alt="Student ID" className="w-full max-h-48 object-contain rounded-lg border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div><span>Created:</span><p className="font-mono-data mt-0.5">{new Date(selectedUser.created_at).toLocaleString()}</p></div>
                <div><span>ID:</span><p className="font-mono-data mt-0.5 break-all">{selectedUser.id}</p></div>
              </div>

              <Button onClick={handleSave} className="w-full" disabled={updateUser.isPending}>
                {updateUser.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save Changes
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
