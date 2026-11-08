import {
  Banknote,
  Bell,
  Bus,
  CalendarDays,
  Cat,
  ChartColumn,
  Check,
  Coffee,
  Coins,
  Copy,
  CreditCard,
  Delete,
  Droplet,
  Gift,
  Globe,
  House,
  Landmark,
  LayoutList,
  Menu,
  Minus,
  Moon,
  NotebookPen,
  Pencil,
  Pin,
  Plus,
  Receipt,
  Calculator,
  Search,
  ShoppingCart,
  Shirt,
  Smartphone,
  Sparkles,
  Target,
  Trash2,
  Utensils,
  Wallet,
  X,
  Zap,
  Clock,
  LogOut,
  Camera,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Tab } from '@/lib/types'

export type IconC = ComponentType<LucideProps>

/** Ayarlar simgesi: eski tasarımdaki güneş benzeri dişli */
export const GearSun: IconC = (p) => (
  <svg viewBox="0 0 24 24" width={p.size ?? 24} height={p.size ?? 24} fill="none" stroke="currentColor" strokeWidth={p.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden>
    <path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
  </svg>
)

export const I = {
  home: House,
  wallet: Wallet,
  receipt: Receipt,
  cart: ShoppingCart,
  coins: Coins,
  card: CreditCard,
  cal: CalendarDays,
  chart: ChartColumn,
  bell: Bell,
  target: Target,
  search: Search,
  gear: GearSun,
  menu: Menu,
  moon: Moon,
  out: LogOut,
  note: NotebookPen,
  calc: Calculator,
  x: X,
  plus: Plus,
  minus: Minus,
  check: Check,
  copy: Copy,
  trash: Trash2,
  pencil: Pencil,
  pin: Pin,
  back: Delete,
  clock: Clock,
  party: Gift,
  spark: Sparkles,
  cam: Camera,
  list: LayoutList,
  left: ChevronLeft,
  right: ChevronRight,
  bag: Briefcase,
} satisfies Record<string, IconC>

export type IconName = keyof typeof I

export const TABS: { id: Tab; icon: IconName; label: string }[] = [
  { id: 'home', icon: 'home', label: 'Ana' },
  { id: 'inc', icon: 'wallet', label: 'Gelir' },
  { id: 'fx', icon: 'receipt', label: 'Giderler' },
  { id: 'dly', icon: 'cart', label: 'Günlük' },
  { id: 'inv', icon: 'coins', label: 'Yatırım' },
  { id: 'crd', icon: 'card', label: 'Kredi Kartları' },
  { id: 'cal', icon: 'cal', label: 'Takvim' },
  { id: 'cht', icon: 'chart', label: 'Grafik' },
  { id: 'not', icon: 'bell', label: 'Bildirim' },
  { id: 'tx', icon: 'search', label: 'Hareket' },
  { id: 'gol', icon: 'target', label: 'Hedefler' },
  { id: 'set', icon: 'gear', label: 'Ayarlar' },
]
export const MAIN: Tab[] = ['home', 'dly', 'crd', 'cal']

const CAT: [string, IconC][] = [
  ['market', ShoppingCart],
  ['yemek', Utensils],
  ['kahvalt', Coffee],
  ['yol', Bus],
  ['kıyafet', Shirt],
  ['elektrik', Zap],
  ['kira', House],
  ['telefon', Smartphone],
  ['internet', Globe],
  ['kedi', Cat],
  ['kredi', Landmark],
  ['genel', Receipt],
  ['su', Droplet],
]
export const catIcon = (c: string): IconC => {
  const l = c.toLocaleLowerCase('tr')
  return CAT.find(([k]) => l.includes(k))?.[1] ?? Banknote
}
export function Ico({ n, size = 18, className }: { n: IconName; size?: number; className?: string }) {
  const C = I[n]
  return <C size={size} className={className} aria-hidden />
}
