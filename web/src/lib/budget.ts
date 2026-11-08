import type { Card, Data } from './types'
import { COL, GN, MN, add, lw, pad, sum, today } from './util'

export const defD = (): Data => ({
  inc: [],
  cats: ['Elektrik', 'Su', 'Ev kirası', 'Telefon', 'İnternet', 'Su siparişi', 'Kedi maması', 'Yol ücreti', 'Kredi ödemesi'],
  fx: {},
  dcats: ['Yol ücreti', 'Kahvaltılık', 'Market alışverişi', 'Kıyafet', 'Dışarıdan yemek', 'Genel harcamalar'],
  ek: ['Freelance', 'Kira geliri', 'Satış', 'Diğer'],
  daily: [],
  inv: [],
  cards: [],
  rates: { gram: 0, ceyrek: 0, yarim: 0, tam: 0 },
  wk: {},
  gl: [],
  lim: 0,
  nt: {},
  nb: [],
  cl: {},
  due: {},
  nf: {},
})

export const normD = (raw: unknown): Data => {
  const d = Object.assign(defD(), raw && typeof raw === 'object' ? raw : {}) as Data
  d.cards = (d.cards || []).map((c) => ({ ...c, h: c.h || [] }))
  d.nb = d.nb || []
  d.nt = d.nt || {}
  d.cl = d.cl || {}
  d.due = d.due || {}
  d.nf = d.nf || {}
  return d
}

export function T(D: Data, p: string) {
  const m = (k: string) => k.startsWith(p)
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
  return { inc, fx, dl, dc, iv, cp, ln, out: fx + dl + iv + cp, bal: inc + ln - fx - dl - iv - cp }
}

export const cb = (D: Data, c: Card) =>
  sum(D.daily.filter((x) => x.s == c.id).map((x) => x.a)) +
  c.b +
  sum(c.h.filter((h) => h.t === 'b').map((h) => h.a)) -
  sum(c.h.filter((h) => h.t === 'o').map((h) => h.a))

export const PM = (D: Data) => ['Nakit / Maaş kartı', ...D.cards.map((c) => 'Kart: ' + c.n)]

/* ---- Banka kart renkleri ---- */
export const BK: [string, string][] = [
  ['Ziraat Bankası', 'linear-gradient(135deg,#b3001b,#e5303f)'],
  ['Garanti BBVA', 'linear-gradient(135deg,#0a6b3f,#14a35b)'],
  ['İş Bankası', 'linear-gradient(135deg,#123c8c,#2f6fd6)'],
  ['Akbank', 'linear-gradient(135deg,#c1121f,#ef4444)'],
  ['Yapı Kredi', 'linear-gradient(135deg,#1b2a6b,#4a3fb5)'],
  ['QNB', 'linear-gradient(135deg,#5b1f6b,#9b2f8f)'],
  ['DenizBank', 'linear-gradient(135deg,#0b4f9c,#1e90e0)'],
  ['Halkbank', 'linear-gradient(135deg,#0c4a8f,#2b7bd1)'],
  ['VakıfBank', 'linear-gradient(135deg,#8a6a00,#e5b800)'],
  ['TEB', 'linear-gradient(135deg,#0d6e3f,#2fb36a)'],
  ['ING', 'linear-gradient(135deg,#e8590c,#ff8a3d)'],
  ['Enpara', 'linear-gradient(135deg,#6a2fb5,#a56bf0)'],
  ['Papara', 'linear-gradient(135deg,#111,#3a3a44)'],
  ['Kuveyt Türk', 'linear-gradient(135deg,#0b6b4a,#1fa97a)'],
  ['Diğer', 'linear-gradient(135deg,#0a1f33,#0f766e)'],
]
const CG = [
  'linear-gradient(135deg,#0a1f33,#0f766e)',
  'linear-gradient(135deg,#1e3a8a,#2b8cd9)',
  'linear-gradient(135deg,#1b1b1f,#4a4a55)',
  'linear-gradient(135deg,#8a5a00,#e8b43a)',
  'linear-gradient(135deg,#0b4f6c,#14b8a6)',
  'linear-gradient(135deg,#3b2a6b,#6366f1)',
]
export const bkc = (c: Card) => {
  const n = lw(c.bk || c.n)
  const f = BK.find((b) => b[0] !== 'Diğer' && n.includes(lw(b[0]).split(' ')[0]))
  return f ? f[1] : CG[(c.g || 0) % CG.length]
}

