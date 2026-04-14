import apiClient from "./client";
import type { ApiResponse, LoginResponse, RefreshResponse, User, AuthAccount } from "@/types/models";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<LoginResponse>>("/auth/login", { email, password }),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<RefreshResponse>>("/auth/refresh", { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post<ApiResponse<null>>("/auth/logout", { refreshToken }),

  logoutAll: () => apiClient.post<ApiResponse<null>>("/auth/logout-all"),

  me: () => apiClient.get<ApiResponse<User>>("/auth/me"),

  myPermissions: () =>
    apiClient.get<ApiResponse<{ permissions: string[] }>>("/auth/my-permissions"),

  registerLocal: (payload: { userId: string; email: string; password: string }) =>
    apiClient.post<ApiResponse<AuthAccount>>("/auth/register-local", payload),

  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.post<ApiResponse<null>>("/auth/change-password", { oldPassword, newPassword }),

  resetPassword: (userId: string, newPassword: string) =>
    apiClient.post<ApiResponse<null>>("/auth/reset-password", { userId, newPassword }),

  getAccounts: (userId: string) =>
    apiClient.get<ApiResponse<AuthAccount[]>>(`/auth/accounts/${userId}`),

  deleteAccount: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/auth/accounts/${id}`),
};
