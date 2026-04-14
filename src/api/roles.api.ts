import apiClient from "./client";
import type { ApiResponse, Role } from "@/types/models";

export const rolesApi = {
  create: (payload: { name: string; code: string }) =>
    apiClient.post<ApiResponse<Role>>("/roles", payload),

  list: () => apiClient.get<ApiResponse<Role[]>>("/roles"),

  update: (id: string, payload: { name?: string; code?: string }) =>
    apiClient.put<ApiResponse<Role>>(`/roles/${id}`, payload),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/roles/${id}`),
};