/* ---- Finansal sağlık skoru ---- */
export function health(D: Data, ym: string) {
  const m = T(D, ym)
  const sp = m.fx + m.dl + m.cp
  const r = m.inc ? sp / m.inc : sp ? 1.2 : 0
  const a = T(D, '')
  const debt = sum(D.cards.map((c) => cb(D, c)))
  let sc = 100
  sc -= r > 1 ? 40 : r > 0.85 ? 25 : r > 0.7 ? 12 : 0
  if (a.bal < 0) sc -= 25
  if (debt > Math.max(m.inc, 1) * 6) sc -= 15
  else if (debt > m.inc * 3) sc -= 7
  if (m.iv > 0) sc += 5
  if (D.gl.some((g) => g.s > 0)) sc += 5
  sc = Math.max(5, Math.min(100, Math.round(sc)))
  const label = sc >= 80 ? 'Harika' : sc >= 60 ? 'İyi' : sc >= 40 ? 'Dikkat' : 'Riskli'
  const tone = sc >= 80 ? 'good' : sc >= 60 ? 'ok' : sc >= 40 ? 'warn' : 'bad'
  const tip = !m.inc
    ? 'Gelirini ekleyerek başla.'
    : r > 0.85
      ? 'Harcamaların gelirine çok yaklaştı.'
      : debt > 0 && !m.iv
        ? 'Önce borç öde, sonra birikim başlat.'
        : 'Hedef ekleyip düzenli birikimle skorunu artır.'
  return { sc, label, tone, tip }
}

/* ---- Ana sayfa içgörüleri ---- */
export function insights(D: Data, ym: string) {
  const m = T(D, ym)
  const sp = m.fx + m.dl + m.cp
  const base = D.lim || m.inc
  const ratio = base ? Math.min(100, (sp / base) * 100) : 0
  const y = +ym.slice(0, 4)
  const mm = +ym.slice(5) - 1
  const six: { l: string; a: number; e: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, mm - i, 1)
    const t = T(D, `${d.getFullYear()}-${pad(d.getMonth() + 1)}`)
    six.push({ l: MN[d.getMonth()].slice(0, 3), a: t.inc, e: t.fx + t.dl + t.cp })
  }
  const cm: Record<string, number> = {}
  D.daily.filter((x) => x.d.startsWith(ym)).forEach((x) => (cm[x.c] = (cm[x.c] || 0) + x.a))
  Object.entries(D.fx[ym] || {}).forEach(([c, v]) => (cm[c] = (cm[c] || 0) + v))
  const cats = Object.entries(cm).sort((a, b) => b[1] - a[1])
  const n = new Date(y, mm + 1, 0).getDate()
  const e = ym === today().slice(0, 7) ? +today().slice(8) : n
  const av = m.dl / e
  const pj = m.fx + m.cp + av * n
  const lm = D.lim || m.inc
  const bad = !!lm && pj > lm
  return { m, sp, base, ratio, six, cats, av, pj, lm, bad }
}

export function upcoming(D: Data, ym: string) {
  const t = today()
  if (ym !== t.slice(0, 7)) return []
  const dn = +t.slice(8)
  const f = D.fx[ym] || {}
  return Object.entries(D.due || {})
    .filter(([c, d]) => d && !f[c] && D.cats.includes(c) && d - dn <= 7)
    .sort((a, b) => a[1] - b[1])
    .map(([c, d]) => ({ c, d, k: d - dn }))
}

export function upcomingNotes(D: Data) {
  const t = today()
  const e = add(t, 30)
  return Object.keys(D.nt || {})
    .filter((k) => k >= t && k <= e)
    .sort()
    .flatMap((k) => D.nt[k].map((x) => ({ ...x, date: k })))
}

/* ---- Hareketler (tx) ---- */
export type Tx = { d: string; t: string; c: string; n: string; a: number }
export function txs(D: Data): Tx[] {
  const r: Tx[] = []
  D.daily.forEach((x) => r.push({ d: x.d, t: 'Gider', c: x.c, n: x.n || '', a: -x.a }))
  D.inc.forEach((x) => r.push({ d: x.m + '-01', t: 'Gelir', c: x.t === 'Maaş' ? 'Maaş' : x.s, n: '', a: x.a }))
  D.inv.forEach((x) => r.push({ d: x.m + '-01', t: 'Yatırım', c: x.k === 'p' ? 'Para' : GN[x.g || 'gram'], n: '', a: -x.a }))
  Object.keys(D.fx).forEach((m) => Object.entries(D.fx[m]).forEach(([c, a]) => r.push({ d: m + '-01', t: 'Sabit gider', c, n: '', a: -a })))
  D.cards.forEach((c) =>
    c.h.forEach((h) =>
      r.push({ d: h.d, t: h.t === 'o' ? 'Kart ödemesi' : 'Yeni kredi', c: c.n, n: '', a: h.t === 'o' ? -h.a : h.a }),
    ),
  )
  return r.sort((a, b) => b.d.localeCompare(a.d))
}

