import { AnimatePresence, motion } from 'motion/react'
import { Ico, I, catIcon, type IconName } from '@/components/Icons'
import { Bar, Card, Empty, MonthNav, Num, Reveal, Seg } from '@/components/kit'
import { T, chartData, notifCards, txs, upcomingNotes, weekRows, type Per } from '@/lib/budget'
import { addExpense, addGoal, calNote, goalMoney } from '@/lib/forms'
import { getD, mutate, setS, useApp } from '@/lib/store'
import { ask, showImage } from '@/lib/ui'
import { COL, MN, dfm, pad, sum, tl, today } from '@/lib/util'
import { cn } from '@/lib/utils'

const fmt = (n: number) => tl(n)
const ease = [0.32, 0.72, 0, 1] as const

/* ================= Takvim ================= */
function MiniMonth({ y, m }: { y: number; m: number }) {
  const n = new Date(y, m + 1, 0).getDate()
  const o = (new Date(y, m, 1).getDay() + 6) % 7
  const t = today()
  return (
    <div className="mg" aria-hidden>
      {Array.from({ length: o }, (_, i) => (
        <span key={'o' + i} />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={`${y}-${pad(m + 1)}-${pad(i + 1)}` === t ? 't' : ''}>
          {i + 1}
        </span>
      ))}
    </div>
  )
}
const noteIcon = (k: string): IconName => (k === 'Özel gün' ? 'party' : k === 'Hatırlatma' ? 'clock' : 'note')

