import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { api, type Order } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, Eye, Search } from "lucide-react";

export const Route = createFileRoute("/admin/sifarisler")({
  component: OrdersAdmin,
});

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_AZ: Record<string, string> = {
  pending: "Gözləyir", confirmed: "Təsdiqləndi",
  shipped: "Göndərildi", delivered: "Çatdırıldı", cancelled: "Ləğv edildi",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function OrdersAdmin() {
  const [items, setItems] = useState<Order[]>([]);
  const [open, setOpen] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = async () => {
    api.getOrders().then(setItems).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((o) => {
    const matchSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.phone.includes(search);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  }), [items, search, filterStatus]);

  const setStatus = async (id: number, status: string) => {
    try {
      await api.updateOrderStatus(id, status);
      toast.success("Status yeniləndi");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Sifarişi silmək istədiyinizə əminsiniz?")) return;
    try {
      await api.deleteOrder(id);
      toast.success("Silindi");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totalRevenue = filtered.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  return (<div>

      <div className="mb-6">
        <h1 className="text-2xl font-black md:text-3xl">Sifarişlər</h1>
        <p className="text-muted-foreground">{filtered.length} sifariş · {totalRevenue.toFixed(2)} ₼ gəlir</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Müştəri adı və ya telefon..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]">
          <option value="">Bütün statuslar</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_AZ[s]}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary/40 text-left text-xs text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Müştəri</th>
              <th className="px-5 py-3">Telefon</th>
              <th className="px-5 py-3">Məbləğ</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Tarix</th>
              <th className="px-5 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">Sifariş tapılmadı</td></tr>
            ) : filtered.map((o) => (
              <tr key={o.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                <td className="px-5 py-3 text-muted-foreground font-mono">#{o.id}</td>
                <td className="px-5 py-3 font-semibold">{o.customer_name}</td>
                <td className="px-5 py-3">{o.phone}</td>
                <td className="px-5 py-3 font-bold">{o.total} ₼</td>
                <td className="px-5 py-3">
                  <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border-0 outline-none cursor-pointer ${STATUS_COLOR[o.status] ?? "bg-secondary"}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_AZ[s]}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{new Date(o.created_at!).toLocaleDateString("az-AZ")}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => setOpen(o)} className="rounded-lg p-2 hover:bg-secondary transition-colors" title="Detallar">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(o.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors" title="Sil">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">Sifariş #{open.id}</h2>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[open.status] ?? "bg-secondary"}`}>
                  {STATUS_AZ[open.status] ?? open.status}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black">{open.total} ₼</div>
                <div className="text-xs text-muted-foreground">{new Date(open.created_at!).toLocaleDateString("az-AZ")}</div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <Row k="Müştəri" v={open.customer_name} />
              <Row k="Telefon" v={open.phone} />
              <Row k="Ünvan" v={open.address || "—"} />
              <Row k="Qeydlər" v={open.notes || "—"} />
              <div className="mt-4">
                <div className="mb-2 font-semibold text-sm">Sifariş edilən məhsullar:</div>
                <div className="rounded-xl bg-secondary/50 p-3 space-y-1.5 max-h-52 overflow-y-auto">
                  {(() => {
                    try {
                      const parsed = typeof open.items === "string" ? JSON.parse(open.items) : open.items;
                      return Array.isArray(parsed) && parsed.length > 0 ? parsed.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item.name ?? item.title ?? JSON.stringify(item)}</span>
                          <span className="font-semibold">{item.price ? `${item.price} ₼` : ""}</span>
                        </div>
                      )) : <div className="text-xs text-muted-foreground">Məhsul məlumatı yoxdur</div>;
                    } catch {
                      return <pre className="text-xs">{String(open.items)}</pre>;
                    }
                  })()}
                </div>
              </div>
            </div>
            <div className="border-t border-border px-6 py-4">
              <button onClick={() => setOpen(null)} className="w-full rounded-xl bg-[var(--brand)] py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90">Bağla</button>
            </div>
          </div>
        </div>
      )}

  </div>);
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2 text-sm">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-right max-w-xs">{v}</dd>
    </div>
  );
}
