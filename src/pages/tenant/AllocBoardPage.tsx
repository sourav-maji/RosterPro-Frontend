import { useEffect, useState } from "react";
import { toast } from "sonner";
import { allocApi } from "@/api/alloc.api";
import { departmentsApi } from "@/api/departments.api";
import { usersApi } from "@/api/users.api";
import type { Department, User, BoardData, AllocStatus, AllocSource } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";

const statusVariant: Record<AllocStatus, "success" | "secondary" | "warning" | "destructive"> = {
  ASSIGNED: "success",
  SWAPPED: "secondary",
  LEAVE: "warning",
  ABSENT: "destructive",
};

const sourceTag: Record<AllocSource, string> = {
  ML: "AI",
  MANUAL: "Manual",
};

export default function AllocBoardPage() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deptId, setDeptId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(false);

  const [swapDialog, setSwapDialog] = useState<{ allocId: string; shift: string; currentUser: string } | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    departmentsApi.list().then((r) => setDepts(r.data.data)).catch(() => {});
    usersApi.list().then((r) => setUsers(r.data.data)).catch(() => {});
  }, []);

  const load = async () => {
    if (!deptId || !date) return;
    setLoading(true);
    setBoard(null);
    try {
      const res = await allocApi.board(deptId, date);
      setBoard(res.data.data);
    } catch { toast.error("Failed to load shift board"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [deptId, date]);

  const handleSwap = async () => {
    if (!swapDialog || !newUserId) return;
    setSwapping(true);
    try {
      await allocApi.swap(swapDialog.allocId, newUserId);
      toast.success("Swap successful");
      setSwapDialog(null);
      setNewUserId("");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Swap failed";
      toast.error(msg);
    } finally { setSwapping(false); }
  };

  const shifts = board ? Object.keys(board) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shift Board</h1>
        <p className="text-muted-foreground">View and manage daily shift assignments</p>
      </div>

      {/* Controls */}
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
        <p className="text-sm text-muted-foreground">Select a department to view the shift board.</p>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      )}

      {board && !loading && (
        <>
          {shifts.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No assignments for this date.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((shiftName) => (
              <Card key={shiftName}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{shiftName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {board[shiftName].length === 0 && (
                    <p className="text-xs text-muted-foreground">No one assigned</p>
                  )}
                  {board[shiftName].map((entry) => (
                    <div
                      key={entry.userId}
                      className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/30"
                    >
                      <div>
                        <p className="text-sm font-medium">{entry.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant={statusVariant[entry.status]} className="text-xs">{entry.status}</Badge>
                          <span className="text-xs text-muted-foreground">{sourceTag[entry.source]}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Swap user"
                        onClick={() => { setSwapDialog({ allocId: entry.userId, shift: shiftName, currentUser: entry.name }); setNewUserId(""); }}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Swap dialog */}
      <Dialog open={!!swapDialog} onOpenChange={(o) => !o && setSwapDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Swap {swapDialog?.currentUser}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Replace with</Label>
            <Select value={newUserId} onValueChange={setNewUserId}>
              <SelectTrigger><SelectValue placeholder="Select new user" /></SelectTrigger>
              <SelectContent>
                {users.filter((u) => u.isActive && u._id !== swapDialog?.allocId).map((u) => (
                  <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwapDialog(null)}>Cancel</Button>
            <Button onClick={handleSwap} disabled={!newUserId || swapping}>{swapping ? "Swapping…" : "Confirm Swap"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
