// ─── Shared ────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

// ─── Organization ──────────────────────────────────────────────────────────────
export type OrgType = "HOSPITAL" | "FACTORY" | "GENERIC";
export type OrgStatus = "ONBOARD" | "SUSPENDED";

export interface Organization {
  _id: string;
  name: string;
  contactEmail: string;
  type: OrgType;
  address?: string;
  phone?: string;
  status: OrgStatus;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Role ──────────────────────────────────────────────────────────────────────
export interface Role {
  _id: string;
  name: string;
  code: string;
  organizationId: string | null;
  isSystem: boolean;
  createdAt: string;
}

// ─── Permission ────────────────────────────────────────────────────────────────
export type PermissionScope = "SYSTEM" | "BUSINESS";

export interface Permission {
  _id: string;
  name: string;
  code: string;
  module?: string;
  scope: PermissionScope;
  isSystem: boolean;
  organizationId: string | null;
  createdAt: string;
}

// ─── RolePermission ────────────────────────────────────────────────────────────
export interface RolePermission {
  _id: string;
  roleId: string;
  permissionId: Permission;
  organizationId: string;
  createdAt: string;
}

// ─── User ──────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  roleId: string | Role;
  organizationId: string | null;
  departmentId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export type AuthProvider = "LOCAL" | "GOOGLE" | "MICROSOFT";

export interface AuthAccount {
  _id: string;
  userId: string;
  identifier: string;
  provider: AuthProvider;
  lastLogin: string | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  mustChangePassword: boolean;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── Department ────────────────────────────────────────────────────────────────
export interface Department {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Shift ─────────────────────────────────────────────────────────────────────
export type ShiftType = "NORMAL" | "NIGHT" | "OVERTIME";

export interface Shift {
  _id: string;
  organizationId: string;
  departmentId: string | Department;
  name: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  type: ShiftType;
  isActive: boolean;
  createdAt: string;
}

// ─── ShiftRequirement ──────────────────────────────────────────────────────────
export interface ShiftRequirement {
  _id: string;
  organizationId: string;
  departmentId: string;
  shiftId: string | Shift;
  roleId: string | Role;
  requiredCount: number;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Allocation ────────────────────────────────────────────────────────────────
export type AllocSource = "ML" | "MANUAL";
export type AllocStatus = "ASSIGNED" | "SWAPPED" | "LEAVE" | "ABSENT";

export interface Allocation {
  _id: string;
  organizationId: string;
  departmentId: string;
  shiftId: string | Shift;
  userId: string | User;
  date: string;
  source: AllocSource;
  status: AllocStatus;
  objectiveScore?: number;
  notes?: string;
  createdAt: string;
}

// ─── Board / Calendar / Coverage ───────────────────────────────────────────────
export type BoardData = Record<string, { allocId: string; userId: string; name: string; status: AllocStatus; source: AllocSource }[]>;

export interface CalendarEntry {
  date: string;
  shift: string;
  status: AllocStatus;
  source: AllocSource;
}

export interface CoverageRole {
  required: number;
  actual: number;
  gap: number;
}

export type CoverageData = Record<string, Record<string, CoverageRole>>;

// ─── Scheduler ─────────────────────────────────────────────────────────────────
export interface StaffMember {
  id: string;
  role: string;
}

export interface SchedulerPayload {
  weekStart: string;
  days: string[];
  shifts: Record<string, number>;
  requirements: Record<string, Record<string, number>>;
  staff: StaffMember[];
  unavailability: Record<string, string[]>;
  preferred_holidays: Record<string, string[]>;
  max_shifts_per_week: Record<string, number>;
  max_weekly_hours: Record<string, number>;
  min_rest_hours: number;
}

export interface ScheduleDay {
  day: string;
  shifts: Record<string, string[]>;
}

export interface SchedulerResult {
  schedule: ScheduleDay[];
  objective?: number;
  violations?: Record<string, number>;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  summary?: { userId: string; role: string; totalShifts: number; nightShifts: number }[];
}

export interface SchedulerMeta {
  weekStart: string;
  shiftMap: Record<string, string>;
  userMap: Record<string, string>;
  nameMap: Record<string, string>;
}

export interface SchedulerPreviewData {
  payload: SchedulerPayload;
  result: SchedulerResult;
  meta: SchedulerMeta;
}

export interface ScheduleRun {
  _id: string;
  organizationId: string;
  departmentId: string;
  weekStart: string;
  inputPayload: SchedulerPayload;
  outputPayload: SchedulerResult;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  unmetCount: number;
  triggeredBy: string;
  source: "ML";
  createdAt: string;
}
