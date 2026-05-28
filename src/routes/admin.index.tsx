import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Stats, type Order, type PageViewStats } from "@/lib/api";
import {
  Package, ShoppingBag, Users, TrendingUp, Clock, Eye, BarChart2,
  Smartphone, Monitor, Tablet, Globe, UserPlus, ShoppingCart, Percent,
} from "lucide-react";

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

function MiniBar({ values, color = "var(--brand)" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-px h-10">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${Math.max((v / max) * 100, v > 0 ? 4 : 0)}%`, backgroundColor: color, opacity: v > 0 ? 0.85 : 0.15 }} />
      ))}
    </div>
  );
}

function SparkLine({ values, color = "var(--brand)" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 100, h = 32;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8 overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

  const deviceTotal = pv ? (pv.devices.mobile + pv.devices.tablet + pv.devices.desktop) || 1 : 1;
  const hourLabels = ["00","03","06","09","12","15","18","21"];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Çınarlı idarəetmə paneli</p>
      </div>

      {/* Main KPI cards */}
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

      {/* Revenue + Visitors row */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-green-50 p-2.5 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Ümumi gəlir</div>
              <div className="text-2xl font-black">{stats.revenue.toFixed(0)} ₼</div>
              {pv && pv.monthlyRevenue.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">30 günlük trend</div>
              )}
            </div>
          </div>
          {pv && pv.monthlyRevenue.length > 0 && (
            <div className="mt-2">
              <SparkLine values={pv.monthlyRevenue.map(r => r.revenue)} color="#16a34a" />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-sky-50 p-2.5 text-sky-600">
              <Eye className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Unikal ziyarətçi</div>
              <div className="text-2xl font-black">{pv?.todayUnique ?? "—"}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                bu gün · <span className="font-semibold text-foreground">{pv?.weekUnique ?? "—"}</span> həftə · <span className="font-semibold text-foreground">{pv?.totalUnique ?? "—"}</span> cəmi
              </div>
            </div>
          </div>
        </div>

        {/* Azerbaijan card */}
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden border border-border flex-shrink-0">
              <img src="https://flagcdn.com/40x30/az.png" alt="AZ" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Azərbaycandan ziyarətçi</div>
              <div className="text-2xl font-black">{pv?.azToday ?? "—"}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                bu gün · <span className="font-semibold text-foreground">{pv?.azWeek ?? "—"}</span> həftə · <span className="font-semibold text-foreground">{pv?.azTotal ?? "—"}</span> cəmi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly traffic + Device breakdown */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Hourly chart */}
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-bold text-sm">Bu günkü trafik (saatlıq)</h2>
          </div>
          {pv ? (
            <>
              <div className="flex items-end gap-0.5 h-14">
                {pv.hourly.map((v, i) => {
                  const max = Math.max(...pv.hourly, 1);
                  const now = new Date().getHours();
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{
                          height: `${Math.max((v / max) * 48, v > 0 ? 3 : 0)}px`,
                          backgroundColor: i === now ? "var(--accent-orange)" : "var(--brand)",
                          opacity: v > 0 ? 0.85 : 0.12,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                {hourLabels.map(l => <span key={l}>{l}</span>)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Narıncı sütun — cari saat. Cəmi bu gün: <span className="font-semibold text-foreground">{pv.todayViews}</span> görüntülənmə
              </div>
            </>
          ) : (
            <div className="h-14 flex items-center justify-center text-sm text-muted-foreground">Yüklənir...</div>
          )}
        </div>

        {/* Device breakdown */}
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-bold text-sm">Cihaz növü (7 gün)</h2>
          </div>
          {pv ? (
            <div className="space-y-3">
              {[
                { label: "Desktop", count: pv.devices.desktop, icon: Monitor, color: "bg-blue-500" },
                { label: "Mobil", count: pv.devices.mobile, icon: Smartphone, color: "bg-[var(--brand)]" },
                { label: "Tablet", count: pv.devices.tablet, icon: Tablet, color: "bg-purple-500" },
              ].map(({ label, count, icon: Icon, color }) => {
                const pct = Math.round((count / deviceTotal) * 100);
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {label}
                      </div>
                      <span className="text-sm font-semibold">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Yüklənir...</div>
          )}
        </div>
      </div>

      {/* Extra KPIs row */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="mt-3 text-3xl font-black">{pv?.newUsersToday ?? "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">Yeni üzv bu gün</div>
          <div className="mt-0.5 text-xs text-muted-foreground">həftə: <span className="font-semibold text-foreground">{pv?.newUsersWeek ?? "—"}</span></div>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="inline-flex rounded-xl bg-orange-50 p-2.5 text-orange-600">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="mt-3 text-3xl font-black">{pv?.ordersWeek ?? "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">Sifariş bu həftə</div>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="inline-flex rounded-xl bg-pink-50 p-2.5 text-pink-600">
            <Percent className="h-5 w-5" />
          </div>
          <div className="mt-3 text-3xl font-black">{pv?.conversionRate ?? "—"}%</div>
          <div className="mt-1 text-xs text-muted-foreground">Konversiya (7 gün)</div>
          <div className="mt-0.5 text-xs text-muted-foreground">sifariş / ziyarətçi</div>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="inline-flex rounded-xl bg-sky-50 p-2.5 text-sky-600">
            <Globe className="h-5 w-5" />
          </div>
          <div className="mt-3 text-3xl font-black">{pv ? pv.topCountries.length : "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">Ölkə (7 gün)</div>
        </div>
      </div>

      {/* Daily traffic sparkline */}
      {pv && pv.daily.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-bold text-sm">Günlük trafik (7 gün)</h2>
            </div>
            <span className="text-xs text-muted-foreground">{pv.weekViews} görüntülənmə</span>
          </div>
          <MiniBar values={pv.daily.map(d => d.total)} />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            {pv.daily.map(d => <span key={d.date}>{d.date.slice(5)}</span>)}
          </div>
        </div>
      )}

      {/* Top pages + Countries */}
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
                <Globe className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-bold text-sm">Ölkələr üzrə ziyarətçilər (7 gün)</h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {pv.topCountries.map((ct, i) => {
                    const pct = Math.round((ct.visitors / (pv.weekUnique || 1)) * 100);
                    return (
                      <tr key={ct.country} className="border-t border-border first:border-0 hover:bg-secondary/20">
                        <td className="px-5 py-2 w-7 text-muted-foreground font-mono text-xs">{i + 1}</td>
                        <td className="px-2 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            <img src={`https://flagcdn.com/20x15/${ct.country_code.toLowerCase()}.png`} alt={ct.country_code} className="h-3.5 w-5 object-cover rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            {ct.country}
                            {ct.country_code === "AZ" && <span className="rounded-full bg-[var(--brand)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--brand)]">əsas</span>}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1 flex-1 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-right font-bold">{ct.visitors}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Recent orders */}
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
    </div>
  );
}
