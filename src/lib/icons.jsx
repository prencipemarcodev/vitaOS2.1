import { 
  Banknote, Laptop, Gift, RefreshCcw, TreePine, Sun, Clipboard,
  Home, Utensils, Car, Heart, Dumbbell, Shirt, Film, Zap, Tv, PiggyBank,
  Target, ShoppingCart, Coffee, GraduationCap, Briefcase, Plane,
  Users, Music, Palette, Camera, Smartphone, HardDrive, Cpu, 
  Wallet, TrendingUp, Landmark, ShieldCheck, HelpCircle
} from 'lucide-react'

export const ICON_MAP = {
  // Entrate
  Banknote,
  Laptop,
  Gift,
  RefreshCcw,
  TreePine,
  Sun,
  Clipboard,
  
  // Uscite
  Home,
  Utensils,
  Car,
  Heart,
  Dumbbell,
  Shirt,
  Film,
  Zap,
  Tv,
  PiggyBank,
  
  // Risparmi / Altro
  Target,
  ShoppingCart,
  Coffee,
  GraduationCap,
  Briefcase,
  Plane,
  Users,
  Music,
  Palette,
  Camera,
  Smartphone,
  HardDrive,
  Cpu,
  Wallet,
  TrendingUp,
  Landmark,
  ShieldCheck,
  HelpCircle
}

export const ICON_OPTIONS = Object.keys(ICON_MAP)

/**
 * Ritorna il componente icona o un fallback (HelpCircle)
 */
export function getIcon(name) {
  const Icon = ICON_MAP[name] || HelpCircle
  return Icon
}
