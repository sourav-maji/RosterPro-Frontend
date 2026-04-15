import apiClient from "./client";
import type { ApiResponse, Department, User } from "@/types/models";

export const departmentsApi = {
  create: (payload: { name: string; description?: string }) =>
    apiClient.post<ApiResponse<Department>>("/departments", payload),

  list: () => apiClient.get<ApiResponse<Department[]>>("/departments"),

  getById: (id: string) => apiClient.get<ApiResponse<Department>>(`/departments/${id}`),

  update: (id: string, payload: { name?: string; description?: string }) =>
    apiClient.put<ApiResponse<Department>>(`/departments/${id}`, payload),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/departments/${id}`),

  getUsers: (id: string) => apiClient.get<ApiResponse<User[]>>(`/departments/${id}/users`),
};
