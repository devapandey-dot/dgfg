import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import { useQuery } from "@tanstack/react-query";
import { userService, UsersListResponse } from "@/services/user.service";
import { roleService, RolesListResponse } from "@/services/role.service";
import { invitationService, InvitationsListResponse } from "@/services/invitation.service";
import { permissionService } from "@/services/permission.service";

const Team = () => {
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [inviting, setInviting] = useState(false);

  const usersQuery = useQuery({
    queryKey: ["tenant-users"],
    queryFn: async () => {
      const res = await userService.list();
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to load users");
      }
      return res.data as UsersListResponse;
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["tenant-roles"],
    queryFn: async () => {
      const res = await roleService.list();
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to load roles");
      }
      return res.data as RolesListResponse;
    },
  });

  const invitationsQuery = useQuery({
    queryKey: ["tenant-invitations"],
    queryFn: async () => {
      const res = await invitationService.list();
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to load invitations");
      }
      return res.data as InvitationsListResponse;
    },
  });

  useEffect(() => {
    if (inviteOpen) {
      setEmail("");
      setName("");
      setRoleId("");
    }
  }, [inviteOpen]);

  const submitInvite = async () => {
    if (!email.trim() || !roleId) {
      toast({ title: "Missing info", description: "Please enter email and role.", variant: "destructive" });
      return;
    }
    try {
      setInviting(true);
      const payload = { email: email.trim(), name: name.trim() || undefined, roleId: Number(roleId) };
      const res = await invitationService.send(payload);
      if (!res.success) {
        const details = (res as any);
        const baseMessage = res.message || res.error || "Unable to send invitation";
        const limitText =
          details && (details.limit !== undefined || details.used !== undefined || details.remaining !== undefined)
            ? `Limit: ${details.limit ?? '-'}, Used: ${details.used ?? '-'}, Remaining: ${details.remaining ?? '-'}`
            : "";
        toast({
          title: "Invite failed",
          description: limitText ? `${baseMessage} (${limitText})` : baseMessage,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Invitation sent", description: `Invite sent to ${email}` });
      setInviteOpen(false);
      usersQuery.refetch();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Unexpected error", variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const currentUser = authService.getUser();
  const users = usersQuery.data?.users || [];
  const roles = rolesQuery.data?.roles || [];
  const invitations = invitationsQuery.data?.invitations || [];

  const [editRoleUserId, setEditRoleUserId] = useState<number | null>(null);
  const [editRoleSelected, setEditRoleSelected] = useState<string>("");
  const [permissionsUserId, setPermissionsUserId] = useState<number | null>(null);
  const [permissionCode, setPermissionCode] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingPermission, setUpdatingPermission] = useState(false);

  const formatDate = (iso?: string) => {
    try {
      return iso ? new Date(iso).toLocaleString() : "-";
    } catch {
      return iso || "-";
    }
  };

  const resendInvitation = async (id: number) => {
    try {
      const res = await invitationService.resend(id);
      if (!res.success) {
        toast({ title: "Resend failed", description: res.error || "Unable to resend", variant: "destructive" });
        return;
      }
      toast({ title: "Invitation resent", description: `Invitation #${id} extended` });
      invitationsQuery.refetch();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" });
    }
  };

  const cancelInvitation = async (id: number) => {
    try {
      const res = await invitationService.cancel(id);
      if (!res.success) {
        toast({ title: "Cancel failed", description: res.error || "Unable to cancel", variant: "destructive" });
        return;
      }
      toast({ title: "Invitation cancelled", description: `Invitation #${id} removed` });
      invitationsQuery.refetch();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" });
    }
  };

  const openEditRole = (userId: number, currentRoleId?: number) => {
    setEditRoleUserId(userId);
    setEditRoleSelected(currentRoleId ? String(currentRoleId) : "");
  };

  const submitEditRole = async () => {
    if (!editRoleUserId || !editRoleSelected) return;
    try {
      setUpdatingRole(true);
      const res = await userService.updateRole(editRoleUserId, Number(editRoleSelected));
      if (!res.success) {
        toast({ title: "Update failed", description: res.error || "Unable to update role", variant: "destructive" });
        return;
      }
      toast({ title: "Role updated", description: "User role changed successfully" });
      setEditRoleUserId(null);
      setEditRoleSelected("");
      usersQuery.refetch();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" });
    } finally {
      setUpdatingRole(false);
    }
  };

  const removeUser = async (userId: number) => {
    try {
      const res = await userService.remove(userId);
      if (!res.success) {
        toast({ title: "Remove failed", description: res.error || "Unable to remove user", variant: "destructive" });
        return;
      }
      toast({ title: "User removed", description: "User has been deactivated" });
      usersQuery.refetch();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" });
    }
  };

  const openPermissions = (userId: number) => {
    setPermissionsUserId(userId);
    setPermissionCode("");
  };

  const addPermission = async () => {
    if (!permissionsUserId || !permissionCode.trim()) return;
    try {
      setUpdatingPermission(true);
      const res = await permissionService.add(permissionsUserId, permissionCode.trim());
      if (!res.success) {
        toast({ title: "Add failed", description: res.error || "Unable to add permission", variant: "destructive" });
        return;
      }
      toast({ title: "Permission added", description: permissionCode.trim() });
      setPermissionCode("");
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" });
    } finally {
      setUpdatingPermission(false);
    }
  };

  const removePermission = async () => {
    if (!permissionsUserId || !permissionCode.trim()) return;
    try {
      setUpdatingPermission(true);
      const res = await permissionService.remove(permissionsUserId, permissionCode.trim());
      if (!res.success) {
        toast({ title: "Remove failed", description: res.error || "Unable to remove permission", variant: "destructive" });
        return;
      }
      toast({ title: "Permission removed", description: permissionCode.trim() });
      setPermissionCode("");
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" });
    } finally {
      setUpdatingPermission(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team</h1>
            <p className="text-muted-foreground">Members in your tenant</p>
          </div>
          <Button onClick={() => setInviteOpen(true)}>Invite Member</Button>
        </div>

                <div className="bg-background rounded-xl border border-border shadow-card overflow-x-auto">
          {usersQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading members…</div>
          ) : usersQuery.isError ? (
            <div className="p-6 text-sm text-destructive">Failed to load members.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="font-medium">
                        {u.name || u.email}
                        {u.id === currentUser?.id ? " (You)" : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 font-medium">
                        {u.Role?.name || "Member"}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditRole(u.id, u.role_id)}>Role</Button>
                        <Button variant="outline" size="sm" onClick={() => openPermissions(u.id)}>Perms</Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeUser(u.id)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Invitations Table */}
        <div className="bg-background rounded-xl border border-border shadow-card overflow-x-auto">
          {invitationsQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading invitations…</div>
          ) : invitationsQuery.isError ? (
            <div className="p-6 text-sm text-destructive">Failed to load invitations.</div>
          ) : invitations.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No invitations yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Invited By</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="p-4">{inv.email}</td>
                    <td className="p-4">
                        {inv.Role?.name?.charAt(0).toUpperCase() + inv.Role?.name?.slice(1) || "Invited"}
                      </td>

                    <td className="p-4">
                      {inv.status === "pending" ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">Pending</span>
                      ) : inv.status === "expired" ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">Expired</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">{inv.status}</span>
                      )}
                    </td>
                    <td className="p-4">{inv.inviter?.name || inv.inviter?.email || "-"}</td>
                    <td className="p-4 text-muted-foreground">{formatDate(inv.created_at)}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {inv.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => resendInvitation(inv.id)}>Resend</Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => cancelInvitation(inv.id)}>Cancel</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={roleId} onValueChange={(v) => setRoleId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={rolesQuery.isLoading ? "Loading roles…" : "Select a role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button onClick={submitInvite} disabled={inviting || !email.trim() || !roleId}>
                {inviting ? "Sending…" : "Send Invite"}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editRoleUserId} onOpenChange={(open) => { if (!open) { setEditRoleUserId(null); setEditRoleSelected(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={editRoleSelected} onValueChange={(v) => setEditRoleSelected(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={rolesQuery.isLoading ? "Loading roles…" : "Select a role"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditRoleUserId(null); setEditRoleSelected(""); }}>Cancel</Button>
            <Button onClick={submitEditRole} disabled={updatingRole || !editRoleSelected}>
              {updatingRole ? "Updating…" : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={!!permissionsUserId} onOpenChange={(open) => { if (!open) { setPermissionsUserId(null); setPermissionCode(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Direct Permissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="perm">Permission code</Label>
              <Input id="perm" value={permissionCode} onChange={(e) => setPermissionCode(e.target.value)} placeholder="e.g. users.update" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addPermission} disabled={updatingPermission || !permissionCode.trim()}>Add</Button>
              <Button variant="outline" onClick={removePermission} disabled={updatingPermission || !permissionCode.trim()}>Remove</Button>
            </div>
            <p className="text-xs text-muted-foreground">Direct permissions apply to this user, regardless of role.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPermissionsUserId(null); setPermissionCode(""); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </DashboardLayout>
  );
};

export default Team;