import { createElement } from 'react'
import { BK, PM } from './budget'
import { gfetch, pickReceipt, snd } from './misc'
import { getD, getS, mutate, setS } from './store'
import { F, ask, closeLastForm, toast, type FormValues } from './ui'
import { GN, sum, tl, today, uid } from './util'

type Prefill = { c?: string; n?: string; a?: number | string; d?: string; r?: string }

/** Harcama ekle (fiş fotoğrafı varsa önizlemeyle). */
export function addExpense(p: Prefill = {}) {
  const D = getD()
  const day = getS().day
  const top = p.r
    ? createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.7rem' } },
        createElement('img', { src: p.r, alt: 'Fiş', style: { height: '4.4rem', borderRadius: '.6rem' } }),
        createElement('b', null, 'Fiş eklendi'),
      )
    : createElement(
        'button',
        {
          className: 'btn o w100',
          style: { marginBottom: '.7rem' },
          type: 'button',
          onClick: () => {
            closeLastForm()
            void scanReceipt()
          },
        },
        'Fişi çek, fotoğrafla ekle',
      )
  F(
    p.r ? 'Fiş harcaması' : 'Harcama ekle',
    [
      ['Kategori', 's', p.c || D.dcats[0], D.dcats],
      ['Not (market, simit…)', 'text', p.n || ''],
      ['Tutar (₺)', 'number', p.a || ''],
      ['Tarih', 'date', p.d || day],
      ['Ödeme yöntemi', 's', D.pm && PM(D).includes(D.pm) ? D.pm : PM(D)[0], PM(D)],
    ],
    (v) => {
      if (!v[2]) return false
      const d = String(v[3] || day)
      D.pm = String(v[4])
      const sc = D.cards.find((c) => 'Kart: ' + c.n === v[4])?.id
      D.daily.push({ id: uid(), d, c: String(v[0]), n: String(v[1]), a: Number(v[2]), r: p.r, s: sc })
      setS({ day: d })
      snd(false)
      const lm = (D.cl || {})[String(v[0])]
      if (lm) {
        const s = sum(D.daily.filter((x) => x.c === v[0] && x.d.startsWith(d.slice(0, 7))).map((x) => x.a))
        if (s > lm) setTimeout(() => toast('Dikkat: ' + v[0] + ' limitini aştın: ' + tl(s) + ' / ' + tl(lm)), 300)
      }
    },
    undefined,
    top,
  )
}

/** Fişi fotoğrafla: görüntü küçültülüp forma eklenir (otomatik okuma sunucu gerektirir). */
export async function scanReceipt() {
  const r = await pickReceipt()
  if (r) addExpense({ r, d: getS().day })
}

export function addIncome(t: 'Maaş' | 'Ek gelir') {
  const D = getD()
  const ym = getS().ym
  F(
    t + ' ekle',
    [...(t === 'Maaş' ? [] : ([['Hangi alandan?', 's', D.ek[0], D.ek]] as never[])), ['Tutar (₺)', 'number', '']],
    (v) => {
      const a = Number(t === 'Maaş' ? v[0] : v[1])
      if (!a) return false
      D.inc.push({ id: uid(), m: ym, t, s: t === 'Maaş' ? '' : String(v[0]), a })
      snd(true)
    },
  )
}
export function addIncomeField() {
  F('Ek gelir alanı ekle', [['Alan adı', 'text', '']], (v) => {
    if (!v[0]) return false
    getD().ek.push(String(v[0]))
  })
}
export function addCategory(k: 'cats' | 'dcats') {
  F('Kategori ekle', [['Kategori adı', 'text', '']], (v) => {
    if (!v[0]) return false
    getD()[k].push(String(v[0]))
  })
}
export function removeCategory(k: 'cats' | 'dcats', i: number) {
  ask('Kategori kaldırılsın mı? Eski kayıtlar silinmez.', () => mutate((D) => void D[k].splice(i, 1)))
}
export function dueDay(i: number) {
  const D = getD()
  const c = D.cats[i]
  F('Ödeme günü: ' + c, [['Ayın kaçıncı günü? (1-31, 0 = kaldır)', 'number', (D.due || {})[c] || '']], (v) => {
    D.due = D.due || {}
    const d = Math.min(31, Math.max(0, Math.round(Number(v[0]))))
    if (d) D.due[c] = d
    else delete D.due[c]
  })
}
export function catLimit(i: number) {
  const D = getD()
  const c = D.dcats[i]
  F('Limit: ' + c, [['Aylık limit (₺, 0 = kaldır)', 'number', D.cl[c] || '']], (v) => {
    if (v[0]) D.cl[c] = Number(v[0])
    else delete D.cl[c]
  })
}
export function copyLastMonth() {
  const { ym } = getS()
  const d = new Date(+ym.slice(0, 4), +ym.slice(5) - 2, 1)
  const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  mutate((D) => {
    if (!D.fx[k]) {
      toast('Geçen ay için kayıt yok.')
      return false
    }
    D.fx[ym] = Object.assign({}, D.fx[k], D.fx[ym] || {})
    snd(true)
  })
}
export function setFixed(i: number, raw: string) {
  const { ym } = getS()
  mutate((D) => {
    const c = D.cats[i]
    const a = parseFloat(String(raw).replace(',', '.')) || 0
    D.fx[ym] = D.fx[ym] || {}
    if (a) D.fx[ym][c] = a
    else delete D.fx[ym][c]
    if (a) snd(false)
  })
}

