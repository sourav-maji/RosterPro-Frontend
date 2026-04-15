import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { rolesApi } from "@/api/roles.api";
import { permissionsApi } from "@/api/permissions.api";
import { rolePermissionApi } from "@/api/rolePermission.api";
import type { Role, Permission, RolePermission } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, CheckSquare, Square } from "lucide-react";

const roleSchema = z.object({
  name: z.string().min(1, "Required"),
  code: z.string().min(1, "Required"),
});
type RoleForm = z.infer<typeof roleSchema>;

function groupByModule(perms: Permission[]) {
  return perms.reduce<Record<string, Permission[]>>((acc, p) => {
    const mod = p.module ?? "Other";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [assignedPermIds, setAssignedPermIds] = useState<Set<string>>(new Set());
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<RoleForm>({ resolver: zodResolver(roleSchema) });

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const [rRes, pRes] = await Promise.all([rolesApi.list(), permissionsApi.list()]);
      setRoles(rRes.data.data.filter((r) => r.organizationId !== null));
      setPerms(pRes.data.data);
    } catch { toast.error("Failed to load roles"); }
    finally { setLoadingRoles(false); }
  };

  const loadRolePerms = async (role: Role) => {
    setLoadingPerms(true);
    try {
      const res = await rolePermissionApi.listForRole(role._id);
      setAssignedPermIds(new Set(res.data.data.map((rp: RolePermission) => rp.permissionId._id)));
    } catch { toast.error("Failed to load permissions"); }
    finally { setLoadingPerms(false); }
  };

  useEffect(() => { loadRoles(); }, []);

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    loadRolePerms(role);
  };

  const togglePerm = (permId: string) => {
    setAssignedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await rolePermissionApi.bulkAssign(selectedRole._id, [...assignedPermIds]);
      toast.success("Permissions saved");
    } catch { toast.error("Failed to save permissions"); }
    finally { setSaving(false); }
  };

  const onSubmitRole = async (data: RoleForm) => {
    setSaving(true);
    try {
      await rolesApi.create({ name: data.name, code: data.code.toUpperCase() });
      toast.success("Role created");
      setDialogOpen(false);
      loadRoles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error creating role";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await rolesApi.delete(deleteTarget._id);
      toast.success("Role deleted");
      setDeleteTarget(null);
      if (selectedRole?._id === deleteTarget._id) { setSelectedRole(null); setAssignedPermIds(new Set()); }
      loadRoles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to delete role";
      toast.error(msg);
    }
  };

  const allPermIds = perms.map((p) => p._id);
  const allSelected = allPermIds.length > 0 && allPermIds.every((id) => assignedPermIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setAssignedPermIds(new Set());
    } else {
      setAssignedPermIds(new Set(allPermIds));
    }
  };

  const grouped = groupByModule(perms);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-muted-foreground">Manage roles and assign permissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Roles</h2>
            <Button size="sm" onClick={() => { form.reset(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New</Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRoles
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell><Skeleton className="h-5 w-full" /></TableCell><TableCell /></TableRow>
                    ))
                  : roles.length === 0
                  ? (<TableRow><TableCell colSpan={2} className="text-center py-6 text-muted-foreground text-sm">No custom roles yet.</TableCell></TableRow>)
                  : roles.map((r) => (
                      <TableRow
                        key={r._id}
                        className={`cursor-pointer ${selectedRole?._id === r._id ? "bg-accent" : ""}`}
                        onClick={() => selectRole(r)}
                      >
                        <TableCell>
                          <p className="font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.code}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          {!r.isSystem && (
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Permissions assignment */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedRole ? `Permissions for ${selectedRole.name}` : "Select a role to assign permissions"}
            </h2>
            {selectedRole && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={toggleSelectAll}>
                  {allSelected ? <Square className="h-4 w-4 mr-1" /> : <CheckSquare className="h-4 w-4 mr-1" />}
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
                <Button size="sm" onClick={savePermissions} disabled={saving}>{saving ? "Saving…" : "Save Permissions"}</Button>
              </div>
            )}
          </div>

          {!selectedRole && (
            <p className="text-sm text-muted-foreground">Click a role on the left to manage its permissions.</p>
          )}

          {selectedRole && (
            <div className="space-y-6">
              {loadingPerms
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
                : Object.entries(grouped).map(([module, moduleParms]) => (
                    <div key={module} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{module}</h3>
                        <Separator className="flex-1" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {moduleParms.map((p) => (
                          <label key={p._id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={assignedPermIds.has(p._id)}
                              onCheckedChange={() => togglePerm(p._id)}
                            />
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.code}</p>
                            </div>
                            {p.isSystem && <Badge variant="outline" className="ml-auto text-xs">System</Badge>}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>

      {/* Create role dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Role</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitRole)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Charge Nurse" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input {...form.register("code")} placeholder="CHARGE_NURSE" className="uppercase" />
              {form.formState.errors.code && <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Role</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete role <strong>{deleteTarget?.name}</strong>? Users with this role may lose access.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
