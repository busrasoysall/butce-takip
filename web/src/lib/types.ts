export type Income = { id: number; m: string; t: string; s: string; a: number }
export type Daily = { id: number; d: string; c: string; n?: string; a: number; r?: string; s?: number | string }
export type Invest = { id: number; m: string; d: string; k: 'p' | 'g'; g?: string; q?: number; a: number; n?: string }
export type Hist = { t: 'o' | 'b'; a: number; d: string }
export type Card = { id: number | string; n: string; bk?: string; b: number; m: number; g: number; h: Hist[] }
export type Goal = { n: string; t: number; s: number }
export type Note = {
  id: number
  t: string
  d: string
  u?: number
  c?: number
  p?: number
  k?: 'l'
  it?: { t: string; x: number }[]
}
export type CalNote = { id: number; t: string; k: string }

export type Data = {
  inc: Income[]
  cats: string[]
  fx: Record<string, Record<string, number>>
  dcats: string[]
  ek: string[]
  daily: Daily[]
  inv: Invest[]
  cards: Card[]
  rates: Record<string, number>
  rt?: string
  rsrc?: string
  gl: Goal[]
  lim: number
  nt: Record<string, CalNote[]>
  nb: Note[]
  cl: Record<string, number>
  due: Record<string, number>
  pm?: string
  nf: Record<string, number>
  wk?: Record<string, unknown>
}

export type Session = { rt: string; it: string; ex: number; uid: string; e: string; n: string; v: boolean }

export type Tab =
  | 'home'
  | 'inc'
  | 'fx'
  | 'dly'
  | 'inv'
  | 'crd'
  | 'cal'
  | 'cht'
  | 'not'
  | 'tx'
  | 'gol'
  | 'set'
