import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/kateqoriyalar")({
  component: CatsAdmin,
});

type Cat = { id: string; slug: string; name: string; icon: string | null; description: string | null };

function CatsAdmin() {
  const [items, setItems] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Partial<Cat> | null>(null);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setItems((data as Cat[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name || !editing?.slug) return toast.error("Ad və slug mütləqdir");
    const payload = {
      name: editing.name, slug: editing.slug,
      icon: editing.icon ?? "📦", description: editing.description ?? "",
    };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saxlanıldı");
    setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Silmək?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Kateqoriyalar</h1>
          <p className="text-muted-foreground">{items.length} kateqoriya</p>
        </div>
        <button onClick={() => setEditing({})} className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-semibold text-[var(--brand-foreground)]">
          <Plus className="h-4 w-4" /> Yeni
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
            <div className="text-3xl">{c.icon}</div>
            <div className="flex-1">
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">/{c.slug}</div>
            </div>
            <button onClick={() => setEditing(c)} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(c.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing.id ? "Redaktə" : "Yeni kateqoriya"}</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Ad" className={inp} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <input placeholder="slug (məs: divanlar)" className={inp} value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              <input placeholder="İkon (emoji)" className={inp} value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
              <textarea placeholder="Təsvir" className={inp} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2">Ləğv</button>
              <button onClick={save} className="rounded-lg bg-[var(--brand)] px-4 py-2 font-semibold text-[var(--brand-foreground)]">Saxla</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-[var(--brand)]";
