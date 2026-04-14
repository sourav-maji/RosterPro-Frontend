import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { departmentsApi } from "@/api/departments.api";
import type { Department, User } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function DepartmentsPage() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [usersTarget, setUsersTarget] = useState<Department | null>(null);
  const [deptUsers, setDeptUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await departmentsApi.list();
      setDepts(res.data.data);
    } catch { toast.error("Failed to load departments"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset({ name: "", description: "" }); setDialogOpen(true); };
  const openEdit = (d: Department) => { setEditing(d); reset({ name: d.name, description: d.description ?? "" }); setDialogOpen(true); };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editing) {
        await departmentsApi.update(editing._id, data);
        toast.success("Department updated");
      } else {
        await departmentsApi.create(data);
        toast.success("Department created");
      }
      setDialogOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error saving department";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await departmentsApi.delete(deleteTarget._id);
      toast.success("Department deleted");
      setDeleteTarget(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Cannot delete — may have active users";
      toast.error(msg);
    }
  };

  const openUsers = async (dept: Department) => {
    setUsersTarget(dept);
    setLoadingUsers(true);
    try {
      const r = await departmentsApi.getUsers(dept._id);
      setDeptUsers(r.data.data);
    } catch { toast.error("Failed to load users"); }
    finally { setLoadingUsers(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage your organizational units</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New Department</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 3 }).map((__, j) => (<TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>
                ))
              : depts.length === 0
              ? (<TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No departments yet.</TableCell></TableRow>)
              : depts.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.description ?? "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openUsers(d)} title="View users"><Users className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(d)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Department" : "New Department"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} placeholder="Emergency Ward" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input {...register("description")} placeholder="24/7 emergency care unit" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Department</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone. Departments with active users cannot be deleted.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Users sheet */}
      <Dialog open={!!usersTarget} onOpenChange={(o) => !o && setUsersTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Users in {usersTarget?.name}</DialogTitle></DialogHeader>
          {loadingUsers
            ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            : deptUsers.length === 0
            ? <p className="text-sm text-muted-foreground py-4">No users in this department.</p>
            : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {deptUsers.map((u) => (
                    <div key={u._id} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <Badge variant={u.isActive ? "success" : "destructive"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                  ))}
                </div>
              )
          }
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsersTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
