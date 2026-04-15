import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "@/api/users.api";
import { departmentsApi } from "@/api/departments.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, ArrowRight } from "lucide-react";

export default function TenantDashboardPage() {
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [deptCount, setDeptCount] = useState<number | null>(null);

  useEffect(() => {
    usersApi.count().then((r) => setUserCount(r.data.data.count)).catch(() => {});
    departmentsApi.list().then((r) => setDeptCount(r.data.data.length)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your organization</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userCount === null ? "—" : userCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deptCount === null ? "—" : deptCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Organizational units</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => navigate("/app/scheduler")}>
          Run Scheduler
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate("/app/alloc-board")}>
          View Shift Board
        </Button>
      </div>
    </div>
  );
}
