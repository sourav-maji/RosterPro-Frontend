import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import RootRedirect from "./RootRedirect";
import AppShell from "@/components/layout/AppShell";

// Auth
import LoginPage from "@/pages/auth/LoginPage";

// Platform
import PlatformDashboardPage from "@/pages/platform/PlatformDashboardPage";
import OrgListPage from "@/pages/platform/OrgListPage";
import PlatformUsersPage from "@/pages/platform/PlatformUsersPage";

// Tenant
import TenantDashboardPage from "@/pages/tenant/TenantDashboardPage";
import DepartmentsPage from "@/pages/tenant/DepartmentsPage";
import UsersPage from "@/pages/tenant/UsersPage";
import ShiftsPage from "@/pages/tenant/ShiftsPage";
import ShiftRequirementsPage from "@/pages/tenant/ShiftRequirementsPage";
import RolesPage from "@/pages/tenant/RolesPage";
import SchedulerPage from "@/pages/tenant/SchedulerPage";
import ScheduleRunsPage from "@/pages/tenant/ScheduleRunsPage";
import AllocBoardPage from "@/pages/tenant/AllocBoardPage";
import CoveragePage from "@/pages/tenant/CoveragePage";

// Employee
import MyCalendarPage from "@/pages/employee/MyCalendarPage";

// Profile
import ProfilePage from "@/pages/profile/ProfilePage";
import ChangePasswordPage from "@/pages/profile/ChangePasswordPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Root redirect */}
          <Route index element={<RootRedirect />} />

          {/* Platform Admin */}
          <Route path="/platform" element={<RoleRoute allowedRoles={["PLATFORM_ADMIN"]} redirectTo="/app" />}>
            <Route index element={<PlatformDashboardPage />} />
            <Route path="orgs" element={<OrgListPage />} />
            <Route path="org-users" element={<PlatformUsersPage />} />
          </Route>

          {/* Tenant Admin */}
          <Route path="/app">
            <Route index element={<TenantDashboardPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="shift-requirements" element={<ShiftRequirementsPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="scheduler" element={<SchedulerPage />} />
            <Route path="schedule-runs" element={<ScheduleRunsPage />} />
            <Route path="alloc-board" element={<AllocBoardPage />} />
            <Route path="coverage" element={<CoveragePage />} />
          </Route>

          {/* Employee schedule */}
          <Route path="/employee">
            <Route path="calendar" element={<MyCalendarPage />} />
          </Route>

          {/* Shared profile */}
          <Route path="/profile">
            <Route index element={<ProfilePage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
