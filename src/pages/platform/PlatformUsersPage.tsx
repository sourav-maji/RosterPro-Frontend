import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { orgApi } from "@/api/org.api";
import { usersApi } from "@/api/users.api";
import { rolesApi } from "@/api/roles.api";
import { authApi } from "@/api/auth.api";
import type { Organization, User, Role } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Trash2, ToggleLeft } from "lucide-react";

const assignSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  roleId: z.string().min(1, "Select a role"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type AssignForm = z.infer<typeof assignSchema>;

export default function PlatformUsersPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<AssignForm>({ resolver: zodResolver(assignSchema) });

  // Load all orgs once
  useEffect(() => {
    orgApi.list().then((r) => setOrgs(r.data.data)).catch(() => {});
  }, []);

  // Load users + roles whenever selected org changes
  const loadOrgData = useCallback(async () => {
    if (!selectedOrgId) {
      setUsers([]);
      setRoles([]);
      return;
    }
    setLoadingUsers(true);
    try {
      const [uRes, rRes] = await Promise.all([
        usersApi.list(undefined, selectedOrgId),
        rolesApi.list(selectedOrgId),
      ]);
      setUsers(uRes.data.data);
      // Only show org roles (not system roles) for assignment
      setRoles(rRes.data.data.filter((r) => r.organizationId !== null));
    } catch {
      toast.error("Failed to load org data");
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedOrgId]);

  useEffect(() => { loadOrgData(); }, [loadOrgData]);

  const openAssign = () => {
    form.reset({ name: "", email: "", roleId: "", password: "" });
    setDialogOpen(true);
  };

  const onSubmit = async (data: AssignForm) => {
    setSaving(true);
    try {
      // Step 1: Create the user record in the selected org
      const createRes = await usersApi.create({
        name: data.name,
        email: data.email,
        roleId: data.roleId,
        organizationId: selectedOrgId,
      });
      const newUserId: string = createRes.data.data._id;

      // Step 2: Register local credentials with temp password (mustChangePassword=true)
      await authApi.registerLocal({ userId: newUserId, email: data.email, password: data.password });

      toast.success("User assigned — they must change their password on first login");
      setDialogOpen(false);
      loadOrgData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to assign user";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (u: User) => {
    try {
      await usersApi.toggle(u._id);
      toast.success("Status updated");
      loadOrgData();
    } catch {
      toast.error("Failed to toggle user");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersApi.delete(deleteTarget._id);
      toast.success("User removed");
      setDeleteTarget(null);
      loadOrgData();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const getRoleName = (roleId: unknown) => {
    if (typeof roleId === "object" && roleId !== null) return (roleId as Role).name;
    const role = roles.find((r) => r._id === roleId);
    return role?.name ?? "—";
  };

  const selectedOrg = orgs.find((o) => o._id === selectedOrgId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Org User Assignment</h1>
          <p className="text-muted-foreground">
            Assign users and roles to tenant organizations
          </p>
        </div>
      </div>

      {/* Org selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an organization…" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={o._id} value={o._id}>
                    {o.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({o.type})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User table */}
      {selectedOrgId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{selectedOrg?.name} — Users</h2>
              <p className="text-sm text-muted-foreground">
                {users.length} user{users.length !== 1 ? "s" : ""} in this organization
              </p>
            </div>
            <Button onClick={openAssign} disabled={roles.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Assign User
            </Button>
          </div>

          {roles.length === 0 && !loadingUsers && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              This organization has no roles yet. Ask the Tenant Admin to create roles first, or create them via the Roles &amp; Permissions page.
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : users.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No users in this organization yet.
                      </TableCell>
                    </TableRow>
                  )
                  : users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getRoleName(u.roleId)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "success" : "destructive"}>
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Toggle active"
                          onClick={() => handleToggle(u)}
                        >
                          <ToggleLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Assign user dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to {selectedOrg?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Jane Doe" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...form.register("email")} placeholder="jane@clinic.com" />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.watch("roleId")}
                onValueChange={(v) => form.setValue("roleId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.roleId && (
                <p className="text-sm text-destructive">{form.formState.errors.roleId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                User will be required to change this on first login.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Assigning…" : "Assign User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <strong>{deleteTarget?.name}</strong> from {selectedOrg?.name}? This cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