export function Calendar() {
  const { D, cv, yr, ym, cd } = useApp()
  const d = D!
  d.nt = d.nt || {}
  if (cv === 'y') {
    const t = T(d, '' + yr)
    return (
      <>
        <MonthNav label={String(yr)} onPrev={() => setS({ yr: yr - 1 })} onNext={() => setS({ yr: yr + 1 })} />
        <div className="hero">
          <small>{yr} yıllık net (gelir − gider − yatırım)</small>
          <div className="big">
            <Num v={t.inc - t.fx - t.dl - t.cp - t.iv} f={fmt} />
          </div>
          <div className="g3">
            <div>
              Gelir<b>{tl(t.inc)}</b>
            </div>
            <div>
              Gider<b>{tl(t.fx + t.dl + t.cp)}</b>
            </div>
            <div>
              Yatırım<b>{tl(t.iv)}</b>
            </div>
          </div>
        </div>
        <div className="cal">
          {MN.map((n, i) => {
            const k = yr + '-' + pad(i + 1)
            const m = T(d, k)
            const v = k === today().slice(0, 7) ? today() : k + '-01'
            return (
              <Reveal key={k} i={i}>
                <motion.div className={cn('card', k === ym && 'on')} whileTap={{ scale: 0.97 }} role="button" tabIndex={0} onClick={() => setS({ ym: k, cd: v, cv: 'm' })} onKeyDown={(e) => e.key === 'Enter' && setS({ ym: k, cd: v, cv: 'm' })}>
                  <h3 style={{ color: 'var(--pk)' }}>{n}</h3>
                  <MiniMonth y={yr} m={i} />
                  <div className="pos">+{tl(m.inc)}</div>
                  <div className="neg">−{tl(m.fx + m.dl + m.cp)}</div>
                  <div style={{ color: 'var(--go)' }}>{tl(m.iv)}</div>
                </motion.div>
              </Reveal>
            )
          })}
        </div>
      </>
    )
  }
  const y = +ym.slice(0, 4)
  const m = +ym.slice(5) - 1
  const n = new Date(y, m + 1, 0).getDate()
  const o = (new Date(y, m, 1).getDay() + 6) % 7
  const mt = T(d, ym)
  const dl = d.daily.filter((x) => x.d === cd)
  const nt = d.nt[cd] || []
  const shift = (k: number) => {
    const dd = new Date(y, m + k, 1)
    const nym = `${dd.getFullYear()}-${pad(dd.getMonth() + 1)}`
    setS({ ym: nym, cd: nym + '-01' })
  }
  return (
    <>
      <div className="mo">
        <button className="ib" onClick={() => setS({ cv: 'y', yr: y })}>
          <I.left size={16} /> {y}
        </button>
        <button className="ib" aria-label="Önceki ay" onClick={() => shift(-1)}>
          <I.left size={18} />
        </button>
        <b>
          {MN[m]} {y}
        </b>
        <button className="ib" aria-label="Sonraki ay" onClick={() => shift(1)}>
          <I.right size={18} />
        </button>
      </div>
      <div className="g3" style={{ margin: '0 0 .6rem' }}>
        {[
          ['Gelir', mt.inc, 'pos'],
          ['Gider', mt.fx + mt.dl + mt.cp, 'neg'],
          ['Yatırım', mt.iv, ''],
        ].map(([l, v, c]) => (
          <div key={l as string} className="card" style={{ margin: 0, padding: '.5rem', background: 'var(--card)', border: '1px solid var(--ln)', color: 'var(--ink)' }}>
            <small className={c as string} style={c ? undefined : { color: 'var(--go)' }}>
              {l}
            </small>
            <b style={{ display: 'block' }}>{tl(v as number)}</b>
          </div>
        ))}
      </div>
      <div className="cg" style={{ marginBottom: '.25rem', textAlign: 'center', fontSize: '.7rem', color: 'var(--mut)', fontWeight: 800 }}>
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((x) => (
          <div key={x}>{x}</div>
        ))}
      </div>
      <div className="cg">
        {Array.from({ length: o }, (_, i) => (
          <div key={'o' + i} />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const k = `${ym}-${pad(i + 1)}`
          const sp = sum(d.daily.filter((x) => x.d === k).map((x) => x.a))
          const nn = (d.nt[k] || []).length
          return (
            <button key={k} className={cn('dc', k === today() && 'td', k === cd && 'sel')} onClick={() => setS({ cd: k })} aria-label={`${i + 1} ${MN[m]}`} aria-pressed={k === cd}>
              <b>{i + 1}</b>
              <span>{sp ? '-' + Math.round(sp) : ''}</span>
              <u>{nn ? '●' : ''}</u>
            </button>
          )
        })}
      </div>
      <Card className="" >
        <div style={{ marginTop: '.75rem' }}>
          <h3>{new Date(cd + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          {nt.map((x) => (
            <div className="row" key={x.id}>
              <i className="ico">
                <Ico n={noteIcon(x.k)} />
              </i>
              <span className="t">
                {x.t}
                <small>{x.k}</small>
              </span>
              <button className="ib" aria-label="Sil" onClick={() => mutate((D2) => void (D2.nt[cd] = D2.nt[cd].filter((z) => z.id !== x.id)))}>
                <I.x size={16} />
              </button>
            </div>
          ))}
          {dl.map((x) => {
            const Ic = catIcon(x.c)
            return (
              <div className="row" key={x.id}>
                <i className="ico">
                  <Ic size={18} />
                </i>
                <span className="t">
                  {x.c}
                  <small>{x.n || ''}</small>
                </span>
                <b>-{tl(x.a)}</b>
                {x.r && (
                  <button className="ib" aria-label="Fişi göster" onClick={() => showImage(`${x.n || x.c} · ${tl(x.a)}`, x.r as string)}>
                    <I.receipt size={16} />
                  </button>
                )}
              </div>
            )
          })}
          {dl.length || nt.length ? (
            <div className="row">
              <span className="t">
                <b>Gün toplamı</b>
              </span>
              <b>-{tl(sum(dl.map((x) => x.a)))}</b>
            </div>
          ) : (
            <Empty>Bu güne ait kayıt yok.</Empty>
          )}
          <div className="bs">
            <button className="btn" onClick={calNote}>
              + Not / özel gün
            </button>
            <button
              className="btn g"
              onClick={() => {
                setS({ day: cd })
                addExpense()
              }}
            >
              + Harcama
            </button>
          </div>
        </div>
      </Card>
    </>
  )
}

/* ================= Grafik ================= */
export function Charts() {
  const { D, per, yr } = useApp()
  const c = chartData(D!, per, yr)
  const W = 360 / c.b.length
  return (
    <>
      <Seg<Per>
        value={per}
        opts={[
          ['gün', 'Gün'],
          ['hafta', 'Hafta'],
          ['ay', 'Ay'],
          ['yıl', 'Yıl'],
        ]}
        onChange={(p) => setS({ per: p })}
      />
      {per === 'ay' && <MonthNav label={String(yr)} onPrev={() => setS({ yr: yr - 1 })} onNext={() => setS({ yr: yr + 1 })} />}
      <div className="hero">
        <small>Toplam harcama</small>
        <div className="big">
          <Num v={c.tot} f={fmt} />
        </div>
      </div>
      <Card>
        <svg viewBox="0 0 360 170" width="100%" role="img" aria-label="Harcama grafiği">
          <defs>
            <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#14b8a6" />
              <stop offset="1" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
          <AnimatePresence mode="wait">
            <motion.g key={per + yr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {c.b.map((x, i) => {
                const h = Math.max((x.v / c.mx) * 130, 2)
                return (
                  <g key={i}>
                    <motion.rect x={i * W + W * 0.18} width={W * 0.64} rx={Math.min(8, W * 0.3)} fill="url(#gb)" initial={{ y: 150, height: 0 }} animate={{ y: 150 - h, height: h }} transition={{ duration: 0.65, delay: i * 0.025, ease }} />
                    <text x={i * W + W / 2} y="165" textAnchor="middle" fontSize={c.b.length > 12 ? 7 : 9} fill="var(--mut)">
                      {x.l}
                    </text>
                  </g>
                )
              })}
            </motion.g>
          </AnimatePresence>
        </svg>
      </Card>
      <Card>
        <h3 style={{ marginBottom: '.5rem' }}>Kategorilere göre</h3>
        {c.cs.length ? (
          c.cs.map((x, i) => (
            <div key={x[0]} style={{ margin: '.65rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', fontSize: '.8rem', fontWeight: 700 }}>
                <span>{x[0]}</span>
                <span>
                  {tl(x[1])} · %{Math.round((x[1] / c.ct) * 100)}
                </span>
              </div>
              <Bar pct={(x[1] / c.ct) * 100} color={COL[i % COL.length]} />
            </div>
          ))
        ) : (
          <Empty>Bu dönemde harcama yok.</Empty>
        )}
      </Card>
    </>
  )
}

/* ================= Bildirimler ================= */
export function Notifs() {
  const { D } = useApp()
  const d = D!
  const cards = notifCards(d)
  const un = upcomingNotes(d)
  const wk = weekRows(d)
  const mt = d.cards.reduce((a, c) => a + (c.m || 0), 0)
  return (
    <>
      <h2>Bildirimler</h2>
      {cards.map((c, i) => (
        <Reveal key={i} i={i}>
          <Card>
            <div className="row" style={{ border: 0, alignItems: 'flex-start' }}>
              <i className="ico">
                <Ico n={c.icon as IconName} />
              </i>
              <span className="t">
                <b>{c.head}</b>
                {c.lines.map((l, k) => (
                  <small key={k}>{l}</small>
                ))}
              </span>
            </div>
          </Card>
        </Reveal>
      ))}
      {un.length > 0 && (
        <Card>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <Ico n="cal" size={16} /> Yaklaşan özel günler ve notlar
          </h3>
          {un.map((x) => (
            <div className="row" key={x.id}>
              <i className="ico">
                <Ico n={noteIcon(x.k)} />
              </i>
              <span className="t">
                {x.t}
                <small>{dfm(x.date)}</small>
              </span>
            </div>
          ))}
        </Card>
      )}
      <Card>
        {wk.map((w) => (
          <div className="row" key={w.i}>
            <i className="ico">
              <Ico n="bell" />
            </i>
            <span className="t">
              <b>{w.i ? 'Haftalık özet' : 'Bu hafta'}</b>
              <small>
                {dfm(w.s)} – {dfm(w.e)}
              </small>
            </span>
            <b>{tl(w.v)}</b>
          </div>
        ))}
      </Card>
      {mt > 0 && (
        <Card>
          <div className="row">
            <i className="ico">
              <Ico n="card" />
            </i>
            <span className="t">
              <b>Kart ödemeleri</b>
              <small>Bu ay ödenecek toplam taksit</small>
            </span>
            <b>{tl(mt)}</b>
          </div>
        </Card>
      )}
    </>
  )
}

/* ================= Hareketler ================= */
export function Transactions() {
  const { D, q, tf } = useApp()
  const l = txs(D!)
    .filter((x) => (tf === 'Tümü' || x.t === tf) && (x.c + ' ' + x.n).toLowerCase().includes(q.toLowerCase()))
    .slice(0, 150)
  return (
    <>
      <h2>Hareketler</h2>
      <div style={{ position: 'relative' }}>
        <I.search size={16} style={{ position: 'absolute', left: '.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mut)', pointerEvents: 'none', marginTop: '-.1rem' }} />
        <input type="search" placeholder="Ara (market, simit, kira…)" value={q} onChange={(e) => setS({ q: e.target.value })} style={{ paddingLeft: '2.4rem' }} />
      </div>
      <div className="chp">
        {['Tümü', 'Gelir', 'Gider', 'Sabit gider', 'Yatırım'].map((t) => (
          <button key={t} className={t === tf ? 'on' : ''} onClick={() => setS({ tf: t })}>
            {t}
          </button>
        ))}
      </div>
      <Card>
        {l.length ? (
          l.map((x, i) => (
            <div className="row" key={i}>
              <span className="t">
                {x.c}
                <small>
                  {dfm(x.d)} · {x.t}
                  {x.n ? ' · ' + x.n : ''}
                </small>
              </span>
              <b className={x.a < 0 ? '' : 'pos'}>
                {x.a < 0 ? '-' : '+'}
                {tl(Math.abs(x.a))}
              </b>
            </div>
          ))
        ) : (
          <Empty>Kayıt bulunamadı.</Empty>
        )}
      </Card>
    </>
  )
}

/* ================= Hedefler ================= */
export function Goals() {
  const { D } = useApp()
  const d = D!
  return (
    <>
      <h2>Hedeflerim</h2>
      <div className="hero">
        <small>Toplam birikim</small>
        <div className="big">
          <Num v={sum(d.gl.map((g) => g.s))} f={fmt} />
        </div>
        <small>Hedef birikimleri ana paradan ayrı takip edilir.</small>
      </div>
      <button className="btn" onClick={addGoal} style={{ marginBottom: '.75rem' }}>
        + Hedef ekle
      </button>
      {d.gl.length ? (
        d.gl.map((g, i) => {
          const p = Math.min(100, (g.s / g.t) * 100)
          return (
            <Reveal key={i} i={i}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
                  <h3>{g.n}</h3>
                  <b>%{Math.round(p)}</b>
                </div>
                <div style={{ margin: '.65rem 0' }}>
                  <Bar pct={p} color="linear-gradient(90deg,#14b8a6,#d9a21b)" />
                </div>
                <small className="mut">
                  {tl(g.s)} / {tl(g.t)}
                </small>
                <div className="bs">
                  <button className="btn g" onClick={() => goalMoney(i)}>
                    Para ekle
                  </button>
                  <button className="btn s" onClick={() => ask('Hedef silinsin mi?', () => mutate((D2) => void D2.gl.splice(i, 1)))}>
                    Sil
                  </button>
                </div>
              </Card>
            </Reveal>
          )
        })
      ) : (
        <Empty>Tatil, araba, acil durum fonu… İlk hedefini ekle.</Empty>
      )}
    </>
  )
}
