import { useEffect, useRef, useState } from 'react'
import { I } from './Icons'
import { Seg, Sheet } from './kit'
import { addExpense } from '@/lib/forms'
import { setS } from '@/lib/store'
import { showTxt, toast } from '@/lib/ui'
import { ev, fm, jget, jset, today } from '@/lib/util'
import { cn } from '@/lib/utils'

type Mode = 'h' | 'k' | 'b' | 't'
type Hist = [string, string]
const KEYS = ['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', ',', '(', ')']

// oturum boyunca korunan durum (eski sürümdeki gibi)
let lastExpr = ''
let lastMode: Mode = 'h'
const tools = { k: { a: '', r: 20, t: 'e' as 'e' | 'c' }, b: { a: '', n: 2, p: 0 }, t: { a: '', r: '3', m: 12 } }

const num = (v: string | number) => {
  const n = parseFloat(String(v).replace(',', '.'))
  return isFinite(n) ? n : 0
}
const money = (v: number) => (Math.round(v * 100) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
const r2 = (v: number) => Math.round(v * 100) / 100

function addAsExpense(v: number, close: () => void) {
  if (!(v > 0)) return toast('Önce geçerli bir tutar hesapla.')
  close()
  setS({ day: today() })
  addExpense({ a: r2(v) })
}

const Row = ({ k, v, big }: { k: string; v: string; big?: boolean }) => (
  <div className="row">
    <span className="t">{k}</span>
    <b className={cn(big && 'big2')} style={{ textAlign: 'right' }}>
      {v}
    </b>
  </div>
)

export function Calculator({ onClose }: { onClose: () => void }) {
  const [mode, setModeS] = useState<Mode>(lastMode)
  const [ce, setCe] = useState(lastExpr)
  const [hist, setHist] = useState<Hist[]>(() => jget<Hist[]>('bt_ch', []))
  const [, force] = useState(0)
  const setMode = (m: Mode) => {
    lastMode = m
    setModeS(m)
  }
  useEffect(() => {
    lastExpr = ce
  }, [ce])

  let res = '0'
  try {
    res = ce ? fm(ev(ce)) : '0'
  } catch {
    res = ce ? '…' : '0'
  }

  const press = (k: string) => {
    navigator.vibrate?.(6)
    if (k === 'C') setCe('')
    else if (k === '⌫') setCe((c) => c.slice(0, -1))
    else if (k === '=') {
      try {
        const r = fm(ev(ce))
        if (ce && r !== ce) {
          const h = [[ce, r] as Hist, ...hist].slice(0, 20)
          setHist(h)
          jset('bt_ch', h)
        }
        setCe(r)
      } catch {
        /* geçersiz ifade */
      }
    } else setCe((c) => c + k)
  }

  const pressRef = useRef(press)
  pressRef.current = press
  useEffect(() => {
    if (mode !== 'h') return
    const kd = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input,textarea,select') || e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key
      const p = pressRef.current
      if (/^[0-9]$/.test(k) || k === '(' || k === ')') p(k)
      else if (k === '+') p('+')
      else if (k === '-') p('−')
      else if (k === '*' || k === 'x' || k === 'X') p('×')
      else if (k === '/') {
        e.preventDefault()
        p('÷')
      } else if (k === ',' || k === '.') p(',')
      else if (k === '%') p('%')
      else if (k === 'Enter' || k === '=') {
        e.preventDefault()
        p('=')
      } else if (k === 'Backspace') p('⌫')
      else if (k === 'Delete' || k === 'c' || k === 'C') p('C')
    }
    window.addEventListener('keydown', kd)
    return () => window.removeEventListener('keydown', kd)
  }, [mode])

  const copy = async () => {
    if (!res || res === '0' || res === '…') return
    try {
      await navigator.clipboard.writeText(res)
      toast('Sonuç kopyalandı.')
    } catch {
      showTxt('Sonuç', res)
    }
  }
  const fs = res.length > 13 ? 22 : res.length > 10 ? 27 : res.length > 8 ? 31 : 36

  const tk = tools.k
  const tb = tools.b
  const tt = tools.t
  const upd = () => force((n) => n + 1)

  return (
    <Sheet title="Hesap Makinesi" onClose={onClose}>
      <Seg<Mode>
        value={mode}
        opts={[
          ['h', 'Hesap'],
          ['k', 'KDV'],
          ['b', 'Bölüş'],
          ['t', 'Taksit'],
        ]}
        onChange={setMode}
      />
      {mode === 'h' && (
        <>
          <div className="cdp">
            <small>{ce || ' '}</small>
            <div className="cdr">
              <b style={{ fontSize: fs + 'px' }}>{res}</b>
              <button className="ib" onClick={copy} aria-label="Sonucu kopyala">
                <I.copy size={18} />
              </button>
            </div>
          </div>
          {hist.length > 0 && (
            <div className="chs scroll-x">
              {hist.slice(0, 6).map((h, i) => (
                <button key={i} onClick={() => setCe((c) => c + h[1])}>
                  <small>{h[0]}</small>
                  <b>{h[1]}</b>
                </button>
              ))}
              <button
                aria-label="Geçmişi temizle"
                onClick={() => {
                  setHist([])
                  jset('bt_ch', [])
                }}
              >
                <I.trash size={16} />
              </button>
            </div>
          )}
          <div className="ck">
            {KEYS.map((k) => (
              <button key={k} className={'÷×−+'.includes(k) ? 'op' : 'C⌫%'.includes(k) ? 'fn' : ''} onClick={() => press(k)} aria-label={k === '⌫' ? 'Sil' : undefined}>
                {k === '⌫' ? <I.back size={20} /> : k}
              </button>
            ))}
            <button className="eq" onClick={() => press('=')}>
              =
            </button>
          </div>
          <div className="bs">
            <button
              className="btn"
              onClick={() => {
                let v = 0
                try {
                  v = ev(ce)
                } catch {
                  /* boş */
                }
                addAsExpense(v, onClose)
              }}
            >
              Harcama olarak ekle
            </button>
          </div>
        </>
      )}

      {mode === 'k' &&
        (() => {
          const a = num(tk.a)
          const r = tk.r / 100
          const net = tk.t === 'e' ? a : a / (1 + r)
          const kd = net * r
          const tot = net + kd
          return (
            <>
              <label>Tutar (₺)</label>
              <input type="text" inputMode="decimal" placeholder="0" value={tk.a} onChange={(e) => ((tk.a = e.target.value), upd())} />
              <label>KDV oranı</label>
              <div className="chp">
                {[1, 10, 20].map((x) => (
                  <button key={x} className={tk.r === x ? 'on' : ''} onClick={() => ((tk.r = x), upd())}>
                    %{x}
                  </button>
                ))}
              </div>
              <Seg<'e' | 'c'>
                small
                value={tk.t}
                opts={[
                  ['e', 'KDV ekle'],
                  ['c', 'KDV çıkar'],
                ]}
                onChange={(v) => ((tk.t = v), upd())}
              />
              <div className="cres" style={{ marginTop: '.75rem' }}>
                <Row k="Net tutar" v={money(net)} />
                <Row k={`KDV (%${tk.r})`} v={money(kd)} />
                <Row k="Toplam" v={money(tot)} big />
                <div className="bs">
                  <button className="btn" onClick={() => addAsExpense(tot, onClose)}>
                    Toplamı harcama ekle
                  </button>
                </div>
              </div>
            </>
          )
        })()}

      {mode === 'b' &&
        (() => {
          const a = num(tb.a)
          const tp = (a * tb.p) / 100
          const tot = a + tp
          const pp = tot / Math.max(1, tb.n)
          return (
            <>
              <label>Toplam hesap (₺)</label>
              <input type="text" inputMode="decimal" placeholder="0" value={tb.a} onChange={(e) => ((tb.a = e.target.value), upd())} />
              <label>Kişi sayısı</label>
              <div className="stp">
                <button aria-label="Azalt" onClick={() => ((tb.n = Math.max(1, tb.n - 1)), upd())}>
                  <I.minus size={18} />
                </button>
                <b>{tb.n}</b>
                <button aria-label="Artır" onClick={() => ((tb.n = Math.min(50, tb.n + 1)), upd())}>
                  <I.plus size={18} />
                </button>
              </div>
              <label>Bahşiş</label>
              <div className="chp">
                {[0, 5, 10, 15].map((p) => (
                  <button key={p} className={tb.p === p ? 'on' : ''} onClick={() => ((tb.p = p), upd())}>
                    {p ? '%' + p : 'Yok'}
                  </button>
                ))}
              </div>
              <div className="cres">
                <Row k="Bahşiş" v={money(tp)} />
                <Row k="Toplam" v={money(tot)} />
                <Row k="Kişi başı" v={money(pp)} big />
                <div className="bs">
                  <button className="btn" onClick={() => addAsExpense(pp, onClose)}>
                    Payımı harcama ekle
                  </button>
                </div>
              </div>
            </>
          )
        })()}

      {mode === 't' &&
        (() => {
          const pr = num(tt.a)
          const r = num(tt.r) / 100
          const n = tt.m
          const pm = pr ? (r ? (pr * r) / (1 - Math.pow(1 + r, -n)) : pr / n) : 0
          const total = pm * n
          return (
            <>
              <label>Kredi tutarı (₺)</label>
              <input type="text" inputMode="decimal" placeholder="0" value={tt.a} onChange={(e) => ((tt.a = e.target.value), upd())} />
              <label>Aylık faiz oranı (%)</label>
              <input type="text" inputMode="decimal" value={tt.r} onChange={(e) => ((tt.r = e.target.value), upd())} />
              <label>Vade (ay)</label>
              <div className="chp">
                {[3, 6, 12, 24, 36, 48].map((x) => (
                  <button key={x} className={tt.m === x ? 'on' : ''} onClick={() => ((tt.m = x), upd())}>
                    {x}
                  </button>
                ))}
              </div>
              <div className="cres">
                <Row k="Aylık taksit" v={money(pm)} big />
                <Row k="Toplam geri ödeme" v={money(total)} />
                <Row k="Toplam faiz" v={money(total - pr)} />
                <small className="mut" style={{ display: 'block', padding: '.15rem 0 .7rem', fontWeight: 600 }}>
                  Vergiler (KKDF/BSMV) ve masraflar dahil değildir. Bankanın teklifindeki rakam esastır.
                </small>
              </div>
            </>
          )
        })()}
    </Sheet>
  )
}
