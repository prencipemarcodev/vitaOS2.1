import { 
  Banknote, Laptop, Gift, RefreshCcw, TreePine, Sun, Clipboard,
  Home, Utensils, Car, Heart, Dumbbell, Shirt, Film, Zap, Tv, PiggyBank,
  Target, ShoppingCart, Coffee, GraduationCap, Briefcase, Plane,
  Users, Music, Palette, Camera, Smartphone, HardDrive, Cpu, 
  Wallet, TrendingUp, Landmark, ShieldCheck, HelpCircle, CreditCard
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
  HelpCircle,
  CreditCard
}

export const ICON_OPTIONS = Object.keys(ICON_MAP)

const EMOJI_TO_NAME = {
  '💰': 'Banknote',
  '💻': 'Laptop',
  '🎁': 'Gift',
  '🔄': 'RefreshCcw',
  '🎄': 'TreePine',
  '☀️': 'Sun',
  '📋': 'Clipboard',
  '🏠': 'Home',
  '🍔': 'Utensils',
  '🚗': 'Car',
  '❤️': 'Heart',
  '🏋️': 'Dumbbell',
  '👕': 'Shirt',
  '🎬': 'Film',
  '⚡': 'Zap',
  '📺': 'Tv',
  '🐷': 'PiggyBank',
  '🎯': 'Target',
  '✈️': 'Plane',
  '🛡️': 'ShieldCheck'
}

/**
 * Ritorna il componente icona o un fallback (HelpCircle)
 */
export function getIcon(nameOrEmoji) {
  const name = EMOJI_TO_NAME[nameOrEmoji] || nameOrEmoji
  const Icon = ICON_MAP[name] || HelpCircle
  return Icon
}
