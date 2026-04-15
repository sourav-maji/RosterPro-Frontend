import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orgApi } from "@/api/org.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";

export default function PlatformDashboardPage() {
  const navigate = useNavigate();
  const [orgCount, setOrgCount] = useState<number | null>(null);

  useEffect(() => {
    orgApi.count().then((r) => setOrgCount(r.data.data.count)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-muted-foreground">Global overview of all organizations</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {orgCount === null ? "—" : orgCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All registered tenants</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => navigate("/platform/orgs")}>
          Manage Organizations
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
