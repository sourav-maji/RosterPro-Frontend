import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { schedulerApi } from "@/api/scheduler.api";
import { departmentsApi } from "@/api/departments.api";
import type { Department, SchedulerPreviewData, ScheduleDay } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, CheckCircle2, AlertTriangle, XCircle, Save, RotateCcw } from "lucide-react";

function StatusIcon({ status }: { status: string }) {
  if (status === "SUCCESS") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (status === "PARTIAL") return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  return <XCircle className="h-5 w-5 text-red-600" />;
}

function ScheduleTable({ schedule, nameMap }: { schedule: ScheduleDay[]; nameMap: Record<string, string> }) {
  if (!schedule.length) return null;
  const shiftNames = Array.from(new Set(schedule.flatMap((d) => Object.keys(d.shifts))));

  return (
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
                      <div key={uid} className="text-xs bg-primary/10 rounded px-2 py-1">
                        {nameMap[uid] ?? uid}
                      </div>
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
  );
}

export default function SchedulerPage() {
  const navigate = useNavigate();
  const [depts, setDepts] = useState<Department[]>([]);
  const [deptId, setDeptId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<SchedulerPreviewData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    departmentsApi.list().then((r) => setDepts(r.data.data)).catch(() => {});
  }, []);

  const runPreview = async () => {
    if (!deptId || !startDate) {
      toast.error("Select a department and start date");
      return;
    }
    setLoading(true);
    setPreview(null);
    try {
      const res = await schedulerApi.preview(deptId, startDate);
      setPreview(res.data.data);
      const status = res.data.data.result.status;
      if (status === "SUCCESS") toast.success("Schedule generated successfully!");
      else if (status === "PARTIAL") toast.warning("Schedule generated with some unmet requirements.");
      else toast.error("Scheduler could not find a valid schedule.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Scheduler service error";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const saveSchedule = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await schedulerApi.save({
        result: preview.result,
        meta: preview.meta,
        departmentId: deptId,
      });
      toast.success("Schedule saved to Shift Board!");
      navigate("/app/alloc-board");
    } catch { toast.error("Failed to save schedule"); }
    finally { setSaving(false); }
  };

  const violations = preview?.result.violations ?? {};
  const unmetCount = Object.values(violations).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrainCircuit className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">AI Scheduler</h1>
          <p className="text-muted-foreground">Generate optimized weekly rosters</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader><CardTitle className="text-base">Schedule Parameters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={deptId} onValueChange={setDeptId}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {depts.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Week Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={runPreview} disabled={loading || !deptId || !startDate} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Generating…</span>
              ) : (
                <><BrainCircuit className="mr-2 h-4 w-4" /> Run Preview</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Solving constraints... this may take up to 20 seconds.</p>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {/* Preview result */}
      {preview && !loading && (
        <div className="space-y-4">
          {/* Status bar */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <StatusIcon status={preview.result.status} />
                  <div>
                    <p className="font-semibold">
                      {preview.result.status === "SUCCESS" && "Optimal schedule found"}
                      {preview.result.status === "PARTIAL" && "Partial schedule — some needs unmet"}
                      {preview.result.status === "FAILED" && "Could not generate schedule"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {unmetCount > 0 ? `${unmetCount} unmet staffing slots` : "All staffing requirements met"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPreview(null)}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Discard
                  </Button>
                  <Button onClick={saveSchedule} disabled={saving || preview.result.status === "FAILED"}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving…" : "Save Schedule"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Violations */}
          {unmetCount > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader><CardTitle className="text-sm text-yellow-800">Unmet Requirements</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(violations).map(([key, val]) => (
                    <Badge key={key} variant="warning">{key}: {val} unmet</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule table */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Generated Schedule</h2>
            <ScheduleTable schedule={preview.result.schedule} nameMap={preview.meta.nameMap ?? {}} />
          </div>
        </div>
      )}
    </div>
  );
}
