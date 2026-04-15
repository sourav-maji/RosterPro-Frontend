import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { orgApi, type CreateOrgPayload, type UpdateOrgPayload } from "@/api/org.api";
import type { Organization, OrgType } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, ToggleLeft, UserPlus } from "lucide-react";

const orgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactEmail: z.string().email("Enter a valid email"),
  type: z.enum(["HOSPITAL", "FACTORY", "GENERIC"]).default("GENERIC"),
  address: z.string().optional(),
  phone: z.string().optional(),
  // Tenant admin bootstrap (create-only, all or none)
  adminName: z.string().optional(),
  adminEmail: z.string().optional(),
  adminPassword: z.string().optional(),
}).superRefine((d, ctx) => {
  const any = d.adminName || d.adminEmail || d.adminPassword;
  if (any) {
    if (!d.adminName) ctx.addIssue({ path: ["adminName"], code: "custom", message: "Admin name required" });
    if (!d.adminEmail || !/^[^@]+@[^@]+\.[^@]+$/.test(d.adminEmail))
      ctx.addIssue({ path: ["adminEmail"], code: "custom", message: "Valid admin email required" });
    if (!d.adminPassword || d.adminPassword.length < 6)
      ctx.addIssue({ path: ["adminPassword"], code: "custom", message: "Password must be at least 6 characters" });
  }
});

type OrgForm = z.infer<typeof orgSchema>;

function OrgStatusBadge({ status, isActive }: { status: string; isActive: boolean }) {
  if (!isActive) return <Badge variant="destructive">Inactive</Badge>;
  if (status === "SUSPENDED") return <Badge variant="warning">Suspended</Badge>;
  return <Badge variant="success">Active</Badge>;
}

export default function OrgListPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: { type: "GENERIC" },
  });

  const watchedType = watch("type");

  const load = async () => {
    try {
      setLoading(true);
      const res = await orgApi.list();
      setOrgs(res.data.data);
    } catch {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ type: "GENERIC", adminName: "", adminEmail: "", adminPassword: "" });
    setDialogOpen(true);
  };

  const openEdit = (org: Organization) => {
    setEditing(org);
    reset({ name: org.name, contactEmail: org.contactEmail, type: org.type, address: org.address ?? "", phone: org.phone ?? "" });
    setDialogOpen(true);
  };

  const onSubmit = async (data: OrgForm) => {
    setSaving(true);
    try {
      if (editing) {
        await orgApi.update(editing._id, data as UpdateOrgPayload);
        toast.success("Organization updated");
      } else {
        const res = await orgApi.create(data as CreateOrgPayload);
        const adminUser = res.data.data?.adminUser;
        if (adminUser) {
          toast.success(`Organization created with Tenant Admin "${adminUser.name}"`);
        } else {
          toast.success("Organization created");
        }
      }
      setDialogOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error saving organization";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (org: Organization) => {
    try {
      await orgApi.toggle(org._id);
      toast.success("Status toggled");
      load();
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await orgApi.delete(deleteTarget._id);
      toast.success("Organization deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Failed to delete organization");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">All registered tenants on the platform</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Organization
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : orgs.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No organizations found.
                    </TableCell>
                  </TableRow>
                )
              : orgs.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.contactEmail}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{org.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <OrgStatusBadge status={org.status} isActive={org.isActive} />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(org)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggle(org)}>
                        <ToggleLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(org)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Organization" : "New Organization"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} placeholder="Acme Hospital" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input {...register("contactEmail")} placeholder="admin@acme.com" />
              {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={watchedType} onValueChange={(v) => setValue("type", v as OrgType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERIC">Generic</SelectItem>
                  <SelectItem value="HOSPITAL">Hospital</SelectItem>
                  <SelectItem value="FACTORY">Factory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Address (optional)</Label>
              <Input {...register("address")} placeholder="123 Main St" />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input {...register("phone")} placeholder="+1234567890" />
            </div>

            {/* Tenant Admin bootstrap — only shown on create */}
            {!editing && (
              <div className="space-y-3 rounded-lg border border-dashed p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Initial Tenant Admin (optional)
                </div>
                <p className="text-xs text-muted-foreground">
                  Fill all three fields to automatically create a Tenant Admin user for this org.
                  They will be asked to change their password on first login.
                </p>
                <div className="space-y-2">
                  <Label>Admin Name</Label>
                  <Input {...register("adminName")} placeholder="Jane Smith" />
                  {errors.adminName && <p className="text-sm text-destructive">{errors.adminName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Admin Email</Label>
                  <Input {...register("adminEmail")} placeholder="jane@clinic.com" />
                  {errors.adminEmail && <p className="text-sm text-destructive">{errors.adminEmail.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Temporary Password</Label>
                  <Input type="password" autoComplete="new-password" {...register("adminPassword")} placeholder="Min. 6 characters" />
                  {errors.adminPassword && <p className="text-sm text-destructive">{errors.adminPassword.message}</p>}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
