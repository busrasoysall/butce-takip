import { useSyncExternalStore, type ReactNode } from 'react'
import { commit } from './store'

export type FieldType = 'text' | 'number' | 'date' | 'email' | 'password' | 's'
export type Field = [label: string, type: FieldType, value?: string | number, options?: string[]]
export type FormValues = (string | number)[]

export type FormItem = {
  id: number
  kind: 'form'
  title: string
  fields: Field[]
  ok: (v: FormValues) => unknown
  del?: () => void
  top?: ReactNode
}
export type AskItem = { id: number; kind: 'ask'; msg: string; cb: () => void }
export type TextItem = { id: number; kind: 'text'; title: string; text: string }
export type ChooseItem = {
  id: number
  kind: 'choose'
  title: string
  msg: string
  opts: { label: string; primary?: boolean; run: () => void }[]
}
export type ImageItem = { id: number; kind: 'image'; title: string; src: string }
export type Item = FormItem | AskItem | TextItem | ChooseItem | ImageItem
export type Toast = { id: number; msg: string }

type UIState = { items: Item[]; toasts: Toast[]; sheets: number }
let U: UIState = { items: [], toasts: [], sheets: 0 }
const subs = new Set<() => void>()
let n = 0
const set = (p: Partial<UIState>) => {
  U = { ...U, ...p }
  subs.forEach((f) => f())
}
const sub = (f: () => void) => {
  subs.add(f)
  return () => subs.delete(f)
}
export const useUI = () => useSyncExternalStore(sub, () => U)

/** Açık bir pencere/sayfa var mı? (arka plan eşitlemesi bu sırada ekranı değiştirmez) */
export const modalOpen = () => U.items.length > 0 || U.sheets > 0
export const sheetCount = (d: number) => set({ sheets: Math.max(0, U.sheets + d) })

export const closeItem = (id: number) => set({ items: U.items.filter((x) => x.id !== id) })
export function closeLastForm() {
  const f = [...U.items].reverse().find((x) => x.kind === 'form')
  if (f) closeItem(f.id)
}

export function F(title: string, fields: Field[], ok: FormItem['ok'], del?: () => void, top?: ReactNode) {
  set({ items: [...U.items, { id: ++n, kind: 'form', title, fields, ok, del, top }] })
}
export function ask(msg: string, cb: () => void) {
  set({ items: [...U.items, { id: ++n, kind: 'ask', msg, cb }] })
}
export function showTxt(title: string, text: string) {
  set({ items: [...U.items, { id: ++n, kind: 'text', title, text }] })
}
export function choose(title: string, msg: string, opts: ChooseItem['opts']) {
  if (U.items.some((x) => x.kind === 'choose')) return
  set({ items: [...U.items, { id: ++n, kind: 'choose', title, msg, opts }] })
}
export function showImage(title: string, src: string) {
  set({ items: [...U.items, { id: ++n, kind: 'image', title, src }] })
}
export function toast(msg: string) {
  const id = ++n
  set({ toasts: [...U.toasts, { id, msg }] })
  setTimeout(() => set({ toasts: U.toasts.filter((t) => t.id !== id) }), 3200)
}

/** Form tamamlandığında çağrılır: ok() false dönmezse kaydeder. */
export function submitForm(item: FormItem, v: FormValues) {
  if (item.ok(v) !== false) {
    closeItem(item.id)
    commit()
  }
}
