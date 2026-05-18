import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Category } from "@/lib/api";
import { CategoryIcon } from "@/components/CategoryIcon";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, EyeOff, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/kateqoriyalar")({
  component: CatsAdmin,
});

type EditMode = "parent" | "child" | "hidden";

function CatsAdmin() {
  const [items, setItems] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("parent");
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const load = async () => {
    const [cats, products] = await Promise.all([api.getCategoriesAll(), api.getProducts()]);
    setItems(cats);
    const counts: Record<string, number> = {};
    products.forEach((p) => { if (p.category_slug) counts[p.category_slug] = (counts[p.category_slug] || 0) + 1; });
    setProductCounts(counts);
  };
  useEffect(() => { load(); }, []);

  const openNew = (mode: EditMode, parentId?: number) => {
    setEditMode(mode);
    setEditing({
      parent_id: mode === "child" ? (parentId ?? undefined) : null,
      is_hidden: mode === "hidden" ? 1 : 0,
    });
  };

  const openEdit = (c: Category) => {
    if (c.is_hidden) setEditMode("hidden");
    else if (c.parent_id) setEditMode("child");
    else setEditMode("parent");
    setEditing(c);
  };

  const save = async () => {
    if (!editing?.name) return toast.error("Ad mütləqdir");
    if (editMode === "child" && !editing.parent_id) return toast.error("Alt kateqoriya üçün ana kateqoriya seçin");
    const slug = editing.slug || editing.name
      .toLowerCase()
      .replace(/ə/g, "e").replace(/ö/g, "o").replace(/ü/g, "u")
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ş/g, "s").replace(/ç/g, "c")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = {
      ...editing,
      slug,
      is_hidden: editMode === "hidden" ? 1 : 0,
      parent_id: editMode === "hidden" ? null : editing.parent_id,
    };
    try {
      if (editing.id) {
        await api.updateCategory(editing.id, payload);
      } else {
        await api.createCategory(payload);
      }
      toast.success("Saxlanıldı");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Kateqoriyanı silmək istədiyinizə əminsiniz?")) return;
    try {
      await api.deleteCategory(id);
      toast.success("Silindi");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const reorder = async (id: number, direction: "up" | "down") => {
    try {
      await api.reorderCategory(id, direction);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Build tree: root nodes only (no parent_id, not hidden)
  const roots = items.filter(c => !c.parent_id && !c.is_hidden);
  const hidden = items.filter(c => !!c.is_hidden);
  const getChildren = (parentId: number) => items.filter(c => c.parent_id === parentId);

  // Recursive category row renderer
  const renderCatNode = (c: Category, depth: number) => {
    const children = getChildren(c.id);
    const paddingLeft = depth === 0 ? "" : depth === 1 ? "ml-6 border-l-2 border-border pl-4" : "ml-10 border-l-2 border-dashed border-border pl-4";
    return (
      <div key={c.id} className={depth > 0 ? paddingLeft + " mt-2" : "mt-2"}>
        <div className={`flex items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm hover:shadow-md transition-shadow ${depth > 0 ? "bg-secondary/30" : ""}`}>
          {depth === 0 && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary flex-shrink-0">
              <CategoryIcon slug={c.slug} className="h-6 w-6 text-foreground" />
            </div>
          )}
          {depth > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className={`font-${depth === 0 ? "bold" : "semibold"} text-${depth === 0 ? "base" : "sm"} truncate`}>{c.name}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>/{c.slug}</span>
              <span className="text-[var(--brand)] font-medium">{productCounts[c.slug] || 0} məhsul</span>
              {children.length > 0 && <span>{children.length} alt bölmə</span>}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0 items-center">
            <div className="flex flex-col gap-0.5 mr-1">
              <button onClick={() => reorder(c.id, "up")} className="rounded p-0.5 hover:bg-secondary transition-colors"><ChevronUp className="h-3 w-3" /></button>
              <button onClick={() => reorder(c.id, "down")} className="rounded p-0.5 hover:bg-secondary transition-colors"><ChevronDown className="h-3 w-3" /></button>
            </div>
            <button
              onClick={() => openNew("child", c.id)}
              className="rounded-lg p-1.5 hover:bg-[var(--brand)]/10 text-[var(--brand)] transition-colors"
              title="Alt kateqoriya əlavə et"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 hover:bg-secondary transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        {children.length > 0 && (
          <div className={depth === 0 ? "ml-6 border-l-2 border-border pl-4 mt-1 space-y-1" : "ml-6 border-l-2 border-dashed border-border pl-4 mt-1 space-y-1"}>
            {children.map(child => renderCatNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalCount = items.filter(c => !c.is_hidden).length;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Kateqoriyalar</h1>
          <p className="text-muted-foreground">{roots.length} ana, {totalCount - roots.length} alt, {hidden.length} gizli</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openNew("parent")}
            className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity text-sm"
          >
            <Plus className="h-4 w-4" /> Ana kateqoriya
          </button>
          <button
            onClick={() => openNew("child")}
            className="flex items-center gap-2 rounded-xl border-2 border-[var(--brand)] px-4 py-2.5 font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/10 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" /> Alt kateqoriya
          </button>
          <button
            onClick={() => openNew("hidden")}
            className="flex items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/40 px-4 py-2.5 font-semibold text-muted-foreground hover:bg-secondary transition-colors text-sm"
          >
            <EyeOff className="h-4 w-4" /> Gizli kateqoriya
          </button>
        </div>
      </div>

      {/* Gizli kateqoriyalar */}
      {hidden.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <EyeOff className="h-3.5 w-3.5" /> Gizli Kateqoriyalar
            <span className="text-xs font-normal normal-case">(saytda görünmür, yalnız admin)</span>
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {hidden.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-secondary/30 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary flex-shrink-0">
                  <CategoryIcon slug={c.slug} className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <span className="flex-shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">gizli</span>
                  </div>
                  <div className="text-xs text-muted-foreground">/{c.slug} · {productCounts[c.slug] || 0} məhsul</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 hover:bg-secondary transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kateqoriya ağacı */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Kateqoriya Strukturu</h2>
        <div className="space-y-3">
          {roots.map(c => renderCatNode(c, 0))}
          {roots.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">Kateqoriya yoxdur</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">
                  {editing.id
                    ? "Redaktə et"
                    : editMode === "parent"
                      ? "Yeni ana kateqoriya"
                      : editMode === "hidden"
                        ? "Yeni gizli kateqoriya"
                        : "Yeni alt kateqoriya"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editMode === "parent"
                    ? "Kataloqda əsas bölmə"
                    : editMode === "hidden"
                      ? "Yalnız admin görür, saytda görünmür"
                      : "Başqa kateqoriyanın alt bölməsi"}
                </p>
              </div>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Ad *">
                <input
                  className={inp}
                  placeholder={editMode === "parent" ? "Məs: Yumşaq Mebel" : editMode === "hidden" ? "Məs: Ümumi Mallar" : "Məs: Künc Divanlar"}
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: "" })}
                />
              </Field>
              {editMode !== "hidden" && (
                <Field label={editMode === "child" ? "Ana kateqoriya *" : "Ana kateqoriya (opsional)"}>
                  <select
                    className={inp}
                    value={editing.parent_id ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      setEditing({ ...editing, parent_id: val });
                      if (val) setEditMode("child");
                      else if (!editing.is_hidden) setEditMode("parent");
                    }}
                  >
                    <option value="">— Ana kateqoriya yoxdur —</option>
                    {items.filter(c => c.id !== editing.id).map(c => {
                      const depth = c.parent_id ? (items.find(p => p.id === c.parent_id)?.parent_id ? 2 : 1) : 0;
                      const prefix = depth === 1 ? "  ↳ " : depth === 2 ? "    ↳↳ " : "";
                      return (
                        <option key={c.id} value={c.id}>{prefix}{c.is_hidden ? "🔒 " : ""}{c.name}</option>
                      );
                    })}
                  </select>
                </Field>
              )}
              <Field label="Təsvir">
                <textarea
                  className={inp}
                  rows={2}
                  placeholder="Qısa məlumat"
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </Field>
              {editMode !== "child" && editing.id && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editing.is_hidden}
                    onChange={(e) => setEditing({ ...editing, is_hidden: e.target.checked ? 1 : 0 })}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <EyeOff className="h-4 w-4 text-muted-foreground" /> Saytda gizli saxla
                  </span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-border px-5 py-2.5 font-medium hover:bg-secondary">Ləğv et</button>
              <button onClick={save} className="rounded-xl bg-[var(--brand)] px-5 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90">
                {editing.id ? "Yadda saxla" : "Əlavə et"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium">{label}</label>{children}</div>;
}
