// Mevcut uygulamanın verisini (aynı tarayıcıdaki localStorage) salt okunur okur ve
// ana sayfa toplamlarını aynı formülle hesaplar (index.html içindeki T() ile aynı mantık).
export type Income = { id: number; m: string; t: string; s: string; a: number }
export type Daily = { id: number; d: string; c: string; n?: string; a: number; s?: number | string }
export type Hist = { t: 'o' | 'b'; a: number; d: string }
export type Card = { id: number | string; n: string; h: Hist[] }
export type Data = {
  inc: Income[]
  fx: Record<string, Record<string, number>>
  daily: Daily[]
  inv: { m: string; a: number }[]
  cards: Card[]
  lim?: number
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
const pad = (n: number) => String(n).padStart(2, '0')

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const tl = (n: number) => `${(Math.round(n) || 0).toLocaleString('tr-TR')} ₺`

export const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export function totals(D: Data, prefix: string) {
  const m = (k: string) => k.startsWith(prefix)
  const inc = sum(D.inc.filter((x) => m(x.m)).map((x) => x.a))
  const fx = sum(Object.keys(D.fx).filter(m).map((k) => sum(Object.values(D.fx[k]))))
  const dl = sum(D.daily.filter((x) => m(x.d) && !x.s).map((x) => x.a))
  const dc = sum(D.daily.filter((x) => m(x.d) && x.s).map((x) => x.a))
  const iv = sum(D.inv.filter((x) => m(x.m)).map((x) => x.a))
  let cp = 0
  let ln = 0
  D.cards.forEach((c) =>
    c.h.forEach((h) => {
      if (m(h.d)) {
        if (h.t === 'o') cp += h.a
        else ln += h.a
      }
    }),
  )
  return { inc, fx, dl, dc, iv, cp, ln, bal: inc + ln - fx - dl - iv - cp }
}

const demo = (): Data => {
  const ym = today().slice(0, 7)
  const t = today()
  return {
    inc: [
      { id: 1, m: ym, t: 'Maaş', s: '', a: 48750 },
      { id: 2, m: ym, t: 'Ek gelir', s: 'Freelance', a: 12500 },
    ],
    fx: { [ym]: { Elektrik: 1250, Su: 380, 'Ev kirası': 16500, Telefon: 420, İnternet: 399 } },
    daily: [
      { id: 3, d: t, c: 'Market alışverişi', n: 'Migros', a: 684 },
      { id: 4, d: t, c: 'Yol ücreti', n: 'Metrobüs', a: 45 },
      { id: 5, d: t, c: 'Dışarıdan yemek', n: 'Öğle yemeği', a: 320 },
    ],
    inv: [],
    cards: [{ id: 6, n: 'Ziraat Bankası Bonus', h: [] }],
  }
}

const read = (k: string) => {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null')
  } catch {
    return null
  }
}

export function loadData(): { name: string; data: Data; demo: boolean } {
  // Bulut modu: oturum bt_cl içinde, veri bt_d_<uid>. Yerel mod: bt_sess = kullanıcı adı.
  const cl = read('bt_cl')
  const key = cl?.uid ? cl.uid : localStorage.getItem('bt_sess')
  const name: string = cl?.uid ? cl.n || String(cl.e || '').split('@')[0] : localStorage.getItem('bt_sess') || ''
  const raw = key ? read('bt_d_' + key) : null
  if (raw) {
    const d: Data = { inc: [], fx: {}, daily: [], inv: [], cards: [], ...raw }
    d.cards = d.cards.map((c) => ({ ...c, h: c.h || [] }))
    return { name: name || 'Kullanıcı', data: d, demo: false }
  }
  return { name: 'Misafir', data: demo(), demo: true }
}

export function isDark() {
  const t = localStorage.getItem('bt_th')
  return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
}
