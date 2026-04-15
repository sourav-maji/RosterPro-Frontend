import apiClient from "./client";
import type { ApiResponse, SchedulerPreviewData, ScheduleRun, SchedulerResult, SchedulerMeta } from "@/types/models";

export const schedulerApi = {
  preview: (departmentId: string, startDate: string) =>
    apiClient.post<ApiResponse<SchedulerPreviewData>>("/scheduler/preview", { departmentId, startDate }),

  save: (payload: { result: SchedulerResult; meta: SchedulerMeta; departmentId: string }) =>
    apiClient.post<ApiResponse<unknown[]>>("/scheduler/save", payload),

  listRuns: (departmentId?: string) =>
    apiClient.get<ApiResponse<ScheduleRun[]>>("/scheduler/runs", {
      params: departmentId ? { departmentId } : {},
    }),

  getRun: (id: string) => apiClient.get<ApiResponse<ScheduleRun>>(`/scheduler/runs/${id}`),
};
