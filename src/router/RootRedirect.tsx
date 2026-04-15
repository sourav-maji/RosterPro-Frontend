import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

export default function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const roleCode =
    typeof user?.roleId === "object" ? (user.roleId as { code?: string }).code ?? "" : "";

  if (roleCode === "PLATFORM_ADMIN") return <Navigate to="/platform" replace />;
  return <Navigate to="/app" replace />;
}
