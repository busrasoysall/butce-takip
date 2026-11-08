import { motion } from 'motion/react'
import { Ico, catIcon, I } from '@/components/Icons'
import { Bar, Card, Empty, MonthNav, Num, Reveal } from '@/components/kit'
import { T } from '@/lib/budget'
import { addCategory, addExpense, addIncome, addIncomeField, catLimit, copyLastMonth, dueDay, removeCategory, setFixed } from '@/lib/forms'
import { getD, mutate, setS, shiftMonth, useApp } from '@/lib/store'
import { showImage } from '@/lib/ui'
import { MN, add, sum, tl } from '@/lib/util'

const fmt = (n: number) => tl(n)
const monthLabel = (ym: string) => `${MN[+ym.slice(5) - 1]} ${ym.slice(0, 4)}`

/* ================= Gelir ================= */
export function Income() {
  const { D, ym } = useApp()
  const d = D!
  const l = d.inc.filter((x) => x.m === ym)
  const mi = T(d, ym).inc
  return (
    <>
      <MonthNav label={monthLabel(ym)} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />
      <div className="hero">
        <small>Bu ay toplam gelir</small>
        <div className="big">
          <Num v={mi} f={fmt} />
        </div>
      </div>
      <div className="bs">
        <button className="btn" onClick={() => addIncome('Maaş')}>
          + Maaş
        </button>
        <button className="btn g" onClick={() => addIncome('Ek gelir')}>
          + Ek gelir
        </button>
        <button className="btn s" onClick={addIncomeField}>
          Ek gelir alanı ekle
        </button>
      </div>
      <Card>
        {l.length ? (
          l.map((x, i) => (
            <Reveal key={x.id} i={i}>
              <div className="row">
                <i className="ico">
                  <Ico n={x.t === 'Maaş' ? 'bag' : 'spark'} />
                </i>
                <span className="t">
                  {x.t === 'Maaş' ? 'Maaş' : x.s}
                  <small>{x.t}</small>
                </span>
                <b className="pos">+{tl(x.a)}</b>
                <button className="ib" aria-label="Sil" onClick={() => mutate((D2) => void (D2.inc = D2.inc.filter((y) => y.id !== x.id)))}>
                  <I.x size={16} />
                </button>
              </div>
            </Reveal>
          ))
        ) : (
          <Empty>Bu ay henüz gelir yok. Maaşını ekleyerek başla.</Empty>
        )}
      </Card>
    </>
  )
}

