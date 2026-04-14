import { useEffect, useState } from "react";
import { toast } from "sonner";
import { allocApi } from "@/api/alloc.api";
import { departmentsApi } from "@/api/departments.api";
import type { Department, CoverageData } from "@/types/models";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function GapCell({ gap }: { gap: number }) {
  const cls =
    gap < 0
      ? "text-red-700 bg-red-50 rounded px-2 py-0.5 font-semibold"
      : gap > 0
      ? "text-yellow-700 bg-yellow-50 rounded px-2 py-0.5 font-semibold"
      : "text-green-700 bg-green-50 rounded px-2 py-0.5 font-semibold";
  return <span className={cls}>{gap < 0 ? gap : gap > 0 ? `+${gap}` : "✓"}</span>;
}

export default function CoveragePage() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [deptId, setDeptId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [coverage, setCoverage] = useState<CoverageData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    departmentsApi.list().then((r) => setDepts(r.data.data)).catch(() => {});
  }, []);

  const load = async () => {
    if (!deptId || !date) return;
    setLoading(true);
    setCoverage(null);
    try {
      const res = await allocApi.coverage(deptId, date);
      setCoverage(res.data.data);
    } catch { toast.error("Failed to load coverage"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [deptId, date]);

  const shifts = coverage ? Object.keys(coverage) : [];

  // Flatten to rows: shift/role combos
  const rows: { shift: string; role: string; required: number; actual: number; gap: number }[] = [];
  for (const shift of shifts) {
    for (const role of Object.keys(coverage![shift])) {
      const c = coverage![shift][role];
      rows.push({ shift, role, ...c });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Coverage Report</h1>
        <p className="text-muted-foreground">Compare staffing requirements vs actual assignments</p>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2 min-w-[200px]">
          <Label>Department</Label>
          <Select value={deptId} onValueChange={setDeptId}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              {depts.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button variant="outline" onClick={load} disabled={!deptId || loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {!deptId && (
        <p className="text-sm text-muted-foreground">Select a department to view coverage.</p>
      )}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      )}

      {coverage && !loading && (
        <>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No coverage data for this date.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shift</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Required</TableHead>
                    <TableHead className="text-center">Actual</TableHead>
                    <TableHead className="text-center">Gap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className={cn(row.gap < 0 ? "bg-red-50/50" : row.gap > 0 ? "bg-yellow-50/50" : "")}>
                      <TableCell className="font-medium">{row.shift}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell className="text-center">{row.required}</TableCell>
                      <TableCell className="text-center">{row.actual}</TableCell>
                      <TableCell className="text-center"><GapCell gap={row.gap} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-red-100 border border-red-300" /> Understaffed</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-green-100 border border-green-300" /> Met</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-yellow-100 border border-yellow-300" /> Overstaffed</span>
          </div>
        </>
      )}
    </div>
  );
}
