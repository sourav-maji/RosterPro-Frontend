import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@/api/users.api";
import { rolesApi } from "@/api/roles.api";
import { departmentsApi } from "@/api/departments.api";
import { authApi } from "@/api/auth.api";
import type { User, Role, Department } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, ToggleLeft, FolderInput } from "lucide-react";

const userSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  roleId: z.string().min(1, "Role required"),
  // Only required when creating a new user (validated contextually in onSubmit)
  password: z.string().optional(),
});
type CreateForm = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [moveTarget, setMoveTarget] = useState<User | null>(null);
  const [moveDeptId, setMoveDeptId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<CreateForm>({ resolver: zodResolver(userSchema) });

  const getRoleName = (roleId: unknown) => {
    if (typeof roleId === "object" && roleId !== null) return (roleId as Role).name;
    const role = roles.find((r) => r._id === roleId);
    return role?.name ?? "—";
  };

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, dRes] = await Promise.all([
        usersApi.list(search || undefined),
        rolesApi.list(),
        departmentsApi.list(),
      ]);
      setUsers(uRes.data.data);
      setRoles(rRes.data.data.filter((r) => r.organizationId !== null));
      setDepts(dRes.data.data);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", email: "", roleId: "", password: "" });
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    form.reset({
      name: u.name,
      email: u.email,
      roleId: typeof u.roleId === "object" ? (u.roleId as Role)._id : (u.roleId ?? ""),
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: CreateForm) => {
    setSaving(true);
    try {
      if (editing) {
        await usersApi.update(editing._id, { name: data.name, email: data.email, roleId: data.roleId });
        toast.success("User updated");
      } else {
        if (!data.password || data.password.length < 6) {
          form.setError("password", { message: "Password must be at least 6 characters" });
          setSaving(false);
          return;
        }
        // 1. Create the user record
        const createRes = await usersApi.create({ name: data.name, email: data.email, roleId: data.roleId });
        const newUserId: string = createRes.data.data._id;
        // 2. Register login credentials (sets mustChangePassword=true on backend)
        await authApi.registerLocal({ userId: newUserId, email: data.email, password: data.password });
        toast.success("User created — they must change their password on first login");
      }
      setDialogOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error saving user";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleToggle = async (u: User) => {
    try {
      await usersApi.toggle(u._id);
      toast.success("User status updated");
      load();
    } catch { toast.error("Failed to toggle"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersApi.delete(deleteTarget._id);
      toast.success("User deleted");
      setDeleteTarget(null);
      load();
    } catch { toast.error("Failed to delete user"); }
  };

  const handleMove = async () => {
    if (!moveTarget || !moveDeptId) return;
    try {
      await usersApi.moveDepartment(moveTarget._id, moveDeptId);
      toast.success("Department updated");
      setMoveDialogOpen(false);
      load();
    } catch { toast.error("Failed to move user"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage staff in your organization</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New User</Button>
      </div>

      <Input
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

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
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 5 }).map((__, j) => (<TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>
                ))
              : users.length === 0
              ? (<TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No users found.</TableCell></TableRow>)
              : users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{getRoleName(u.roleId)}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "success" : "destructive"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Move department" onClick={() => { setMoveTarget(u); setMoveDeptId(""); setMoveDialogOpen(true); }}>
                        <FolderInput className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggle(u)}><ToggleLeft className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(u)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit User" : "New User"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Jane Doe" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...form.register("email")} placeholder="jane@clinic.com" />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.watch("roleId")} onValueChange={(v) => form.setValue("roleId", v)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.formState.errors.roleId && <p className="text-sm text-destructive">{form.formState.errors.roleId.message}</p>}
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  {...form.register("password")}
                />
                {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
                <p className="text-xs text-muted-foreground">User will be required to change this on first login.</p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move department dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move {moveTarget?.name} to Department</DialogTitle></DialogHeader>
          <Select value={moveDeptId} onValueChange={setMoveDeptId}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              {depts.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMove} disabled={!moveDeptId}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
