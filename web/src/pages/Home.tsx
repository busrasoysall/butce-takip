import { motion } from 'motion/react'
import { Ico, catIcon, type IconName } from '@/components/Icons'
import { Bar, MonthNav, Num, Reveal } from '@/components/kit'
import { T, cb, health, insights, upcoming } from '@/lib/budget'
import { addExpense } from '@/lib/forms'
import { getD, go, setS, shiftMonth, useApp, userName } from '@/lib/store'
import type { Tab } from '@/lib/types'
import { COL, MN, sum, tl, today } from '@/lib/util'

const fmt = (n: number) => tl(n)

export function TodayCard() {
  const { D } = useApp()
  const d = D!
  const t = today()
  const l = d.daily.filter((x) => x.d === t)
  const s = sum(l.map((x) => x.a))
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Bugünün harcamaları</h3>
        <b>
          <Num v={s} f={fmt} />
        </b>
      </div>
      {l.length ? (
        <>
          {l
            .slice(-3)
            .reverse()
            .map((x) => {
              const Ic = catIcon(x.c)
              const card = x.s ? d.cards.find((c) => c.id == x.s) : null
              return (
                <div className="row" key={x.id}>
                  <i className="ico">
                    <Ic size={18} />
                  </i>
                  <span className="t">
                    {x.c}
                    <small>
                      {x.n || ''}
                      {x.s ? ' · ' + (card?.n || 'Kart') : ''}
                    </small>
                  </span>
                  <b>-{tl(x.a)}</b>
                </div>
              )
            })}
          {l.length > 3 && <small className="mut">+{l.length - 3} harcama daha</small>}
        </>
      ) : (
        <p className="mut" style={{ margin: '.5rem 0' }}>
          Bugün henüz harcama girmedin.
        </p>
      )}
      <div className="bs">
        <button
          className="btn"
          onClick={() => {
            setS({ day: today() })
            addExpense()
          }}
        >
          + Harcama ekle
        </button>
        <button
          className="btn s"
          onClick={() => {
            setS({ day: today() })
            go('dly')
          }}
        >
          Tümünü gör
        </button>
      </div>
    </div>
  )
}

const QG: { l: string; icon: IconName; tab?: Tab; bg: string }[] = [
  { l: 'Gelir', icon: 'wallet', tab: 'inc', bg: 'linear-gradient(135deg,var(--a1),var(--a2))' },
  { l: 'Harcama', icon: 'cart', bg: 'linear-gradient(135deg,#f6c850,#d9a21b)' },
  { l: 'Yatırım', icon: 'coins', tab: 'inv', bg: 'linear-gradient(135deg,#2b5fd9,#1e3a8a)' },
  { l: 'Kartlar', icon: 'card', tab: 'crd', bg: 'linear-gradient(135deg,#6366f1,#3b2a6b)' },
]
function QuickGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '.625rem', marginBottom: '.875rem' }}>
      {QG.map((q) => (
        <motion.button
          key={q.l}
          whileTap={{ scale: 0.94 }}
          className="card"
          style={{ margin: 0, padding: '.75rem .1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', color: 'var(--ink)', fontWeight: 800, fontSize: '.7rem', minWidth: 0 }}
          onClick={() => {
            if (q.tab) go(q.tab)
            else {
              setS({ day: today() })
              addExpense()
            }
          }}
        >
          <span style={{ display: 'grid', placeItems: 'center', width: '2.75rem', height: '2.75rem', borderRadius: '.95rem', background: q.bg, color: '#fff' }}>
            <Ico n={q.icon} size={21} />
          </span>
          {q.l}
        </motion.button>
      ))}
    </div>
  )
}

function HealthCard({ ym }: { ym: string }) {
  const h = health(getD(), ym)
  const col = h.tone === 'good' ? 'var(--te)' : h.tone === 'ok' ? '#84cc16' : h.tone === 'warn' ? 'var(--go)' : 'var(--rd)'
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
      <svg viewBox="0 0 100 100" width="84" height="84" style={{ transform: 'rotate(-90deg)', flex: 'none' }} aria-hidden>
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--ln)" strokeWidth="12" />
        <motion.circle cx="50" cy="50" r="40" fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" initial={{ strokeDasharray: '0 251.3' }} animate={{ strokeDasharray: `${h.sc * 2.513} 251.3` }} transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }} />
      </svg>
      <div style={{ minWidth: 0 }}>
        <small className="mut" style={{ display: 'block' }}>
          Finansal sağlık skoru
        </small>
        <h2 style={{ margin: 0, color: col }}>
          {h.sc} · {h.label}
        </h2>
        <small className="mut">{h.tip}</small>
      </div>
    </div>
  )
}

