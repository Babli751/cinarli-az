import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { toast } from "sonner";
import { Shield, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/admin/istifadeciler")({
  component: UsersAdmin,
});

type Profile = { id: string; email: string | null; full_name: string | null; created_at: string };
type Role = { user_id: string; role: string };

function UsersAdmin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles((p as Profile[]) ?? []);
    setRoles((r as Role[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const isAdmin = (uid: string) => roles.some((r) => r.user_id === uid && r.role === "admin");

  const toggleAdmin = async (uid: string) => {
    if (isAdmin(uid)) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin rolu silindi");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Admin edildi");
    }
    load();
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black">İstifadəçilər</h1>
      <p className="text-muted-foreground">{profiles.length} istifadəçi</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Qeydiyyat</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{p.email}</td>
                <td className="px-4 py-3">{p.full_name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("az-AZ")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${isAdmin(p.id) ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "bg-secondary"}`}>
                    {isAdmin(p.id) ? "admin" : "user"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleAdmin(p.id)} className="flex items-center gap-1 text-sm text-[var(--brand)] hover:underline">
                    {isAdmin(p.id) ? <><ShieldOff className="h-4 w-4" /> Adminliyi sil</> : <><Shield className="h-4 w-4" /> Admin et</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
