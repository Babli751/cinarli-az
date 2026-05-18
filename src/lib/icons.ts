import {
  Smartphone,
  Zap,
  Tv,
  Camera,
  Laptop,
  Home,
  Sofa,
  Bike,
  Dumbbell,
  Car,
  ShoppingBag,
  Utensils,
  Watch,
  Gamepad2,
  Music,
  BookOpen,
  Package,
} from "lucide-react";

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Technology & Electronics
  telefon: Smartphone,
  telefonveaksesuarlar: Smartphone,
  aksesuarlar: ShoppingBag,
  tv: Tv,
  audio: Music,
  kamera: Camera,
  foto: Camera,
  fototeknka: Camera,
  fototeknkası: Camera,
  komputer: Laptop,
  laptop: Laptop,
  planset: Laptop,
  notebook: Laptop,
  notbukyplansetvekomputerteknkası: Laptop,

  // Large Home Appliances
  boyukmeisetexnikası: Zap,
  boyukmeisetexnikasi: Zap,

  // Small Home Appliances
  kicmeisetexnikası: Zap,
  kicmeisetexnikasi: Zap,

  // Home & Furniture
  mebel: Sofa,
  mebeller: Sofa,
  mebellervetekinil: Sofa,
  tekstil: Home,
  ev: Home,
  evuygunnmehsullar: Home,
  mutfak: Utensils,
  oturacak: Sofa,
  yatak: Sofa,

  // Health & Sports
  idman: Dumbbell,
  idmanvesaglamlik: Dumbbell,
  saglamlik: Dumbbell,
  sports: Dumbbell,

  // Transportation & Mobility
  avtomobil: Car,
  automobilucunmehsullar: Car,
  velosped: Bike,
  naqliyyat: Bike,
  naqliyyatveeylence: Bike,

  // Entertainment & Gaming
  oyun: Gamepad2,
  eglence: Gamepad2,

  // General
  energiya: Zap,
  texnika: Package,
  mehsullar: Package,
  divanlar: Sofa,
  topdag: ShoppingBag,
};

export function getCategoryIcon(categoryName: string): React.ComponentType<{ className?: string }> {
  const key = categoryName
    .toLowerCase()
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ç/g, "c")
    .replace(/\s+/g, "");

  return iconMap[key] || Package;
}
