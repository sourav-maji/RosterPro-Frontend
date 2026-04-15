import apiClient from "./client";
import type { ApiResponse, Organization, User, OrgType, OrgStatus } from "@/types/models";

export interface CreateOrgPayload {
  name: string;
  contactEmail: string;
  type?: OrgType;
  address?: string;
  phone?: string;
  // Optional: bootstrap a Tenant Admin user at org creation time
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
}

export interface CreateOrgResponse {
  org: Organization;
  adminUser: User | null;
}

export interface UpdateOrgPayload extends Partial<CreateOrgPayload> {
  status?: OrgStatus;
  isActive?: boolean;
}

export const orgApi = {
  create: (payload: CreateOrgPayload) =>
    apiClient.post<ApiResponse<CreateOrgResponse>>("/org", payload),

  list: () => apiClient.get<ApiResponse<Organization[]>>("/org"),

  count: () => apiClient.get<ApiResponse<{ count: number }>>("/org/count"),

  me: () => apiClient.get<ApiResponse<Organization>>("/org/me"),

  getById: (id: string) => apiClient.get<ApiResponse<Organization>>(`/org/${id}`),

  update: (id: string, payload: UpdateOrgPayload) =>
    apiClient.put<ApiResponse<Organization>>(`/org/${id}`, payload),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/org/${id}`),

  toggle: (id: string) => apiClient.patch<ApiResponse<Organization>>(`/org/${id}/toggle`),
};
