import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { shiftsApi } from "@/api/shifts.api";
import { departmentsApi } from "@/api/departments.api";
import type { Shift, Department, ShiftType } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, ToggleLeft } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Required"),
  departmentId: z.string().min(1, "Required"),
  startTime: z.string().min(1, "Required"),
  endTime: z.string().min(1, "Required"),
  durationHours: z.coerce.number().min(1, "Must be ≥ 1"),
  type: z.enum(["NORMAL", "NIGHT", "OVERTIME"]).default("NORMAL"),
});
type FormData = z.infer<typeof schema>;

const typeVariant: Record<ShiftType, "default" | "secondary" | "destructive"> = {
  NORMAL: "secondary",
  NIGHT: "default",
  OVERTIME: "destructive",
};

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("__all__");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { type: "NORMAL" } });

  const getDeptName = (deptId: unknown) => {
    if (typeof deptId === "object" && deptId !== null) return (deptId as Department).name;
    return depts.find((d) => d._id === deptId)?.name ?? "—";
  };

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        shiftsApi.list(deptFilter === "__all__" ? undefined : deptFilter),
        departmentsApi.list(),
      ]);
      setShifts(sRes.data.data);
      setDepts(dRes.data.data);
    } catch { toast.error("Failed to load shifts"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [deptFilter]);

  const openCreate = () => { setEditing(null); form.reset({ type: "NORMAL" }); setDialogOpen(true); };
  const openEdit = (s: Shift) => {
    setEditing(s);
    form.reset({
      name: s.name,
      departmentId: typeof s.departmentId === "object" ? (s.departmentId as Department)._id : s.departmentId,
      startTime: s.startTime,
      endTime: s.endTime,
      durationHours: s.durationHours,
      type: s.type,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editing) {
        await shiftsApi.update(editing._id, data);
        toast.success("Shift updated");
      } else {
        await shiftsApi.create(data);
        toast.success("Shift created");
      }
      setDialogOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error saving shift";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleToggle = async (s: Shift) => {
    try { await shiftsApi.toggle(s._id); toast.success("Status updated"); load(); }
    catch { toast.error("Failed to toggle"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await shiftsApi.delete(deleteTarget._id); toast.success("Shift deleted"); setDeleteTarget(null); load(); }
    catch { toast.error("Failed to delete shift"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shifts</h1>
          <p className="text-muted-foreground">Manage shift templates</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New Shift</Button>
      </div>

      <div className="max-w-xs">
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger><SelectValue placeholder="All departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All departments</SelectItem>
            {depts.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => (<TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>
                ))
              : shifts.length === 0
              ? (<TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No shifts found.</TableCell></TableRow>)
              : shifts.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{getDeptName(s.departmentId)}</TableCell>
                    <TableCell>{s.startTime} – {s.endTime}</TableCell>
                    <TableCell>{s.durationHours}h</TableCell>
                    <TableCell><Badge variant={typeVariant[s.type]}>{s.type}</Badge></TableCell>
                    <TableCell><Badge variant={s.isActive ? "success" : "destructive"}>{s.isActive ? "Yes" : "No"}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggle(s)}><ToggleLeft className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Shift" : "New Shift"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Morning" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.watch("departmentId")} onValueChange={(v) => form.setValue("departmentId", v)}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{depts.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" {...form.register("startTime")} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" {...form.register("endTime")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duration (hours)</Label>
              <Input type="number" {...form.register("durationHours")} placeholder="8" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as ShiftType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="NIGHT">Night</SelectItem>
                  <SelectItem value="OVERTIME">Overtime</SelectItem>
                </SelectContent>
              </Select>
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
          <DialogHeader><DialogTitle>Delete Shift</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete <strong>{deleteTarget?.name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
