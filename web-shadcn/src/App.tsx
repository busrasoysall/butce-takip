import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  Banknote,
  Bell,
  Bus,
  CalendarDays,
  Cat,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Coins,
  CreditCard,
  Droplet,
  Globe,
  House,
  Landmark,
  Menu,
  Plus,
  Receipt,
  Settings,
  Shirt,
  ShoppingCart,
  Smartphone,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { MONTHS, isDark, loadData, today, tl, totals } from '@/lib/budget'
import { cn } from '@/lib/utils'

type Icon = ComponentType<{ className?: string }>

// Eski uygulama sitenin kökünde (/). Prototipte olmayan sayfalar oraya gider.
const OLD = '/'

const NAV: { key: string; label: string; icon: Icon }[] = [
  { key: 'home', label: 'Ana', icon: House },
  { key: 'dly', label: 'Günlük', icon: ShoppingCart },
  { key: 'crd', label: 'Kartlar', icon: CreditCard },
  { key: 'cal', label: 'Takvim', icon: CalendarDays },
]

const CAT: [string, Icon][] = [
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
const catIcon = (c: string): Icon => (CAT.find(([k]) => c.toLowerCase().includes(k)) || [0, Banknote])[1] as Icon

function Header() {
  return (
    <header className="sticky top-0 z-20 -mx-3.5 mb-3 flex items-center gap-1.5 sm:gap-2 border-b border-border/60 bg-background/80 px-3.5 py-3 backdrop-blur-md">
      <nav
        aria-label="Sayfalar"
        className="flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-full border bg-card/90 p-1 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <a href={OLD} aria-label="Menü" title="Menü (eski uygulamada)" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8 shrink-0 rounded-full text-muted-foreground sm:size-9')}>
          <Menu className="size-[18px]" />
        </a>
        {NAV.map((n) =>
          n.key === 'home' ? (
            <span
              key={n.key}
              aria-current="page"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-bold text-primary-foreground shadow-sm sm:h-9 sm:px-3"
            >
              <n.icon className="size-[18px]" />
              {n.label}
            </span>
          ) : (
            <a
              key={n.key}
              href={OLD}
              aria-label={n.label}
              title={`${n.label} (eski uygulamada)`}
              className={cn(buttonVariants({ variant: 'ghost' }), 'h-8 min-w-8 shrink-0 gap-1.5 rounded-full px-1.5 text-xs font-bold text-muted-foreground sm:h-9 sm:px-2.5')}
            >
              <n.icon className="size-[18px]" />
              <span className="hidden sm:inline">{n.label}</span>
            </a>
          ),
        )}
      </nav>
      <Logo size={36} className="shrink-0 drop-shadow-md" />
      <div className="ml-auto flex shrink-0 gap-1 sm:gap-1.5">
        <a href={OLD} aria-label="Bildirimler" className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-8 rounded-xl sm:size-9')}>
          <Bell className="size-4" />
        </a>
        <a href={OLD} aria-label="Ayarlar" className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-8 rounded-xl sm:size-9')}>
          <Settings className="size-4" />
        </a>
      </div>
    </header>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2">
      <div className="truncate text-[11px] font-semibold text-white/75">{label}</div>
      <div className="truncate text-sm font-extrabold">{value}</div>
    </div>
  )
}

function Row({ label, hint, value, tone }: { label: string; hint?: string; value: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="min-w-0">
        {label}
        {hint && <small className="block text-xs text-muted-foreground">{hint}</small>}
      </span>
      <b className={cn('shrink-0 font-bold', tone === 'pos' && 'text-positive', tone === 'neg' && 'text-destructive')}>{value}</b>
    </div>
  )
}

export default function App() {
  const { name, data, demo } = useMemo(loadData, [])
  const [ym, setYm] = useState(today().slice(0, 7))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark())
  }, [])

  const all = totals(data, '')
  const m = totals(data, ym)
  const t = today()
  const todays = data.daily.filter((x) => x.d === t)
  const todaySum = todays.reduce((a, x) => a + x.a, 0)
  const spent = m.fx + m.dl + m.cp
  const base = data.lim || m.inc
  const ratio = base ? Math.min(100, (spent / base) * 100) : 0
  const tone =
    ratio > 90
      ? '[&_[data-slot=progress-indicator]]:bg-destructive'
      : ratio > 70
        ? '[&_[data-slot=progress-indicator]]:bg-gold'
        : '[&_[data-slot=progress-indicator]]:bg-positive'

  const shift = (n: number) => {
    const d = new Date(+ym.slice(0, 4), +ym.slice(5) - 1 + n, 1)
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const date = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="mx-auto w-full max-w-[560px] px-3.5 pb-28 lg:max-w-5xl">
      <Header />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">Prototip · shadcn/ui</Badge>
        <span>{demo ? 'Örnek veri gösteriliyor.' : 'Gerçek verin, salt okunur.'}</span>
        <a className="font-semibold text-primary underline-offset-4 hover:underline" href={OLD}>
          Eski uygulamaya dön
        </a>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gold text-lg font-extrabold text-[#0a1f33] shadow-md">
          {(name[0] || '?').toUpperCase()}
        </div>
        <div className="min-w-0">
          <small className="block truncate text-xs font-bold capitalize text-muted-foreground">{date}</small>
          <h1 className="truncate text-xl font-extrabold tracking-tight">Merhaba, {name}</h1>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
        <div className="space-y-3">
          <Card className="relative overflow-hidden border-0 bg-[linear-gradient(135deg,#0a1f33,#0b3b45_65%,#0f5f5b)] p-5 text-white ring-0 shadow-xl">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full border border-white/15 shadow-[0_0_0_30px_rgba(255,255,255,.03),0_0_0_60px_rgba(255,255,255,.02)]" />
            <div className="relative">
              <div className="text-sm font-bold text-white/80">Ana paran</div>
              <div className="my-1 break-words text-4xl font-extrabold tracking-tight text-[#ffe9a8]">{tl(all.bal)}</div>
              <p className="text-xs font-semibold text-white/80">
                {all.bal < 0
                  ? `Ana paran bitti, ${tl(-all.bal)} içeriden harcadın (borçtasın).`
                  : 'Tüm aylar toplamı, harcamalar buradan düşer.'}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Stat label="Gelir" value={tl(all.inc)} />
                <Stat label="Harcama" value={tl(all.fx + all.dl + all.cp)} />
                <Stat label="Yatırım" value={tl(all.iv)} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-base font-extrabold">
                <span>Bugünün harcamaları</span>
                <span>{tl(todaySum)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todays.length ? (
                <ul className="divide-y">
                  {todays
                    .slice(-3)
                    .reverse()
                    .map((x) => {
                      const I = catIcon(x.c)
                      const card = x.s ? data.cards.find((c) => c.id == x.s) : null
                      return (
                        <li key={x.id} className="flex items-center gap-3 py-2.5">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <I className="size-[18px]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{x.c}</span>
                            <small className="block truncate text-xs text-muted-foreground">
                              {x.n || ''}
                              {x.s ? ` · ${card?.n || 'Kart'}` : ''}
                            </small>
                          </span>
                          <b className="shrink-0 text-sm">-{tl(x.a)}</b>
                        </li>
                      )
                    })}
                </ul>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">Bugün henüz harcama girmedin.</p>
              )}
              {todays.length > 3 && <small className="text-xs text-muted-foreground">+{todays.length - 3} harcama daha</small>}
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={OLD} className={cn(buttonVariants(), 'h-9 rounded-xl px-4 font-bold')}>
                  + Harcama ekle
                </a>
                <a href={OLD} className={cn(buttonVariants({ variant: 'outline' }), 'h-9 rounded-xl px-4 font-bold')}>
                  Tümünü gör
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-4 gap-2.5">
            {(
              [
                ['Gelir', Wallet, 'bg-teal-600'],
                ['Harcama', ShoppingCart, 'bg-amber-500'],
                ['Yatırım', Coins, 'bg-blue-700'],
                ['Kartlar', CreditCard, 'bg-indigo-600'],
              ] as [string, Icon, string][]
            ).map(([l, I, c]) => (
              <a key={l} href={OLD} className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border bg-card px-1 py-3 text-[11px] font-bold shadow-sm transition-transform active:scale-95">
                <span className={cn('grid size-10 place-items-center rounded-xl text-white', c)}>
                  <I className="size-5" />
                </span>
                <span className="max-w-full truncate">{l}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-3 lg:mt-0">
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Önceki ay" onClick={() => shift(-1)} className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-9 cursor-pointer rounded-xl')}>
              <ChevronLeft className="size-4" />
            </button>
            <b className="text-base font-extrabold">
              {MONTHS[+ym.slice(5) - 1]} {ym.slice(0, 4)}
            </b>
            <button type="button" aria-label="Sonraki ay" onClick={() => shift(1)} className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-9 cursor-pointer rounded-xl')}>
              <ChevronRight className="size-4" />
            </button>
          </div>

          <Card>
            <CardContent className="divide-y">
              <Row label="Gelir" value={`+${tl(m.inc)}`} tone="pos" />
              <Row label="Sabit giderler" value={`-${tl(m.fx)}`} />
              <Row label="Günlük harcamalar" value={`-${tl(m.dl)}`} />
              <Row label="Kart ödemeleri" value={`-${tl(m.cp)}`} />
              <Row label="Kartla harcanan" hint="Ay sonu karta ödenecek" value={tl(m.dc)} />
              <Row label="Yatırım" value={`-${tl(m.iv)}`} />
              <Row label="Ay sonu kalan" value={tl(m.bal)} tone={m.bal < 0 ? 'neg' : 'pos'} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold">Gelirin ne kadarı harcandı?</h3>
                <b className={cn('text-sm', ratio > 90 ? 'text-destructive' : ratio > 70 ? 'text-gold' : 'text-positive')}>%{Math.round(ratio)}</b>
              </div>
              <Progress
                value={ratio}
                className={cn('mt-3 [&_[data-slot=progress-track]]:h-2.5', tone)}
              />
              <Separator className="my-3" />
              <small className="text-xs text-muted-foreground">
                {tl(spent)} / {tl(base)} {data.lim ? '(limitin)' : '(gelirin)'}
              </small>
            </CardContent>
          </Card>
        </div>
      </div>

      <a
        href={OLD}
        aria-label="Harcama ekle"
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-4 z-30 grid size-14 place-items-center rounded-full bg-gold text-[#0a1f33] shadow-xl transition-transform active:scale-95"
      >
        <Plus className="size-7" />
      </a>
    </div>
  )
}
