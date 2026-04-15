import apiClient from "./client";
import type { ApiResponse, Allocation, BoardData, CalendarEntry, CoverageData, AllocStatus } from "@/types/models";

export interface ManualAllocPayload {
  departmentId: string;
  shiftId: string;
  userId: string;
  date: string;
  status?: AllocStatus;
  notes?: string;
}

export const allocApi = {
  list: (params?: { departmentId?: string; date?: string }) =>
    apiClient.get<ApiResponse<Allocation[]>>("/alloc", { params }),

  manual: (payload: ManualAllocPayload) =>
    apiClient.post<ApiResponse<Allocation>>("/alloc/manual", payload),

  swap: (allocId: string, newUserId: string) =>
    apiClient.post<ApiResponse<Allocation>>("/alloc/swap", { allocId, newUserId }),

  board: (departmentId: string, date: string) =>
    apiClient.get<ApiResponse<BoardData>>("/alloc/board", { params: { departmentId, date } }),

  calendar: (userId: string, from: string, to: string) =>
    apiClient.get<ApiResponse<CalendarEntry[]>>("/alloc/calendar", { params: { userId, from, to } }),

  coverage: (departmentId: string, date: string) =>
    apiClient.get<ApiResponse<CoverageData>>("/alloc/coverage", { params: { departmentId, date } }),
};
