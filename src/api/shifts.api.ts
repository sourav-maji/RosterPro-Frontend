import apiClient from "./client";
import type { ApiResponse, Shift, ShiftType } from "@/types/models";

export interface CreateShiftPayload {
  name: string;
  departmentId: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  type?: ShiftType;
  isActive?: boolean;
}

export const shiftsApi = {
  create: (payload: CreateShiftPayload) =>
    apiClient.post<ApiResponse<Shift>>("/shifts", payload),

  list: (departmentId?: string) =>
    apiClient.get<ApiResponse<Shift[]>>("/shifts", { params: departmentId ? { departmentId } : {} }),

  getById: (id: string) => apiClient.get<ApiResponse<Shift>>(`/shifts/${id}`),

  update: (id: string, payload: Partial<CreateShiftPayload>) =>
    apiClient.put<ApiResponse<Shift>>(`/shifts/${id}`, payload),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/shifts/${id}`),

  toggle: (id: string) => apiClient.patch<ApiResponse<Shift>>(`/shifts/${id}/toggle`),
};
