import sofa from "@/assets/p-sofa.jpg";
import bed from "@/assets/p-bed.jpg";
import dining from "@/assets/p-dining.jpg";
import chair from "@/assets/p-chair.jpg";
import wardrobe from "@/assets/p-wardrobe.jpg";
import armchair from "@/assets/p-armchair.jpg";
import mattress from "@/assets/p-mattress.jpg";
import office from "@/assets/p-office.jpg";
import coffee from "@/assets/p-coffee.jpg";
import kids from "@/assets/p-kids.jpg";
import garden from "@/assets/p-garden.jpg";
import light from "@/assets/p-light.jpg";
import rug from "@/assets/p-rug.jpg";
import decor from "@/assets/p-decor.jpg";
import textile from "@/assets/p-textile.jpg";
import tv from "@/assets/p-tv.jpg";

export type Product = {
  name: string;
  price: number;
  old: number;
  discount: number;
  img: string; // emoji fallback
  image: string; // real photo
  category: string;
};

export type Category = {
  slug: string;
  name: string;
  icon: string;
  image: string;
  description: string;
};

export const categories: Category[] = [
  { slug: "divanlar", name: "Divanlar", icon: "🛋️", image: sofa, description: "Künc, düz və açılan divanlar" },
  { slug: "carpayilar", name: "Çarpayılar", icon: "🛏️", image: bed, description: "Tək, ikinəfərlik və uşaq çarpayıları" },
  { slug: "masalar", name: "Masalar", icon: "🪟", image: coffee, description: "Yemək, jurnal və iş masaları" },
  { slug: "stullar", name: "Stullar", icon: "🪑", image: chair, description: "Yemək, bar və ofis stulları" },
  { slug: "skaflar", name: "Şkaflar", icon: "🚪", image: wardrobe, description: "Geyim, sürüşkən və kitab şkafları" },
  { slug: "kreslolar", name: "Kreslolar", icon: "💺", image: armchair, description: "Ofis və istirahət kreslolar" },
  { slug: "yumsaq-mebel", name: "Yumşaq mebel", icon: "🛋️", image: sofa, description: "Puflar, açılan divanlar" },
  { slug: "usaq-otagi", name: "Uşaq otağı", icon: "🧸", image: kids, description: "Uşaq mebel dəstləri" },
  { slug: "matraslar", name: "Matraslar", icon: "🛌", image: mattress, description: "Ortopedik və yay matraslar" },
  { slug: "yemek-otagi", name: "Yemək otağı", icon: "🍽️", image: dining, description: "Yemək masası dəstləri, bufetlər" },
  { slug: "ofis-mebel", name: "Ofis mebeli", icon: "🖥️", image: office, description: "İş masaları, ofis kreslolar" },
  { slug: "bag-mebel", name: "Bağ mebeli", icon: "🌿", image: garden, description: "Terras və bağ mebel dəstləri" },
  { slug: "isiqlandirma", name: "İşıqlandırma", icon: "💡", image: light, description: "Çilçıraqlar, döşəmə və masaüstü lampalar" },
  { slug: "xalcalar", name: "Xalçalar", icon: "🧶", image: rug, description: "Klassik və modern xalçalar" },
  { slug: "dekor", name: "Dekor", icon: "🖼️", image: decor, description: "Vazalar, güzgülər, tablolar" },
  { slug: "tekstil", name: "Tekstil", icon: "🧵", image: textile, description: "Pərdələr, yataq dəstləri, yastıqlar" },
];

