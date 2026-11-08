import { useSyncExternalStore } from 'react'
import { normD } from './budget'
import type { Data, Session, Tab } from './types'
import type { Per } from './budget'
import { jset, lget, today } from './util'

export type AuthMode = 'in' | 'up' | 'fg' | 'fd' | 'vf' | 'rp'
export type Flash = { mode: AuthMode; msg?: string; ok?: boolean }

export type State = {
  phase: 'boot' | 'auth' | 'app'
  tab: Tab
  ym: string
  yr: number
  day: string
  per: Per
  cv: 'y' | 'm'
  cd: string
  drawer: boolean
  D: Data | null
  user: Session | null
  rev: number
  q: string
  tf: string
  flash: Flash | null
  sheet: null | 'calc' | 'notes'
  /** tema / görünüm ayarlarının değiştiğini bileşenlere bildirir */
  prefs: number
}

const ym0 = today().slice(0, 7)
let S: State = {
  phase: 'boot',
  tab: 'home',
  ym: ym0,
  yr: +ym0.slice(0, 4),
  day: today(),
  per: 'ay',
  cv: 'y',
  cd: today(),
  drawer: false,
  D: null,
  user: null,
  rev: 0,
  q: '',
  tf: 'Tümü',
  flash: null,
  sheet: null,
  prefs: 0,
}
const subs = new Set<() => void>()
let onSave: () => void = () => {}

export const getS = () => S
export const getD = () => S.D as Data
export const subscribe = (f: () => void) => {
  subs.add(f)
  return () => subs.delete(f)
}
export function setS(p: Partial<State>) {
  S = { ...S, ...p }
  subs.forEach((f) => f())
}
export const useApp = () => useSyncExternalStore(subscribe, () => S)
export const setOnSave = (f: () => void) => (onSave = f)

export const uidKey = () => 'bt_d_' + (S.user ? S.user.uid : '')

/** Veriyi cihaza yazar ve buluta göndermeyi sıraya alır. */
export function save() {
  if (S.D && S.user) jset(uidKey(), S.D)
  if (S.user && S.user.v) onSave()
}
/** D üzerinde yapılan değişikliği kaydeder ve ekranı yeniler. */
export function commit() {
  save()
  setS({ rev: S.rev + 1 })
}
export function mutate(fn: (D: Data) => unknown) {
  const r = fn(S.D as Data)
  if (r !== false) commit()
  return r
}
export function loadUserData(user: Session) {
  const raw = lget('bt_d_' + user.uid)
  let parsed: unknown = null
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }
  return normD(parsed)
}

export const userName = () => (S.user ? S.user.n || S.user.e.split('@')[0] : '')

/* ---- gezinme ---- */
export function go(tab: Tab) {
  setS({ tab, drawer: false })
  window.scrollTo({ top: 0 })
}
export function shiftMonth(n: number) {
  const d = new Date(+S.ym.slice(0, 4), +S.ym.slice(5) - 1 + n, 1)
  setS({ ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
}
export const bumpPrefs = () => setS({ prefs: S.prefs + 1 })
