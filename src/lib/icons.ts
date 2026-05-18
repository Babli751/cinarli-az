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
  Thermometer,
  Droplets,
  Settings,
  Grid3x3,
  Store,
} from "lucide-react";

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Technology & Electronics
  telefon: Smartphone,
  telefonveaksesuarlar: Smartphone,
  telefonaksesuarlari: Smartphone,
  aksesuarlar: ShoppingBag,
  tv: Tv,
  tvveaudio: Music,
  tvvaudio: Music,
  audio: Music,
  kamera: Camera,
  foto: Camera,
  fototeknka: Camera,
  fototeknkası: Camera,
  fotosexnika: Camera,
  komputer: Laptop,
  laptop: Laptop,
  planset: Laptop,
  notebook: Laptop,
  notbukyplansetvekomputerteknkası: Laptop,
  notbukplansetvekomputertexnikasi: Laptop,

  // HVAC & Cooling
  kondisioner: Thermometer,
  kombi: Settings,
  kombisistemlleri: Settings,
  kombisitemeri: Settings,
  sistemleri: Settings,
  radiatorlar: Thermometer,
  ssuqizdiryci: Droplets,
  suqizdiryci: Droplets,
  kalonkalar: Droplets,

  // Large Home Appliances
  boyukmeisetexnikası: Zap,
  boyukmeisetexnikasi: Zap,

  // Small Home Appliances
  kicmeisetexnikası: Zap,
  kicmeisetexnikasi: Zap,

  // Home & Furniture
  mebel: Sofa,
  mebeldunyasi: Sofa,
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

  // General & Categories
  topdansatis: Store,
  energiya: Zap,
  texnika: Package,
  mehsullar: Package,
  elektronikamehsullari: Zap,
  elektronika: Zap,
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
