import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { shiftReqApi } from "@/api/shiftReq.api";
import { shiftsApi } from "@/api/shifts.api";
import { departmentsApi } from "@/api/departments.api";
import { rolesApi } from "@/api/roles.api";
import type { ShiftRequirement, Shift, Department, Role } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  departmentId: z.string().min(1, "Required"),
  shiftId: z.string().min(1, "Required"),
  roleId: z.string().min(1, "Required"),
  requiredCount: z.coerce.number().min(1),
  effectiveFrom: z.string().min(1, "Required"),
  effectiveTo: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

export default function ShiftRequirementsPage() {
  const [reqs, setReqs] = useState<ShiftRequirement[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [deptFilter, setDeptFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShiftRequirement | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  const getName = <T extends { _id: string; name: string }>(val: unknown, list: T[]) => {
    if (typeof val === "object" && val !== null) return (val as T).name;
    return list.find((x) => x._id === val)?.name ?? "—";
  };

  const loadMeta = async () => {
    const [dRes, rRes] = await Promise.all([departmentsApi.list(), rolesApi.list()]);
    setDepts(dRes.data.data);
    setRoles(rRes.data.data.filter((r) => r.organizationId !== null));
  };

  const loadReqs = async () => {
    if (!deptFilter) { setReqs([]); return; }
    setLoading(true);
    try {
      const res = await shiftReqApi.listByDept(deptFilter);
      setReqs(res.data.data);
      const sRes = await shiftsApi.list(deptFilter);
      setShifts(sRes.data.data);
    } catch { toast.error("Failed to load requirements"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { loadReqs(); }, [deptFilter]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await shiftReqApi.create(data);
      toast.success("Requirement created");
      setDialogOpen(false);
      loadReqs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error creating requirement";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await shiftReqApi.delete(deleteTarget._id);
      toast.success("Deleted");
      setDeleteTarget(null);
      loadReqs();
    } catch { toast.error("Failed to delete"); }
  };

  const openCreate = () => {
    form.reset({ departmentId: deptFilter });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shift Requirements</h1>
          <p className="text-muted-foreground">Define staffing needs per shift and role</p>
        </div>
        <Button onClick={openCreate} disabled={!deptFilter}><Plus className="mr-2 h-4 w-4" /> New Requirement</Button>
      </div>

      <div className="max-w-xs">
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
          <SelectContent>
            {depts.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!deptFilter && (
        <p className="text-muted-foreground text-sm">Select a department to view requirements.</p>
      )}

      {deptFilter && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Required Count</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => (<TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>
                  ))
                : reqs.length === 0
                ? (<TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No requirements defined.</TableCell></TableRow>)
                : reqs.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>{getName(r.shiftId, shifts)}</TableCell>
                      <TableCell>{getName(r.roleId, roles)}</TableCell>
                      <TableCell>{r.requiredCount}</TableCell>
                      <TableCell>{format(new Date(r.effectiveFrom), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(new Date(r.effectiveTo), "MMM d, yyyy")}</TableCell>
                      <TableCell><Badge variant={r.isActive ? "success" : "destructive"}>{r.isActive ? "Yes" : "No"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Shift Requirement</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.watch("departmentId")} onValueChange={(v) => form.setValue("departmentId", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{depts.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shift</Label>
              <Select value={form.watch("shiftId")} onValueChange={(v) => form.setValue("shiftId", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{shifts.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.watch("roleId")} onValueChange={(v) => form.setValue("roleId", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Required Count</Label>
              <Input type="number" {...form.register("requiredCount")} placeholder="3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective From</Label>
                <Input type="date" {...form.register("effectiveFrom")} />
              </div>
              <div className="space-y-2">
                <Label>Effective To</Label>
                <Input type="date" {...form.register("effectiveTo")} />
              </div>
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
          <DialogHeader><DialogTitle>Delete Requirement</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete this shift requirement?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
