import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type User } from "@/lib/api";
import { toast } from "sonner";
import { Shield, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/admin/istifadeciler")({
  component: UsersAdmin,
});

function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);

  const load = async () => {
    api.getUsers().then(setUsers).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const toggleAdmin = async (u: User) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    try {
      await api.updateUserRole(u.id, newRole);
      toast.success(newRole === "admin" ? "Admin edildi" : "Admin rolu silindi");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (<div>

      <h1 className="text-2xl font-black md:text-3xl">İstifadəçilər</h1>
      <p className="text-muted-foreground">{users.length} istifadəçi</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[480px] text-sm">
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
            {users.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">İstifadəçi yoxdur</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3">{u.full_name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString("az-AZ") : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${u.role === "admin" ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "bg-secondary"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleAdmin(u)} className="flex items-center gap-1 text-sm text-[var(--brand)] hover:underline">
                    {u.role === "admin"
                      ? <><ShieldOff className="h-4 w-4" /> Adminliyi sil</>
                      : <><Shield className="h-4 w-4" /> Admin et</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

  </div>);
}
