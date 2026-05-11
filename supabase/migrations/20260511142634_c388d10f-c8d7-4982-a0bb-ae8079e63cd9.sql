CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_reviews_slug ON public.product_reviews(product_slug);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reviews" ON public.product_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users create reviews" ON public.product_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own reviews" ON public.product_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage reviews" ON public.product_reviews
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));