import apiClient from "./client";
import type { ApiResponse, ShiftRequirement } from "@/types/models";

export interface CreateShiftReqPayload {
  departmentId: string;
  shiftId: string;
  roleId: string;
  requiredCount: number;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface BulkShiftReqPayload {
  departmentId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo: string;
  requirements: { roleId: string; count: number }[];
}

export const shiftReqApi = {
  create: (payload: CreateShiftReqPayload) =>
    apiClient.post<ApiResponse<ShiftRequirement>>("/shift-req", payload),

  listByDept: (deptId: string, date?: string) =>
    apiClient.get<ApiResponse<ShiftRequirement[]>>(`/shift-req/department/${deptId}`, {
      params: date ? { date } : {},
    }),

  listByDeptShift: (deptId: string, shiftId: string, date?: string) =>
    apiClient.get<ApiResponse<ShiftRequirement[]>>(
      `/shift-req/department/${deptId}/shift/${shiftId}`,
      { params: date ? { date } : {} }
    ),

  bulk: (payload: BulkShiftReqPayload) =>
    apiClient.post<ApiResponse<ShiftRequirement[]>>("/shift-req/bulk", payload),

  update: (id: string, payload: Partial<CreateShiftReqPayload> & { isActive?: boolean }) =>
    apiClient.put<ApiResponse<ShiftRequirement>>(`/shift-req/${id}`, payload),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/shift-req/${id}`),
};
