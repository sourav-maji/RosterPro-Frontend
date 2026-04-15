import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const schema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.changePassword(data.oldPassword, data.newPassword);
      // Clear the flag in the store so the banner disappears and nav is unrestricted
      useAuthStore.setState({ mustChangePassword: false });
      toast.success("Password changed successfully");
      reset();
      if (mustChangePassword) {
        // Send them to their role-appropriate home
        const user = useAuthStore.getState().user;
        const roleCode = typeof user?.roleId === "object" ? (user.roleId as { code?: string }).code : null;
        navigate(roleCode === "PLATFORM_ADMIN" ? "/platform" : "/app");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to change password";
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-muted-foreground">Update your account password</p>
      </div>

      {mustChangePassword && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">
            Your account was set up with a temporary password. You must change it before continuing.
          </p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Update Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" autoComplete="current-password" {...register("oldPassword")} placeholder="••••••••" />
              {errors.oldPassword && <p className="text-sm text-destructive">{errors.oldPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" autoComplete="new-password" {...register("newPassword")} placeholder="••••••••" />
              {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" autoComplete="new-password" {...register("confirmPassword")} placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