function Insights({ ym }: { ym: string }) {
  const D = getD()
  const x = insights(D, ym)
  const col = x.ratio > 90 ? 'var(--rd)' : x.ratio > 70 ? 'var(--go)' : 'var(--te)'
  const up = upcoming(D, ym)
  const mx = Math.max(1, ...x.six.map((s) => Math.max(s.a, s.e)))
  const ct = sum(x.cats.map((c) => c[1])) || 1
  let o = 0
  const C = 251.3
  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>Gelirin ne kadarı harcandı?</h3>
          <b style={{ color: col }}>%{Math.round(x.ratio)}</b>
        </div>
        <div style={{ marginTop: '.6rem' }}>
          <Bar pct={x.ratio} color={col} />
        </div>
        <small className="mut">
          {tl(x.sp)} / {tl(x.base)} {D.lim ? '(limitin)' : '(gelirin)'}
        </small>
      </div>

      <HealthCard ym={ym} />

      {up.length > 0 && (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <Ico n="bell" size={16} /> Yaklaşan ödemeler
          </h3>
          {up.map((u) => (
            <div className="row" key={u.c}>
              <span className="t">
                {u.c}
                <small>Ayın {u.d}. günü</small>
              </span>
              <b className={u.k < 0 ? 'neg' : ''}>{u.k < 0 ? -u.k + ' gün gecikti' : u.k === 0 ? 'Bugün' : u.k + ' gün kaldı'}</b>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Ay sonu tahmini</h3>
        <div className="row">
          <span className="t">Günlük ortalama harcama</span>
          <b>{tl(x.av)}</b>
        </div>
        <div className="row">
          <span className="t">Bu gidişle ay sonu harcaman</span>
          <b className={x.bad ? 'neg' : 'pos'}>{tl(x.pj)}</b>
        </div>
        <small style={{ color: x.bad ? 'var(--rd)' : 'var(--mut)' }}>
          {x.bad ? 'Bu tempoda limitini aşacaksın. Günlük harcamayı kısmayı dene.' : x.lm ? 'Tempon iyi, limitin içinde kalıyorsun.' : "Daha doğru tahmin için Ayarlar'dan aylık limit belirle."}
        </small>
      </div>

      <div className="card">
        <h3>Son 6 ay: gelir ve harcama</h3>
        <svg viewBox="0 0 300 130" width="100%" role="img" aria-label="Son 6 ay gelir ve harcama grafiği">
          {x.six.map((s, i) => {
            const ha = Math.max(2, (s.a / mx) * 95)
            const he = Math.max(2, (s.e / mx) * 95)
            return (
              <g key={i}>
                <motion.rect x={i * 50 + 8} width="15" rx="4" fill="#14b8a6" initial={{ y: 105, height: 0 }} animate={{ y: 105 - ha, height: ha }} transition={{ duration: 0.7, delay: i * 0.05, ease: [0.32, 0.72, 0, 1] }} />
                <motion.rect x={i * 50 + 26} width="15" rx="4" fill="#d9a21b" initial={{ y: 105, height: 0 }} animate={{ y: 105 - he, height: he }} transition={{ duration: 0.7, delay: i * 0.05 + 0.04, ease: [0.32, 0.72, 0, 1] }} />
                <text x={i * 50 + 25} y="124" textAnchor="middle" fontSize="9" fill="var(--mut)">
                  {s.l}
                </text>
              </g>
            )
          })}
        </svg>
        <small className="mut">Turkuaz: gelir · Altın: harcama</small>
      </div>

      <div className="card">
        <h3>Bu ayın harcama dağılımı</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem', marginTop: '.5rem' }}>
          <svg viewBox="0 0 100 100" width="110" height="110" style={{ transform: 'rotate(-90deg)', flex: 'none' }} aria-hidden>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--ln)" strokeWidth="14" />
            {x.cats.map((c, i) => {
              const p = (c[1] / ct) * C
              const off = -o
              o += p
              return <motion.circle key={c[0]} cx="50" cy="50" r="40" fill="none" stroke={COL[i % COL.length]} strokeWidth="14" strokeDashoffset={off} initial={{ strokeDasharray: `0 ${C}` }} animate={{ strokeDasharray: `${p} ${C}` }} transition={{ duration: 0.8, delay: i * 0.06, ease: [0.32, 0.72, 0, 1] }} />
            })}
          </svg>
          <div style={{ flex: 1, fontSize: '.75rem', minWidth: 0 }}>
            {x.cats.length ? (
              x.cats.slice(0, 5).map((c, i) => (
                <div key={c[0]} style={{ display: 'flex', gap: '.4rem', margin: '.25rem 0', alignItems: 'center' }}>
                  <i style={{ width: '.65rem', height: '.65rem', borderRadius: '.2rem', background: COL[i % COL.length], flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c[0]}</span>
                  <b>{tl(c[1])}</b>
                </div>
              ))
            ) : (
              <span className="mut">Henüz harcama yok.</span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export function Home() {
  const { D, ym } = useApp()
  const d = D!
  const a = T(d, '')
  const m = T(d, ym)
  const name = userName()
  let i = 0
  return (
    <>
      <Reveal i={i++}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', margin: '.25rem 0 .875rem' }}>
          <div className="av">{(name[0] || '?').toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <small className="mut" style={{ fontWeight: 700, display: 'block' }}>
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </small>
            <h2 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Merhaba, {name}</h2>
          </div>
        </div>
      </Reveal>

      <Reveal i={i++}>
        <div className="hero">
          <small>Ana paran</small>
          <div className="big">
            <Num v={a.bal} f={fmt} />
          </div>
          {a.bal < 0 ? <small>Ana paran bitti, {tl(-a.bal)} içeriden harcadın (borçtasın).</small> : <small>Tüm aylar toplamı, harcamalar buradan düşer.</small>}
          <div className="g3">
            <div>
              Gelir<b>{tl(a.inc)}</b>
            </div>
            <div>
              Harcama<b>{tl(a.fx + a.dl + a.cp)}</b>
            </div>
            <div>
              Yatırım<b>{tl(a.iv)}</b>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal i={i++}>
        <TodayCard />
      </Reveal>
      <Reveal i={i++}>
        <QuickGrid />
      </Reveal>
      <Reveal i={i++}>
        <MonthNav label={`${MN[+ym.slice(5) - 1]} ${ym.slice(0, 4)}`} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />
        <div className="card">
          <div className="row">
            <span className="t">Gelir</span>
            <b className="pos">+{tl(m.inc)}</b>
          </div>
          <div className="row">
            <span className="t">Sabit giderler</span>
            <b>-{tl(m.fx)}</b>
          </div>
          <div className="row">
            <span className="t">Günlük harcamalar</span>
            <b>-{tl(m.dl)}</b>
          </div>
          <div className="row">
            <span className="t">Kart ödemeleri</span>
            <b>-{tl(m.cp)}</b>
          </div>
          <div className="row">
            <span className="t">
              Kartla harcanan<small>Ay sonu karta ödenecek</small>
            </span>
            <b>{tl(m.dc)}</b>
          </div>
          <div className="row">
            <span className="t">Yatırım</span>
            <b>-{tl(m.iv)}</b>
          </div>
          <div className="row">
            <span className="t">
              <b>Ay sonu kalan</b>
            </span>
            <b className={m.bal < 0 ? 'neg' : 'pos'}>{tl(m.bal)}</b>
          </div>
        </div>
      </Reveal>
      <Reveal i={i++}>
        <Insights ym={ym} />
      </Reveal>
      <Reveal i={i++}>
        <div className="bs">
          <button className="btn" onClick={() => go('dly')}>
            + Harcama ekle
          </button>
          <button className="btn g" onClick={() => go('inc')}>
            + Gelir ekle
          </button>
        </div>
      </Reveal>
    </>
  )
}

export { cb }
