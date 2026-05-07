
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

INSERT INTO public.categories (slug, name, icon, description) VALUES
('divanlar','Divanlar','🛋️','Künc, düz və açılan divanlar'),
('carpayilar','Çarpayılar','🛏️','Tək, ikinəfərlik və uşaq çarpayıları'),
('masalar','Masalar','🪟','Yemək, jurnal və iş masaları'),
('stullar','Stullar','🪑','Yemək, bar və ofis stulları'),
('skaflar','Şkaflar','🚪','Geyim, sürüşkən və kitab şkafları'),
('kreslolar','Kreslolar','💺','Ofis və istirahət kreslolar'),
('yumsaq-mebel','Yumşaq mebel','🛋️','Puflar, açılan divanlar'),
('usaq-otagi','Uşaq otağı','🧸','Uşaq mebel dəstləri'),
('matraslar','Matraslar','🛌','Ortopedik və yay matraslar'),
('yemek-otagi','Yemək otağı','🍽️','Yemək masası dəstləri'),
('ofis-mebel','Ofis mebeli','🖥️','İş masaları, ofis kreslolar'),
('bag-mebel','Bağ mebeli','🌿','Terras və bağ mebel dəstləri'),
('isiqlandirma','İşıqlandırma','💡','Çilçıraqlar, lampalar'),
('xalcalar','Xalçalar','🧶','Klassik və modern xalçalar'),
('dekor','Dekor','🖼️','Vazalar, güzgülər, tablolar'),
('tekstil','Tekstil','🧵','Pərdələr, yataq dəstləri')
ON CONFLICT (slug) DO NOTHING;
