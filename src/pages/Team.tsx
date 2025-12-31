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
import { tenantService } from "@/services/tenant.service";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, EyeOff, ChevronsUpDown, Check, Users, Calendar } from "lucide-react";
import Loader from "@/components/ui/loader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TIMEZONES, formatTimezoneLabel } from "@/constants/geo";
import { cn } from "@/lib/utils";

const Team = () => {
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [inviting, setInviting] = useState(false);

  // Tenant form state
  const [tenantName, setTenantName] = useState("");
  const [tenantDomain, setTenantDomain] = useState("");
  const [tenantTimezone, setTenantTimezone] = useState("Asia/Kolkata");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [timezoneOpen, setTimezoneOpen] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<{
    adminEmail?: boolean;
    tenantDomain?: boolean;
    adminName?: boolean;
  }>({});

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateDomain = (domain: string) => /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(domain);

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

  useEffect(() => {
    if (tenantOpen) {
      setTenantName("");
      setTenantDomain("");
      setTenantTimezone("Asia/Kolkata");
      setAdminEmail("");
      setAdminName("");
      setAdminPassword("");
      setShowPassword(false);
      setErrors({});
    }
  }, [tenantOpen]);

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
      invitationsQuery.refetch();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Unexpected error", variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const submitTenant = async () => {
    // Final check for missing info
    if (!tenantName || !tenantDomain || !adminEmail || !adminPassword || !adminName) {
      toast({ title: "Missing info", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    // Check for existing errors
    if (errors.adminEmail || errors.tenantDomain || errors.adminName) {
      toast({ title: "Validation Error", description: "Please fix the errors in the form.", variant: "destructive" });
      return;
    }

    try {
      setCreatingTenant(true);
      const payload = {
        name: tenantName,
        domain: tenantDomain,
        timezone: tenantTimezone,
        admin_email: adminEmail,
        admin_name: adminName,
        admin_password: adminPassword,
      };
      const res = await tenantService.createSubtenant(payload);
      if (!res.success) {
        toast({
          title: "Failed to create tenant",
          description: res.error || "Unexpected error",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Tenant created", description: `${tenantName} has been added successfully.` });
      setTenantOpen(false);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Unexpected error", variant: "destructive" });
    } finally {
      setCreatingTenant(false);
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
      invitationsQuery.refetch();
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Management</h1>
            <p className="text-muted-foreground mt-1">Manage your organization members and their roles.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95" onClick={() => setTenantOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
            <Button className="rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all active:scale-95 px-6" onClick={() => setInviteOpen(true)}>
              Invite Member
            </Button>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Members Table */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Organization Members</h2>
              <Badge variant="secondary" className="ml-auto rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/10">
                {users.length} Active
              </Badge>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm overflow-hidden">
              {usersQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader showText text="Loading team members..." size="lg" />
                </div>
              ) : usersQuery.isError ? (
                <div className="p-12 text-center text-sm text-destructive">Failed to load members.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-border/50 bg-muted/20">
                        <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Member</th>
                        <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Role</th>
                        <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Joined</th>
                        <th className="p-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-primary/[0.02] transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary border border-primary/10 uppercase">
                                {u.name?.charAt(0) || u.email.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground flex items-center gap-2">
                                  {u.name || u.email}
                                  {u.id === currentUser?.id && (
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center rounded-lg bg-blue-50/50 text-blue-700 border border-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                              {u.Role?.name || "Member"}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground font-medium">{formatDate(u.created_at)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-primary/10 hover:text-primary font-bold text-[11px] uppercase tracking-wider" onClick={() => openEditRole(u.id, u.role_id)}>Role</Button>
                              <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-primary/10 hover:text-primary font-bold text-[11px] uppercase tracking-wider" onClick={() => openPermissions(u.id)}>Perms</Button>
                              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 font-bold text-[11px] uppercase tracking-wider" onClick={() => removeUser(u.id)}>Remove</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Invitations Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Pending Invitations</h2>
              {invitations.length > 0 && (
                <Badge variant="secondary" className="ml-auto rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">
                  {invitations.length} Pending
                </Badge>
              )}
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm overflow-hidden">
              {invitationsQuery.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader showText text="Loading invitations..." size="lg" />
                  </div>
                ) : invitationsQuery.isError ? (
                <div className="p-12 text-center text-sm text-destructive">Failed to load invitations.</div>
              ) : invitations.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No pending invitations.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-border/50 bg-muted/20">
                        <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email</th>
                        <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Role</th>
                        <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                        <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Invited By</th>
                        <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Created</th>
                        <th className="p-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {invitations.map((inv) => (
                        <tr key={inv.id} className="hover:bg-primary/[0.02] transition-colors group">
                          <td className="p-4 font-semibold text-foreground">{inv.email}</td>
                          <td className="p-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              {inv.Role?.name || "Member"}
                            </span>
                          </td>
                          <td className="p-4">
                            {inv.status === "pending" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100 uppercase tracking-wider animate-pulse">Pending</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border uppercase tracking-wider">{inv.status}</span>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground font-medium">{inv.InvitedBy?.name || inv.InvitedBy?.email || "System"}</td>
                          <td className="p-4 text-muted-foreground font-medium">{formatDate(inv.created_at)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" className="h-8 rounded-lg border-primary/20 hover:bg-primary/5 font-bold text-[10px] uppercase tracking-wider" onClick={() => resendInvitation(inv.id)}>Resend</Button>
                              <Button variant="outline" size="sm" className="h-8 rounded-lg border-destructive/20 text-destructive hover:bg-destructive/5 font-bold text-[10px] uppercase tracking-wider" onClick={() => cancelInvitation(inv.id)}>Cancel</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
    </div>

    <Dialog open={tenantOpen} onOpenChange={setTenantOpen}>
        <DialogContent 
          className="sm:max-w-[500px]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Add Tenant</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tenant_name" className="text-right">Name</Label>
              <Input id="tenant_name" value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="col-span-3" placeholder="Tenant Name" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domain" className="text-right">Domain</Label>
              <Input 
                id="domain" 
                value={tenantDomain} 
                onChange={(e) => {
                  const val = e.target.value;
                  setTenantDomain(val);
                  setErrors(prev => ({ ...prev, tenantDomain: val ? !validateDomain(val) : false }));
                }} 
                className={cn("col-span-3", errors.tenantDomain && "border-destructive focus-visible:ring-destructive")} 
                placeholder="subsidiary.company.com" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timezone" className="text-right">Timezone</Label>
              <div className="col-span-3">
                <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={timezoneOpen}
                      className="w-full justify-between font-normal"
                    >
                      {tenantTimezone
                        ? formatTimezoneLabel(tenantTimezone)
                        : "Select timezone..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search timezone..." />
                      <CommandList>
                        <CommandEmpty>No timezone found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {TIMEZONES.map((tz) => (
                            <CommandItem
                              key={tz}
                              value={tz}
                              onSelect={(currentValue) => {
                                setTenantTimezone(currentValue);
                                setTimezoneOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center w-full">
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    tenantTimezone === tz ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="text-sm text-foreground">
                                  {formatTimezoneLabel(tz)}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin_email" className="text-right">Admin Email</Label>
              <Input 
                id="admin_email" 
                type="email" 
                value={adminEmail} 
                onChange={(e) => {
                  const val = e.target.value;
                  setAdminEmail(val);
                  setErrors(prev => ({ ...prev, adminEmail: val ? !validateEmail(val) : false }));
                }} 
                className={cn("col-span-3", errors.adminEmail && "border-destructive focus-visible:ring-destructive")} 
                placeholder="admin@example.com" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin_name" className="text-right">Admin Name</Label>
              <Input 
                id="admin_name" 
                value={adminName} 
                onChange={(e) => {
                  const val = e.target.value.replace(/[0-9]/g, "");
                  setAdminName(val);
                }} 
                className="col-span-3" 
                placeholder="Jane Smith" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin_pass" className="text-right">Admin Password</Label>
              <div className="col-span-3 relative">
                <Input 
                  id="admin_pass" 
                  type={showPassword ? "text" : "password"} 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)} 
                  className="pr-10" 
                  placeholder="SecurePassword123!"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTenantOpen(false)}>Cancel</Button>
            <Button 
              onClick={submitTenant} 
              disabled={creatingTenant || errors.adminEmail || errors.tenantDomain || !tenantName || !tenantDomain || !adminEmail || !adminName || !adminPassword}
            >
              {creatingTenant ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                {inviting ? <Loader size="sm" className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
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
  </DashboardLayout>
  );
};

export default Team;