/* ---- Bildirim kartları (ntf) ---- */
export function notifCards(D: Data) {
  const t = today()
  const hr = new Date().getHours()
  const tod = sum(D.daily.filter((x) => x.d === t).map((x) => x.a))
  const has = D.daily.some((x) => x.d === t)
  const sp = (a: string, b: string) => sum(D.daily.filter((x) => x.d >= a && x.d <= b).map((x) => x.a))
  const tp = (a: string, b: string) => {
    const m: Record<string, number> = {}
    D.daily.filter((x) => x.d >= a && x.d <= b).forEach((x) => (m[x.c] = (m[x.c] || 0) + x.a))
    const e = Object.entries(m).sort((p, q) => q[1] - p[1])[0]
    return e ? `${e[0]} (${Math.round(e[1]).toLocaleString('tr-TR')} ₺)` : 'kayıt yok'
  }
  const ch = (a: number, b: number) =>
    b ? (a >= b ? `%${Math.round(((a - b) / b) * 100)} fazla` : `%${Math.round(((b - a) / b) * 100)} az`) : 'karşılaştırma yok'
  const y = add(t, -1)
  const ys = sp(y, y)
  const a7 = sp(add(y, -7), add(y, -1)) / 7
  const dw = (new Date(t + 'T12:00:00').getDay() + 6) % 7
  const ws = add(t, -dw - 7)
  const we = add(ws, 6)
  const ps = add(ws, -7)
  const pe = add(ws, -1)
  const mh = new Date(+t.slice(0, 4), +t.slice(5, 7) - 2, 1)
  const k = `${mh.getFullYear()}-${pad(mh.getMonth() + 1)}`
  const mm = T(D, k)
  const mx = mm.fx + mm.dl + mm.cp
  const f = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`
  return [
    {
      icon: 'bell',
      head: has ? `Bugün ${f(tod)} harcadın` : hr >= 20 ? 'Bugün hiç harcama girmedin' : 'Bugünkü harcamalarını gir',
      lines: [has ? 'Kayıtların güncel.' : hr >= 20 ? 'Gün bitmeden girmeyi unutma.' : 'Gün içinde aldıklarını not et.'],
    },
    { icon: 'chart', head: `Dün: ${f(ys)}`, lines: [`Son 7 gün ortalamasına göre ${ch(ys, a7)}.`, `En çok: ${tp(y, y)}`] },
    {
      icon: 'cal',
      head: `Geçen hafta: ${f(sp(ws, we))}`,
      lines: [`Önceki haftaya göre ${ch(sp(ws, we), sp(ps, pe))}.`, `En çok: ${tp(ws, we)}`],
    },
    {
      icon: 'target',
      head: `${MN[mh.getMonth()]} ayı özeti`,
      lines: [
        `Gelir ${f(mm.inc)} · Harcama ${f(mx)} · Yatırım ${f(mm.iv)}`,
        `Ay sonu kalan: ${f(mm.bal)}`,
        `En çok (günlük): ${tp(k + '-01', k + '-31')}`,
      ],
    },
  ]
}

/* ---- Grafik verisi (cht) ---- */
export type Per = 'gün' | 'hafta' | 'ay' | 'yıl'
export function chartData(D: Data, per: Per, yr: number) {
  const t = today()
  const b: { l: string; v: number }[] = []
  let a: string
  let z: string
  if (per === 'gün') {
    a = add(t, -13)
    z = t
    for (let i = 13; i >= 0; i--) {
      const d = add(t, -i)
      b.push({ l: d.slice(8), v: sum(D.daily.filter((x) => x.d === d).map((x) => x.a)) })
    }
  } else if (per === 'hafta') {
    a = add(t, -55)
    z = t
    for (let i = 7; i >= 0; i--) {
      const e = add(t, -i * 7)
      const s = add(e, -6)
      b.push({ l: s.slice(8) + '/' + s.slice(5, 7), v: sum(D.daily.filter((x) => x.d >= s && x.d <= e).map((x) => x.a)) })
    }
  } else if (per === 'ay') {
    a = yr + '-01-01'
    z = yr + '-12-31'
    MN.forEach((n, i) => {
      const m = T(D, yr + '-' + pad(i + 1))
      b.push({ l: n.slice(0, 3), v: m.fx + m.dl })
    })
  } else {
    const y0 = Math.min(+t.slice(0, 4), ...D.daily.map((x) => +x.d.slice(0, 4)), ...Object.keys(D.fx).map((k) => +k.slice(0, 4)))
    a = '0000'
    z = '9999'
    for (let y = y0; y <= +t.slice(0, 4); y++) {
      const m = T(D, '' + y)
      b.push({ l: '' + y, v: m.fx + m.dl })
    }
  }
  const cm: Record<string, number> = {}
  const acc = (c: string, v: number) => (cm[c] = (cm[c] || 0) + v)
  D.daily.filter((x) => x.d >= a && x.d <= z).forEach((x) => acc(x.c, x.a))
  if (per === 'ay' || per === 'yıl')
    Object.keys(D.fx)
      .filter((k) => k >= a.slice(0, 7) && k <= z.slice(0, 7))
      .forEach((k) => Object.entries(D.fx[k]).forEach(([c, v]) => acc(c, v)))
  const mx = Math.max(1, ...b.map((x) => x.v))
  const tot = sum(b.map((x) => x.v))
  const cs = Object.entries(cm).sort((x, y) => y[1] - x[1])
  const ct = sum(cs.map((x) => x[1])) || 1
  return { b, mx, tot, cs, ct, COL }
}

export function weekRows(D: Data) {
  const t = today()
  const out: { s: string; e: string; v: number; i: number }[] = []
  for (let i = 0; i < 8; i++) {
    const e = add(t, -i * 7)
    const s = add(e, -6)
    const v = sum(D.daily.filter((x) => x.d >= s && x.d <= e).map((x) => x.a))
    if (v || i < 2) out.push({ s, e, v, i })
  }
  return out
}
