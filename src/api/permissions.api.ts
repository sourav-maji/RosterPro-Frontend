import apiClient from "./client";
import type { ApiResponse, Permission } from "@/types/models";

export const permissionsApi = {
  create: (payload: { name: string; code: string; module?: string }) =>
    apiClient.post<ApiResponse<Permission>>("/permissions", payload),

  list: () => apiClient.get<ApiResponse<Permission[]>>("/permissions"),

  update: (id: string, payload: { name?: string; module?: string }) =>
    apiClient.put<ApiResponse<Permission>>(`/permissions/${id}`, payload),
};
