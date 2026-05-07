import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sifarisler")({
  component: OrdersAdmin,
});

type Order = {
  id: string; customer_name: string; phone: string; address: string | null;
  total: number; status: string; items: any; notes: string | null; created_at: string;
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function OrdersAdmin() {
  const [items, setItems] = useState<Order[]>([]);
  const [open, setOpen] = useState<Order | null>(null);

  const load = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setItems((data as Order[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status yeniləndi");
    load();
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black">Sifarişlər</h1>
      <p className="text-muted-foreground">{items.length} sifariş</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <th className="px-4 py-3">Tarix</th>
              <th className="px-4 py-3">Müştəri</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Məbləğ</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sifariş yoxdur</td></tr>
            ) : items.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3">{new Date(o.created_at).toLocaleDateString("az-AZ")}</td>
                <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                <td className="px-4 py-3">{o.phone}</td>
                <td className="px-4 py-3 font-bold">{o.total} ₼</td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}
                    className="rounded border border-border bg-background px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setOpen(o)} className="text-[var(--brand)] hover:underline">Bax</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold">Sifariş detalları</h2>
            <dl className="space-y-2 text-sm">
              <Row k="Müştəri" v={open.customer_name} />
              <Row k="Telefon" v={open.phone} />
              <Row k="Ünvan" v={open.address ?? "—"} />
              <Row k="Məbləğ" v={`${open.total} ₼`} />
              <Row k="Status" v={open.status} />
              <Row k="Qeydlər" v={open.notes ?? "—"} />
            </dl>
            <div className="mt-4">
              <div className="mb-2 font-semibold">Məhsullar:</div>
              <pre className="max-h-60 overflow-auto rounded bg-secondary p-3 text-xs">{JSON.stringify(open.items, null, 2)}</pre>
            </div>
            <button onClick={() => setOpen(null)} className="mt-4 w-full rounded-lg bg-[var(--brand)] py-2 font-semibold text-[var(--brand-foreground)]">Bağla</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b border-border pb-1"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>;
}
