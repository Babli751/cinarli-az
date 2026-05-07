import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Package, Tag, ShoppingBag, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, categories: 0, orders: 0, users: 0 });

  useEffect(() => {
    (async () => {
      const [p, c, o, u] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        products: p.count ?? 0,
        categories: c.count ?? 0,
        orders: o.count ?? 0,
        users: u.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Məhsullar", value: stats.products, icon: Package, color: "var(--brand)" },
    { label: "Kateqoriyalar", value: stats.categories, icon: Tag, color: "var(--accent-orange)" },
    { label: "Sifarişlər", value: stats.orders, icon: ShoppingBag, color: "var(--brand)" },
    { label: "İstifadəçilər", value: stats.users, icon: Users, color: "var(--accent-orange)" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">MebelMart idarəetmə paneli</p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className="h-5 w-5" style={{ color: c.color }} />
            </div>
            <div className="mt-3 text-3xl font-black">{c.value}</div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
