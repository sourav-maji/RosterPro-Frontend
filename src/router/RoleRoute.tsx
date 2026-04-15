import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

interface RoleRouteProps {
  allowedRoles: string[];
  redirectTo?: string;
}

export default function RoleRoute({ allowedRoles, redirectTo = "/app" }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user);
  const roleCode =
    typeof user?.roleId === "object" ? (user.roleId as { code?: string }).code ?? "" : "";

  if (!allowedRoles.includes(roleCode)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
}
