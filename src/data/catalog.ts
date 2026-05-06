export type Product = {
  name: string;
  price: number;
  old: number;
  discount: number;
  img: string;
  category: string; // slug
};

export const categories: { slug: string; name: string }[] = [
  { slug: "divanlar", name: "Divanlar" },
  { slug: "carpayilar", name: "Çarpayılar" },
  { slug: "masalar", name: "Masalar" },
  { slug: "stullar", name: "Stullar" },
  { slug: "skaflar", name: "Şkaflar" },
  { slug: "kreslolar", name: "Kreslolar" },
  { slug: "yumsaq-mebel", name: "Yumşaq mebel" },
  { slug: "usaq-otagi", name: "Uşaq otağı" },
];

export const products: Product[] = [
  { name: "Künc divan Milano", price: 1899, old: 2199, discount: 14, img: "🛋️", category: "divanlar" },
  { name: "Üçnəfərlik divan Roma", price: 1499, old: 1799, discount: 17, img: "🛋️", category: "divanlar" },
  { name: "Açılan divan Bern", price: 1299, old: 1499, discount: 13, img: "🛋️", category: "yumsaq-mebel" },
  { name: "İkinəfərlik çarpayı Oslo", price: 2499, old: 2799, discount: 11, img: "🛏️", category: "carpayilar" },
  { name: "Təknəfərlik çarpayı Nord", price: 899, old: 1099, discount: 18, img: "🛏️", category: "carpayilar" },
  { name: "Yemək masası dəsti", price: 849, old: 999, discount: 15, img: "🪑", category: "masalar" },
  { name: "Jurnal masası", price: 249, old: 299, discount: 17, img: "🪟", category: "masalar" },
  { name: "Geyim şkafı 4 qapılı", price: 1299, old: 1599, discount: 19, img: "🚪", category: "skaflar" },
  { name: "Sürüşkən şkaf Loft", price: 1599, old: 1899, discount: 16, img: "🚪", category: "skaflar" },
  { name: "Ofis kresloları", price: 399, old: 449, discount: 11, img: "💺", category: "kreslolar" },
  { name: "Rahatlıq kresloları Premium", price: 699, old: 849, discount: 18, img: "💺", category: "kreslolar" },
  { name: "TV altlığı modul", price: 599, old: 749, discount: 20, img: "📺", category: "masalar" },
  { name: "Kitab rəfi", price: 449, old: 529, discount: 15, img: "📚", category: "skaflar" },
  { name: "Yemək stulu (4 ədəd)", price: 349, old: 419, discount: 17, img: "🪑", category: "stullar" },
  { name: "Bar stulu Nordic", price: 199, old: 249, discount: 20, img: "🪑", category: "stullar" },
  { name: "Uşaq çarpayısı Mini", price: 549, old: 649, discount: 15, img: "🛏️", category: "usaq-otagi" },
  { name: "Uşaq iş masası", price: 299, old: 379, discount: 21, img: "🪑", category: "usaq-otagi" },
];