/* ================= Sabit giderler ================= */
export function Fixed() {
  const { D, ym } = useApp()
  const d = D!
  const f = d.fx[ym] || {}
  const t = sum(Object.values(f))
  return (
    <>
      <MonthNav label={monthLabel(ym)} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />
      <div className="hero">
        <small>Sabit giderler toplamı</small>
        <div className="big">
          <Num v={t} f={fmt} />
        </div>
      </div>
      <Card>
        {d.cats.map((c, i) => {
          const Ic = catIcon(c)
          return (
            <div className="row" key={c + i}>
              <i className="ico">
                <Ic size={18} />
              </i>
              <button type="button" className="t" onClick={() => dueDay(i)} style={{ background: 'none', border: 0, textAlign: 'left', color: 'inherit', font: 'inherit', padding: 0 }}>
                {c}
                <small>{d.due?.[c] ? `Her ayın ${d.due[c]}. günü · değiştir` : 'Ödeme günü ekle'}</small>
              </button>
              <input
                key={`${ym}-${c}-${f[c] || ''}`}
                style={{ width: '6.2rem', margin: 0 }}
                type="text"
                inputMode="decimal"
                placeholder="0"
                aria-label={`${c} tutarı`}
                defaultValue={f[c] || ''}
                onBlur={(e) => (parseFloat(e.target.value.replace(',', '.')) || 0) !== (f[c] || 0) && setFixed(i, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
              <button className="ib" aria-label={`${c} kategorisini kaldır`} onClick={() => removeCategory('cats', i)}>
                <I.x size={16} />
              </button>
            </div>
          )
        })}
      </Card>
      <div className="bs">
        <button className="btn g" onClick={copyLastMonth}>
          ↺ Geçen ayın tutarlarını kopyala
        </button>
        <button className="btn" onClick={() => addCategory('cats')}>
          + Kategori ekle
        </button>
      </div>
    </>
  )
}

/* ================= Günlük harcama ================= */
function CategoryLimits({ day }: { day: string }) {
  const d = getD()
  const m = day.slice(0, 7)
  const sp: Record<string, number> = {}
  d.daily.filter((x) => x.d.startsWith(m)).forEach((x) => (sp[x.c] = (sp[x.c] || 0) + x.a))
  return (
    <Card>
      <h3>Aylık kategori limitleri</h3>
      <small className="mut">Limit koymak için kategoriye dokun. Yeşil: iyi · Sarı: dikkat · Kırmızı: aşıldı.</small>
      {d.dcats.map((c, i) => {
        const l = d.cl[c] || 0
        const s = sp[c] || 0
        const p = l ? (s / l) * 100 : 0
        const col = p > 100 ? 'var(--rd)' : p > 75 ? 'var(--go)' : 'var(--te)'
        return (
          <button key={c} type="button" onClick={() => catLimit(i)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, padding: 0, margin: '.8rem 0', color: 'inherit', font: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', fontSize: '.8rem', fontWeight: 700 }}>
              <span>{c}</span>
              <span>
                {tl(s)}
                {l ? ' / ' + tl(l) : ' · limit yok'}
              </span>
            </div>
            <Bar pct={Math.min(100, p)} color={col} />
          </button>
        )
      })}
    </Card>
  )
}

export function Daily() {
  const { D, day } = useApp()
  const d = D!
  const l = d.daily.filter((x) => x.d === day)
  const t = sum(l.map((x) => x.a))
  return (
    <>
      <div className="mo">
        <button className="ib" aria-label="Önceki gün" onClick={() => setS({ day: add(day, -1) })}>
          <I.left size={18} />
        </button>
        <input type="date" value={day} onChange={(e) => setS({ day: e.target.value || day })} style={{ width: 'auto', margin: 0, flex: '0 1 11rem' }} aria-label="Tarih" />
        <button className="ib" aria-label="Sonraki gün" onClick={() => setS({ day: add(day, 1) })}>
          <I.right size={18} />
        </button>
      </div>
      <div className="hero">
        <small>Bu gün harcanan</small>
        <div className="big">
          <Num v={t} f={fmt} />
        </div>
      </div>
      <div className="bs">
        <button className="btn" onClick={() => addExpense()}>
          + Harcama ekle
        </button>
        <button className="btn s" onClick={() => addCategory('dcats')}>
          Kategori ekle
        </button>
      </div>
      <Card>
        {l.length ? (
          l.map((x, i) => {
            const Ic = catIcon(x.c)
            const card = x.s ? d.cards.find((c) => c.id == x.s) : null
            return (
              <Reveal key={x.id} i={i}>
                <div className="row">
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
                  {x.r && (
                    <button className="ib" aria-label="Fişi göster" onClick={() => showImage(`${x.n || x.c} · ${tl(x.a)}`, x.r as string)}>
                      <I.receipt size={16} />
                    </button>
                  )}
                  <button className="ib" aria-label="Sil" onClick={() => mutate((D2) => void (D2.daily = D2.daily.filter((y) => y.id !== x.id)))}>
                    <I.x size={16} />
                  </button>
                </div>
              </Reveal>
            )
          })
        ) : (
          <Empty>Bu gün için harcama yok.</Empty>
        )}
      </Card>
      <CategoryLimits day={day} />
      <Card>
        <h3>Kategoriler</h3>
        <div className="bs">
          {d.dcats.map((c, i) => (
            <motion.button key={c} whileTap={{ scale: 0.95 }} className="btn s" onClick={() => removeCategory('dcats', i)}>
              {c} <I.x size={14} />
            </motion.button>
          ))}
        </div>
      </Card>
    </>
  )
}
