import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Users,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Clock,
  BrainCircuit,
  Shield,
  History,
  Grid3X3,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const platformNav: NavItem[] = [
  { label: "Dashboard", to: "/platform", icon: LayoutDashboard },
  { label: "Organizations", to: "/platform/orgs", icon: Building2 },
];

const tenantNav: NavItem[] = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboard },
  { label: "Departments", to: "/app/departments", icon: Building2 },
  { label: "Users", to: "/app/users", icon: Users },
  { label: "Shifts", to: "/app/shifts", icon: Clock },
  { label: "Shift Requirements", to: "/app/shift-requirements", icon: ClipboardList },
  { label: "Roles & Permissions", to: "/app/roles", icon: Shield },
  { label: "Scheduler", to: "/app/scheduler", icon: BrainCircuit },
  { label: "Schedule Runs", to: "/app/schedule-runs", icon: History },
  { label: "Shift Board", to: "/app/alloc-board", icon: Grid3X3 },
  { label: "Coverage", to: "/app/coverage", icon: BarChart3 },
];

const employeeNav: NavItem[] = [
  { label: "My Schedule", to: "/employee/calendar", icon: Calendar },
];

const sharedNav: NavItem[] = [
  { label: "Profile", to: "/profile", icon: Settings },
];

function NavGroup({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to.split("/").length <= 2}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const roleCode =
    typeof user?.roleId === "object" ? (user.roleId as { code?: string }).code ?? "" : "";
  const isPlatform = roleCode === "PLATFORM_ADMIN";
  const isTenant = roleCode === "TENANT_ADMIN";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full w-64 border-r bg-background">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          R
        </div>
        <span className="text-lg font-semibold">RosterPro</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {isPlatform && <NavGroup items={platformNav} label="Platform" />}
        {isTenant && <NavGroup items={tenantNav} label="Management" />}
        {!isPlatform && <NavGroup items={employeeNav} label="My Schedule" />}
        <NavGroup items={sharedNav} label="Account" />
      </nav>

      {/* Logout */}
      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
