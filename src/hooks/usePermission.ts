import { useAuthStore } from "@/store/auth.store";

/**
 * Returns true if the current user has a given permission code.
 * PLATFORM_ADMIN always returns true (god mode).
 */
export function usePermission(code: string): boolean {
  const { user, permissions } = useAuthStore();
  const role = typeof user?.roleId === "object" ? (user.roleId as { code?: string }).code : null;
  if (role === "PLATFORM_ADMIN") return true;
  return permissions.includes(code);
}
