import { motion } from 'motion/react'
import { useEffect, useState, type PointerEvent as RPointerEvent } from 'react'
import { I, MAIN, TABS, type IconC } from './Icons'
import { Logo } from './Logo'
import { signOut } from '@/lib/auth'
import { addExpense } from '@/lib/forms'
import { go, setS, useApp, userName } from '@/lib/store'
import { THEMES, getMode, resolveDark, setMode, applyTheme } from '@/lib/themes'
import { ask } from '@/lib/ui'
import { jget, jset, lget, today } from '@/lib/util'
import { cn } from '@/lib/utils'
import { spring } from './kit'

const titleOf = (tab: string) =>
  tab === 'home' ? 'Bütçe Takip' : tab === 'not' ? 'Bildirimler' : tab === 'set' ? 'Ayarlar' : (TABS.find((t) => t.id === tab)?.label ?? '')

export function Header() {
  const { tab } = useApp()
  return (
    <div className="top">
      <button className="ib mb" onClick={() => setS({ drawer: true })} aria-label="Menü">
        <I.menu size={20} />
      </button>
      {tab === 'home' ? (
        <Logo size={36} />
      ) : (
        <button className="ib" onClick={() => go('home')} style={{ gap: '.15rem' }}>
          <I.left size={16} /> Ana
        </button>
      )}
      <b>{titleOf(tab)}</b>
      <button className={cn('ib', tab === 'not' && 'on')} onClick={() => go('not')} aria-label="Bildirimler">
        <I.bell size={18} />
      </button>
      <button className={cn('ib', tab === 'set' && 'on')} onClick={() => go('set')} aria-label="Ayarlar">
        <I.gear size={18} />
      </button>
    </div>
  )
}

export function toggleDark() {
  setMode(resolveDark() ? 'light' : 'dark')
  setS({ prefs: Date.now() })
}

export function Drawer() {
  const { drawer, tab } = useApp()
  const items = TABS.filter((t) => t.id !== 'not' && t.id !== 'set')
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setS({ drawer: false })
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  return (
    <>
      <div className={cn('dm', drawer && 'open')} onClick={() => setS({ drawer: false })} />
      <aside className={cn('sd', drawer && 'open')} aria-hidden={!drawer ? undefined : false}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '1.1rem' }}>
          <Logo size={46} />
          <div style={{ minWidth: 0 }}>
            <b style={{ fontSize: '1.1rem', display: 'block' }}>Bütçe Takip</b>
            <small style={{ opacity: 0.7, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName()}</small>
          </div>
        </div>
        {items.map((t) => {
          const Ic = I[t.icon] as IconC
          return (
            <button key={t.id} className={cn(tab === t.id && 'on')} onClick={() => go(t.id)}>
              <Ic size={20} /> {t.label}
            </button>
          )
        })}
        <div className="sf">
          <button onClick={toggleDark}>
            <I.moon size={20} /> Tema
          </button>
          <button onClick={() => ask('Çıkış yapılsın mı? Verilerin silinmez.', () => void signOut())}>
            <I.out size={20} /> Çıkış
          </button>
        </div>
      </aside>
    </>
  )
}

export function BottomNav() {
  const { tab } = useApp()
  return (
    <nav className="nav" aria-label="Ana gezinme">
      {TABS.filter((t) => MAIN.includes(t.id)).map((t) => {
        const Ic = I[t.icon] as IconC
        const on = tab === t.id
        return (
          <button key={t.id} className={cn(on && 'on')} onClick={() => go(t.id)} aria-current={on ? 'page' : undefined}>
            {on && <motion.span layoutId="navbg" className="navbg" transition={spring} />}
            <Ic size={20} />
            <span>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function Fab() {
  return (
    <motion.button
      className="fab"
      aria-label="Harcama ekle"
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={spring}
      onClick={() => {
        setS({ day: today() })
        addExpense()
      }}
    >
      <I.plus size={28} />
    </motion.button>
  )
}

/* ---- kenarda yüzen, sürüklenebilir not / hesap makinesi düğmeleri ---- */
type Pos = Record<string, { s: 'l' | 'r'; t: number }>
export function Orbs() {
  const { prefs } = useApp()
  const [pos, setPos] = useState<Pos>(() => jget('bt_orb', {}))
  const [vw, setVw] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [drag, setDrag] = useState<{ k: string; x: number; y: number } | null>(null)
  const [start, setStart] = useState<{ k: string; x: number; y: number; moved: boolean } | null>(null)
  useEffect(() => {
    const r = () => setVw({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])
  void prefs
  if (lget('bt_oh') === '1') return null
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 14.4
  const W = 2.9 * rem
  const H = 3.25 * rem
  const side = vw.w >= 900 ? 16.5 * rem : 0
  const defs: [string, string, IconC, 'notes' | 'calc'][] = [
    ['n', 'Notlar', I.note, 'notes'],
    ['c', 'Hesap makinesi', I.calc, 'calc'],
  ]
  const down = (k: string) => (e: RPointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setStart({ k, x: e.clientX, y: e.clientY, moved: false })
  }
  const move = (e: RPointerEvent) => {
    if (!start) return
    if (!start.moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 8) return
    if (!start.moved) setStart({ ...start, moved: true })
    setDrag({ k: start.k, x: e.clientX, y: e.clientY })
  }
  const up = (sheet: 'notes' | 'calc') => (e: RPointerEvent) => {
    if (!start) return
    const s = start
    setStart(null)
    setDrag(null)
    if (!s.moved) {
      setS({ sheet })
      return
    }
    const p = { ...pos, [s.k]: { s: (e.clientX < vw.w / 2 ? 'l' : 'r') as 'l' | 'r', t: Math.min(88, Math.max(6, (e.clientY / vw.h) * 100)) } }
    setPos(p)
    jset('bt_orb', p)
  }
  return (
    <>
      {defs.map(([k, label, Ic, sheet]) => {
        const o = pos[k] || { s: 'l', t: k === 'n' ? 60 : 72 }
        const d = drag && drag.k === k ? drag : null
        const left = d ? d.x - W / 2 : o.s === 'l' ? side : vw.w - W
        const top = d ? d.y - H / 2 : (o.t / 100) * vw.h
        return (
          <button
            key={k}
            className={cn('orb', k, d && 'dragging')}
            aria-label={label}
            style={{
              left,
              top,
              width: W,
              height: H,
              borderRadius: d ? '1.6rem' : o.s === 'l' ? '0 1.6rem 1.6rem 0' : '1.6rem 0 0 1.6rem',
              borderLeft: !d && o.s === 'l' ? 0 : undefined,
              borderRight: !d && o.s === 'r' ? 0 : undefined,
            }}
            onPointerDown={down(k)}
            onPointerMove={move}
            onPointerUp={up(sheet)}
            onPointerCancel={() => {
              setStart(null)
              setDrag(null)
            }}
            onClick={(e) => e.detail === 0 && setS({ sheet })}
          >
            <Ic size={22} />
          </button>
        )
      })}
    </>
  )
}

export { applyTheme, getMode, THEMES }