export const products: Product[] = [
  { name: "Künc divan Milano", price: 1899, old: 2199, discount: 14, img: "🛋️", image: sofa, category: "divanlar" },
  { name: "Üçnəfərlik divan Roma", price: 1499, old: 1799, discount: 17, img: "🛋️", image: sofa, category: "divanlar" },
  { name: "Açılan divan Bern", price: 1299, old: 1499, discount: 13, img: "🛋️", image: sofa, category: "yumsaq-mebel" },
  { name: "Puf Soft Cube", price: 149, old: 199, discount: 25, img: "🟫", image: armchair, category: "yumsaq-mebel" },
  { name: "İkinəfərlik çarpayı Oslo", price: 2499, old: 2799, discount: 11, img: "🛏️", image: bed, category: "carpayilar" },
  { name: "Təknəfərlik çarpayı Nord", price: 899, old: 1099, discount: 18, img: "🛏️", image: bed, category: "carpayilar" },
  { name: "Yemək masası dəsti", price: 849, old: 999, discount: 15, img: "🪑", image: dining, category: "yemek-otagi" },
  { name: "Bufet Vintage", price: 1099, old: 1349, discount: 19, img: "🍽️", image: wardrobe, category: "yemek-otagi" },
  { name: "Jurnal masası", price: 249, old: 299, discount: 17, img: "🪟", image: coffee, category: "masalar" },
  { name: "Geyim şkafı 4 qapılı", price: 1299, old: 1599, discount: 19, img: "🚪", image: wardrobe, category: "skaflar" },
  { name: "Sürüşkən şkaf Loft", price: 1599, old: 1899, discount: 16, img: "🚪", image: wardrobe, category: "skaflar" },
  { name: "Ofis kresloları", price: 399, old: 449, discount: 11, img: "💺", image: armchair, category: "kreslolar" },
  { name: "Rahatlıq kresloları Premium", price: 699, old: 849, discount: 18, img: "💺", image: armchair, category: "kreslolar" },
  { name: "TV altlığı modul", price: 599, old: 749, discount: 20, img: "📺", image: tv, category: "masalar" },
  { name: "Kitab rəfi", price: 449, old: 529, discount: 15, img: "📚", image: wardrobe, category: "skaflar" },
  { name: "Yemək stulu (4 ədəd)", price: 349, old: 419, discount: 17, img: "🪑", image: chair, category: "stullar" },
  { name: "Bar stulu Nordic", price: 199, old: 249, discount: 20, img: "🪑", image: chair, category: "stullar" },
  { name: "Uşaq çarpayısı Mini", price: 549, old: 649, discount: 15, img: "🛏️", image: kids, category: "usaq-otagi" },
  { name: "Uşaq iş masası", price: 299, old: 379, discount: 21, img: "🪑", image: kids, category: "usaq-otagi" },
  { name: "Ortopedik matras Comfort", price: 599, old: 799, discount: 25, img: "🛌", image: mattress, category: "matraslar" },
  { name: "Yay matrası Classic", price: 399, old: 499, discount: 20, img: "🛌", image: mattress, category: "matraslar" },
  { name: "Memory Foam matras", price: 899, old: 1199, discount: 25, img: "🛌", image: mattress, category: "matraslar" },
  { name: "İş masası Executive", price: 749, old: 899, discount: 17, img: "🖥️", image: office, category: "ofis-mebel" },
  { name: "Konferans masası", price: 1499, old: 1799, discount: 17, img: "🖥️", image: office, category: "ofis-mebel" },
  { name: "Sənəd şkafı", price: 549, old: 649, discount: 15, img: "🗄️", image: wardrobe, category: "ofis-mebel" },
  { name: "Bağ dəsti Rattan", price: 1299, old: 1599, discount: 19, img: "🌿", image: garden, category: "bag-mebel" },
  { name: "Şezlonq Sun", price: 449, old: 549, discount: 18, img: "🌞", image: garden, category: "bag-mebel" },
  { name: "Bağ stol-stul dəsti", price: 699, old: 849, discount: 18, img: "🌳", image: garden, category: "bag-mebel" },
  { name: "Çilçıraq Crystal", price: 549, old: 699, discount: 21, img: "💡", image: light, category: "isiqlandirma" },
  { name: "Döşəmə lampası Loft", price: 199, old: 249, discount: 20, img: "🪔", image: light, category: "isiqlandirma" },
  { name: "Masaüstü lampa LED", price: 89, old: 119, discount: 25, img: "💡", image: light, category: "isiqlandirma" },
  { name: "Yun xalça 200x300", price: 599, old: 799, discount: 25, img: "🧶", image: rug, category: "xalcalar" },
  { name: "Modern xalça Geo", price: 349, old: 449, discount: 22, img: "🧶", image: rug, category: "xalcalar" },
  { name: "Divar güzgüsü", price: 199, old: 249, discount: 20, img: "🪞", image: decor, category: "dekor" },
  { name: "Dekorativ vaza dəsti", price: 129, old: 169, discount: 23, img: "🏺", image: decor, category: "dekor" },
  { name: "Tablo Abstract (3 hissəli)", price: 249, old: 319, discount: 22, img: "🖼️", image: decor, category: "dekor" },
  { name: "Yataq dəsti Premium Cotton", price: 149, old: 199, discount: 25, img: "🧵", image: textile, category: "tekstil" },
  { name: "Pərdə dəsti Velvet", price: 299, old: 399, discount: 25, img: "🪟", image: textile, category: "tekstil" },
  { name: "Dekorativ yastıqlar (4 ədəd)", price: 79, old: 109, discount: 27, img: "🛋️", image: textile, category: "tekstil" },
];