export function addCard() {
  F(
    'Kart ekle',
    [
      ['Banka', 's', 'Ziraat Bankası', BK.map((b) => b[0])],
      ['Kart adı (ör. Bonus, Maximum; “Diğer” için tam ad)', 'text', ''],
      ['Mevcut borç (₺)', 'number', ''],
      ['Aylık taksit (₺)', 'number', ''],
    ],
    (v) => {
      if (v[0] === 'Diğer' && !v[1]) return false
      const nm = v[0] === 'Diğer' ? String(v[1]) : v[1] ? v[0] + ' ' + v[1] : String(v[0])
      const D = getD()
      D.cards.push({ id: uid(), n: nm, bk: v[0] === 'Diğer' ? nm : String(v[0]), b: Number(v[2]), m: Number(v[3]), g: D.cards.length, h: [] })
    },
  )
}
export function cardPay(i: number, t: 'o' | 'b') {
  const D = getD()
  const c = D.cards[i]
  F(
    t === 'o' ? 'Borç öde' : 'Yeni kredi çek',
    [
      ['Tutar (₺)', 'number', t === 'o' ? c.m || '' : ''],
      ['Tarih', 'date', today()],
    ],
    (v) => {
      if (!v[0]) return false
      c.h.push({ t, a: Number(v[0]), d: String(v[1] || today()) })
      snd(t === 'b')
    },
  )
}
export function deleteCard(i: number, after?: () => void) {
  ask('Kart silinsin mi?', () => {
    mutate((D) => void D.cards.splice(i, 1))
    after?.()
  })
}

export function addInvest(k: 'p' | 'g') {
  F(
    k === 'p' ? 'Para biriktir' : 'Altın al',
    k === 'p'
      ? [
          ['Tutar (₺)', 'number', ''],
          ['Tarih', 'date', today()],
          ['Not (isteğe bağlı)', 'text', ''],
        ]
      : [
          ['Tür', 's', 'Gram', Object.values(GN)],
          ['Adet', 'number', 1],
          ['Ödenen toplam tutar (₺)', 'number', ''],
          ['Tarih', 'date', today()],
        ],
    (v: FormValues) => {
      const D = getD()
      if (k === 'p') {
        if (!v[0]) return false
        const d = String(v[1] || today())
        D.inv.push({ id: uid(), m: d.slice(0, 7), d, k, a: Number(v[0]), n: String(v[2]) })
      } else {
        if (!v[1] || !v[2]) return false
        const d = String(v[3] || today())
        D.inv.push({ id: uid(), m: d.slice(0, 7), d, k, g: Object.keys(GN).find((x) => GN[x] === v[0]), q: Number(v[1]), a: Number(v[2]) })
      }
      snd(true)
    },
  )
}
export const refreshGold = () => gfetch(false)

export function addGoal() {
  F(
    'Hedef ekle',
    [
      ['Hedef adı', 'text', ''],
      ['Hedef tutar (₺)', 'number', ''],
    ],
    (v) => {
      if (!v[0] || !v[1]) return false
      getD().gl.push({ n: String(v[0]), t: Number(v[1]), s: 0 })
    },
  )
}
export function goalMoney(i: number) {
  F('Hedefe para ekle', [['Tutar (₺)', 'number', '']], (v) => {
    if (!v[0]) return false
    getD().gl[i].s += Number(v[0])
    snd(true)
  })
}
export function calNote() {
  const cd = getS().cd
  F(
    'Not / özel gün ekle',
    [
      ['Başlık', 'text', ''],
      ['Tür', 's', 'Not', ['Not', 'Özel gün', 'Hatırlatma']],
    ],
    (v) => {
      if (!v[0]) return false
      const D = getD()
      ;(D.nt[cd] = D.nt[cd] || []).push({ id: uid(), t: String(v[0]), k: String(v[1]) })
    },
  )
}
export function monthLimit() {
  const D = getD()
  F('Aylık harcama limiti', [['Limit (₺, 0 = kapalı)', 'number', D.lim || '']], (v) => {
    D.lim = Number(v[0])
  })
}
export function restoreForm(apply: (t: string) => boolean) {
  F('Yedeği yükle', [['Yedek metni', 'text', '']], (v) => {
    if (!apply(String(v[0]))) {
      toast('Geçersiz yedek.')
      return false
    }
  })
}
