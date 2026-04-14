import apiClient from "./client";
import type { ApiResponse, RolePermission } from "@/types/models";

export const rolePermissionApi = {
  assign: (roleId: string, permissionId: string) =>
    apiClient.post<ApiResponse<RolePermission>>("/role-permission", { roleId, permissionId }),

  bulkAssign: (roleId: string, permissionIds: string[]) =>
    apiClient.post<ApiResponse<null>>("/role-permission/bulk", { roleId, permissionIds }),

  remove: (id: string) => apiClient.delete<ApiResponse<null>>(`/role-permission/${id}`),

  listForRole: (roleId: string) =>
    apiClient.get<ApiResponse<RolePermission[]>>(`/role-permission/role/${roleId}`),
};
