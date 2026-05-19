import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Stats, type Order, type PageViewStats } from "@/lib/api";
import { Package, ShoppingBag, Users, TrendingUp, Clock, Eye, BarChart2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const STATUS_AZ: Record<string, string> = {
  pending: "Gözləyir", confirmed: "Təsdiqləndi",
  shipped: "Göndərildi", delivered: "Çatdırıldı", cancelled: "Ləğv",
};

function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, users: 0, revenue: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pv, setPv] = useState<PageViewStats | null>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
    api.getOrders().then((o) => setRecentOrders(o.slice(0, 8))).catch(() => {});
    api.getPageViews().then(setPv).catch(() => {});
  }, []);

  const cards = [
    { label: "Məhsullar", value: stats.products, icon: Package, color: "bg-blue-50 text-blue-600", link: "/admin/mehsullar" },
    { label: "Sifarişlər", value: stats.orders, icon: ShoppingBag, color: "bg-orange-50 text-orange-600", link: "/admin/sifarisler" },
    { label: "Gözləyən", value: stats.pending, icon: Clock, color: "bg-yellow-50 text-yellow-600", link: "/admin/sifarisler" },
    { label: "İstifadəçilər", value: stats.users, icon: Users, color: "bg-purple-50 text-purple-600", link: "/admin/istifadeciler" },
  ];

  return (<div>

      <div className="mb-8">
        <h1 className="text-2xl font-black md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Çınarlı idarəetmə paneli</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.link as any} className="rounded-2xl border border-border bg-background p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex rounded-xl p-2.5 ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-3xl font-black">{c.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-green-50 p-2.5 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Ümumi gəlir</div>
              <div className="text-2xl font-black md:text-3xl">{stats.revenue.toFixed(2)} ₼</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-sky-50 p-2.5 text-sky-600">
              <Eye className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Ziyarətçilər</div>
              <div className="text-2xl font-black md:text-3xl">{pv?.todayUnique ?? "—"}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                bu gün · <span className="font-semibold text-foreground">{pv?.weekUnique ?? "—"}</span> həftə · <span className="font-semibold text-foreground">{pv?.totalUnique ?? "—"}</span> cəmi
              </div>
            </div>
          </div>
        </div>
      </div>

      {pv && (pv.topPages.length > 0 || pv.topCountries.length > 0) && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pv.topPages.length > 0 && (
            <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-bold text-sm">Ən çox baxılan səhifələr (7 gün)</h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {pv.topPages.map((p, i) => (
                    <tr key={p.path} className="border-t border-border first:border-0 hover:bg-secondary/20">
                      <td className="px-5 py-2 w-7 text-muted-foreground font-mono text-xs">{i + 1}</td>
                      <td className="px-2 py-2 font-medium text-[var(--brand)] truncate max-w-[160px]">{p.path}</td>
                      <td className="px-5 py-2 text-right font-bold">{p.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pv.topCountries.length > 0 && (
            <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-bold text-sm">Ölkələr üzrə ziyarətçilər (7 gün)</h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {pv.topCountries.map((c, i) => (
                    <tr key={c.country} className="border-t border-border first:border-0 hover:bg-secondary/20">
                      <td className="px-5 py-2 w-7 text-muted-foreground font-mono text-xs">{i + 1}</td>
                      <td className="px-2 py-2 font-medium flex items-center gap-2">
                        <img src={`https://flagcdn.com/20x15/${c.country_code.toLowerCase()}.png`} alt={c.country_code} className="h-3.5 w-5 object-cover rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        {c.country}
                      </td>
                      <td className="px-5 py-2 text-right font-bold">{c.visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-background shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-bold">Son sifarişlər</h2>
          <Link to="/admin/sifarisler" className="text-sm text-[var(--brand)] hover:underline">Hamısını gör →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Hələ sifariş yoxdur</div>
        ) : (
          <table className="w-full min-w-[500px] text-sm">
            <thead className="bg-secondary/40 text-left text-xs text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Müştəri</th>
                <th className="px-6 py-3">Məbləğ</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Tarix</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="px-6 py-3 text-muted-foreground">#{o.id}</td>
                  <td className="px-6 py-3 font-medium">{o.customer_name}</td>
                  <td className="px-6 py-3 font-bold">{o.total} ₼</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status] ?? "bg-secondary"}`}>
                      {STATUS_AZ[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{new Date(o.created_at!).toLocaleDateString("az-AZ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

  </div>);
}
