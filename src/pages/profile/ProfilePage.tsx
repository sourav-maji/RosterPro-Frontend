import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import type { AuthAccount } from "@/types/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { User, Mail, Shield } from "lucide-react";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    authApi.getAccounts(user._id)
      .then((r) => setAccounts(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?._id]);

  const roleCode =
    typeof user?.roleId === "object"
      ? (user.roleId as { code?: string; name?: string }).name ?? "—"
      : "—";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium">{user?.name ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-medium">{roleCode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Linked Auth Providers</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked accounts.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc._id} className="flex items-center justify-between border rounded-md px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{acc.identifier}</p>
                    {acc.lastLogin && (
                      <p className="text-xs text-muted-foreground">
                        Last login: {format(new Date(acc.lastLogin), "MMM d, yyyy HH:mm")}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">{acc.provider}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
