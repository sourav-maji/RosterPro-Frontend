import { useEffect, useState } from "react";
import { toast } from "sonner";
import { schedulerApi } from "@/api/scheduler.api";
import { departmentsApi } from "@/api/departments.api";
import type { ScheduleRun, Department } from "@/types/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { ScheduleDay } from "@/types/models";

function RunStatusBadge({ status }: { status: string }) {
  if (status === "SUCCESS") return <Badge variant="success">Success</Badge>;
  if (status === "PARTIAL") return <Badge variant="warning">Partial</Badge>;
  return <Badge variant="destructive">Failed</Badge>;
}

function RunDetailModal({ run, onClose }: { run: ScheduleRun; onClose: () => void }) {
  const schedule: ScheduleDay[] = run.outputPayload?.schedule ?? [];
  const shiftNames = Array.from(new Set(schedule.flatMap((d) => Object.keys(d.shifts))));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Schedule Run — {run.weekStart ? format(new Date(run.weekStart), "MMM d, yyyy") : "—"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <div><span className="text-muted-foreground">Status:</span> <RunStatusBadge status={run.status} /></div>
            <div><span className="text-muted-foreground">Unmet:</span> {run.unmetCount}</div>
            <div><span className="text-muted-foreground">Created:</span> {format(new Date(run.createdAt), "MMM d, HH:mm")}</div>
          </div>

          {schedule.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Shift</th>
                    {schedule.map((d) => (
                      <th key={d.day} className="p-3 text-left font-medium">{d.day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shiftNames.map((shift) => (
                    <tr key={shift} className="border-b last:border-0">
                      <td className="p-3 font-medium">{shift}</td>
                      {schedule.map((d) => (
                        <td key={d.day} className="p-3 align-top">
                          <div className="space-y-1">
                            {(d.shifts[shift] ?? []).map((uid) => (
                              <div key={uid} className="text-xs bg-primary/10 rounded px-2 py-1">{uid}</div>
                            ))}
                            {(d.shifts[shift] ?? []).length === 0 && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {run.outputPayload?.violations && Object.keys(run.outputPayload.violations).length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm">Violations</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(run.outputPayload.violations).map(([k, v]) => (
                  <Badge key={k} variant="warning">{k}: {v}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ScheduleRunsPage() {
  const [runs, setRuns] = useState<ScheduleRun[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewRun, setViewRun] = useState<ScheduleRun | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, dRes] = await Promise.all([
        schedulerApi.listRuns(deptFilter || undefined),
        departmentsApi.list(),
      ]);
      setRuns(rRes.data.data);
      setDepts(dRes.data.data);
    } catch { toast.error("Failed to load runs"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [deptFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule Run History</h1>
        <p className="text-muted-foreground">View past AI-generated schedule runs</p>
      </div>

      <div className="max-w-xs">
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger><SelectValue placeholder="All departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All departments</SelectItem>
            {depts.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week Start</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Unmet</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => (<TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>
                ))
              : runs.length === 0
              ? (<TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No schedule runs yet.</TableCell></TableRow>)
              : runs.map((run) => {
                  const dept = depts.find((d) => d._id === run.departmentId);
                  return (
                    <TableRow key={run._id}>
                      <TableCell>{run.weekStart ? format(new Date(run.weekStart), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell>{dept?.name ?? run.departmentId}</TableCell>
                      <TableCell><RunStatusBadge status={run.status} /></TableCell>
                      <TableCell>{run.unmetCount}</TableCell>
                      <TableCell>{format(new Date(run.createdAt), "MMM d, HH:mm")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setViewRun(run)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {viewRun && <RunDetailModal run={viewRun} onClose={() => setViewRun(null)} />}
    </div>
  );
}
