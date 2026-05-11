import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";

type Review = {
  id: string;
  product_slug: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

function Stars({ value, onChange, size = 18 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={!onChange}
            onMouseEnter={() => onChange && setHover(n)}
            onMouseLeave={() => onChange && setHover(0)}
            onClick={() => onChange?.(n)}
            className={onChange ? "cursor-pointer" : "cursor-default"}
            aria-label={`${n} ulduz`}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ProductReviews({ productSlug }: { productSlug: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_slug", productSlug)
      .order("created_at", { ascending: false });
    if (!error && data) setReviews(data as Review[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [productSlug]);

  useEffect(() => {
    if (user?.email && !name) {
      setName(user.user_metadata?.full_name || user.email.split("@")[0]);
    }
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error("Rəy yazmaq üçün hesaba daxil olun");
    if (!rating) return toast.error("Ulduz reytinqi seçin");
    if (!comment.trim() || !name.trim()) return toast.error("Ad və şərh tələb olunur");
    setSubmitting(true);
    const { error } = await supabase.from("product_reviews").insert({
      product_slug: productSlug,
      user_id: user.id,
      author_name: name.trim(),
      rating,
      comment: comment.trim(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Rəyiniz əlavə olundu");
    setComment("");
    setRating(0);
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Rəy silindi");
    setReviews((r) => r.filter((x) => x.id !== id));
  }

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <section className="mt-14 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-2xl font-bold">Müştəri rəyləri</h2>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
        {/* Summary */}
        <div className="rounded-xl bg-secondary/40 p-5 text-center">
          <div className="text-5xl font-black">{avg.toFixed(1)}</div>
          <div className="mt-2 flex justify-center"><Stars value={Math.round(avg)} size={20} /></div>
          <p className="mt-2 text-sm text-muted-foreground">{reviews.length} rəy</p>
          <div className="mt-4 space-y-1.5">
            {dist.map((d) => {
              const pct = reviews.length ? (d.count / reviews.length) * 100 : 0;
              return (
                <div key={d.n} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted-foreground">{d.n}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form + list */}
        <div>
          {user ? (
            <form onSubmit={submit} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold">Reytinginiz:</span>
                <Stars value={rating} onChange={setRating} />
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınız"
                className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Məhsul haqqında fikrinizi yazın..."
                rows={3}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="mt-3 rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Göndərilir..." : "Rəy göndər"}
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Rəy yazmaq üçün <Link to="/kabinet" className="font-semibold text-[var(--brand)]">hesaba daxil olun</Link>.
            </div>
          )}

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Yüklənir...</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hələ rəy yoxdur. İlk rəyi siz yazın!</p>
            ) : (
              reviews.map((r) => (
                <article key={r.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{r.author_name}</span>
                        <Stars value={r.rating} size={14} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("az-AZ", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    {user?.id === r.user_id && (
                      <button
                        onClick={() => remove(r.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
