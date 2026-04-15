import apiClient from "./client";
import type { ApiResponse, User } from "@/types/models";

export interface CreateUserPayload {
  name: string;
  email: string;
  roleId: string;
  organizationId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  roleId?: string;
  isActive?: boolean;
}

export const usersApi = {
  create: (payload: CreateUserPayload) =>
    apiClient.post<ApiResponse<User>>("/users", payload),

  list: (search?: string, orgId?: string) =>
    apiClient.get<ApiResponse<User[]>>("/users", { params: { ...(search ? { search } : {}), ...(orgId ? { orgId } : {}) } }),

  count: () => apiClient.get<ApiResponse<{ count: number }>>("/users/count"),

  getById: (id: string) => apiClient.get<ApiResponse<User>>(`/users/${id}`),

  update: (id: string, payload: UpdateUserPayload) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, payload),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/users/${id}`),

  toggle: (id: string) => apiClient.patch<ApiResponse<User>>(`/users/${id}/toggle`),

  moveDepartment: (id: string, departmentId: string) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}/department`, { departmentId }),
};
