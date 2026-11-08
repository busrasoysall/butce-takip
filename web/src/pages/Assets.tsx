import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { I } from '@/components/Icons'
import { Card, Num, Reveal, Sheet } from '@/components/kit'
import { T, bkc, cb } from '@/lib/budget'
import { addCard, addInvest, cardPay, deleteCard, refreshGold } from '@/lib/forms'
import { ask } from '@/lib/ui'
import { mutate, useApp } from '@/lib/store'
import { GN, GT, dfm, fm, sum, tl } from '@/lib/util'
import { cn } from '@/lib/utils'
import type { Invest as Inv } from '@/lib/types'

const fmt = (n: number) => tl(n)
const MS = ({ a, b }: { a: string; b: string }) => (
  <div style={{ background: 'var(--bg)', borderRadius: '.75rem', padding: '.5rem .65rem', minWidth: 0 }}>
    <small className="mut" style={{ display: 'block' }}>
      {a}
    </small>
    <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{b}</b>
  </div>
)

/* ================= Yatırım ================= */
export function Invest() {
  const { D } = useApp()
  const d = D!
  const G: Record<string, { q: number; a: number; l: Inv[] }> = {}
  let cash = 0
  const cs: Inv[] = []
  d.inv.forEach((x) => {
    if (x.k === 'g') {
      const o = (G[x.g || 'gram'] = G[x.g || 'gram'] || { q: 0, a: 0, l: [] })
      o.q += x.q || 0
      o.a += x.a
      o.l.push(x)
    } else {
      cash += x.a
      cs.push(x)
    }
  })
  let gc = 0
  let gv = 0
  GT.forEach((k) => {
    if (G[k]) {
      gc += G[k].a
      gv += G[k].q * (d.rates[k] || 0)
    }
  })
  const ut = d.rt ? new Date(d.rt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
  const sd = (x: Inv) => dfm(x.d || x.m + '-01')
  const srt = (l: Inv[]) => l.slice().sort((a, b) => (b.d || b.m).localeCompare(a.d || a.m))
  const del = (id: number) => ask('Bu kayıt silinsin mi?', () => mutate((D2) => void (D2.inv = D2.inv.filter((y) => y.id !== id))))
  const setRate = (k: string, v: string) =>
    mutate((D2) => {
      D2.rates[k] = parseFloat(v.replace(',', '.')) || 0
      D2.rt = new Date().toISOString()
      D2.rsrc = 'Elle girildi'
    })

  return (
    <>
      <div className="hero">
        <small>Toplam birikim (güncel değer)</small>
        <div className="big">
          <Num v={cash + gv} f={fmt} />
        </div>
        <div className="g3">
          <div>
            Para birikimi<b>{tl(cash)}</b>
          </div>
          <div>
            Altın alış toplamı<b>{tl(gc)}</b>
          </div>
          <div>
            Altın güncel değer<b>{tl(gv)}</b>
          </div>
        </div>
      </div>
      <div className="bs">
        <button className="btn" onClick={() => addInvest('p')}>
          + Para biriktir
        </button>
        <button className="btn o" onClick={() => addInvest('g')}>
          + Altın al
        </button>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}>
          <h3>Güncel altın fiyatları</h3>
          <button className="btn s" style={{ padding: '.5rem .75rem' }} onClick={() => void refreshGold()}>
            ↻ Güncelle
          </button>
        </div>
        <small className="mut" style={{ display: 'block', margin: '.25rem 0 .5rem' }}>
          {ut ? `Son güncelleme: ${ut} · ${d.rsrc || ''}` : 'Henüz güncellenmedi. Fiyatı elle girebilirsin.'}
        </small>
        {GT.map((k) => (
          <div className="row" key={k}>
            <span className="t">
              {GN[k]}
              {G[k] && <small>Sende: {fm(G[k].q)} adet</small>}
            </span>
            <input
              key={`${k}-${d.rates[k] || ''}`}
              style={{ width: '7.5rem', margin: 0 }}
              type="text"
              inputMode="decimal"
              placeholder="0"
              aria-label={`${GN[k]} fiyatı`}
              defaultValue={d.rates[k] ? String(d.rates[k]).replace('.', ',') : ''}
              onBlur={(e) => (parseFloat(e.target.value.replace(',', '.')) || 0) !== (d.rates[k] || 0) && setRate(k, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
          </div>
        ))}
        <small className="mut" style={{ display: 'block', marginTop: '.4rem' }}>
          Değer, bozdurma (alış) fiyatı üzerinden hesaplanır. Kuyumcudaki fiyat biraz farklı olabilir.
        </small>
      </Card>

      {GT.filter((k) => G[k]).length ? (
        GT.filter((k) => G[k]).map((k, ix) => {
          const o = G[k]
          const cur = d.rates[k] || 0
          const val = o.q * cur
          const pl = val - o.a
          const pp = o.a ? (pl / o.a) * 100 : 0
          return (
            <Reveal key={k} i={ix}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{GN[k]} altın</h3>
                  <b>{fm(o.q)} adet</b>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '.5rem', margin: '.65rem 0' }}>
                  <MS a="Toplam alış" b={tl(o.a)} />
                  <MS a="Ortalama alış (adet başı)" b={tl(o.a / o.q)} />
                  <MS a="Güncel fiyat" b={cur ? tl(cur) : 'girilmedi'} />
                  <MS a="Güncel değer" b={cur ? tl(val) : '—'} />
                </div>
                <div className="row">
                  <span className="t">Kâr / zarar</span>
                  <b className={pl >= 0 ? 'pos' : 'neg'}>{cur ? `${pl >= 0 ? '+' : ''}${tl(pl)} (%${(Math.round(pp * 10) / 10).toString().replace('.', ',')})` : 'Fiyat gir'}</b>
                </div>
                <details>
                  <summary style={{ fontWeight: 700, cursor: 'pointer', padding: '.5rem 0' }}>Alımlar ({o.l.length})</summary>
                  {srt(o.l).map((x) => (
                    <div className="row" key={x.id}>
                      <span className="t">
                        {sd(x)}
                        <small>
                          {fm(x.q || 0)} adet · adet başı {tl(x.a / (x.q || 1))}
                        </small>
                      </span>
                      <b>{tl(x.a)}</b>
                      <button className="ib" aria-label="Sil" onClick={() => del(x.id)}>
                        <I.x size={16} />
                      </button>
                    </div>
                  ))}
                </details>
              </Card>
            </Reveal>
          )
        })
      ) : (
        <Card>
          <p className="mut">Henüz altın alımı yok. "+ Altın al" ile farklı tarih ve fiyatlardaki alımlarını ekle; toplam, ortalama ve kâr/zararı otomatik hesaplarım.</p>
        </Card>
      )}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>Para birikimi</h3>
          <b>{tl(cash)}</b>
        </div>
        {cs.length ? (
          srt(cs)
            .slice(0, 15)
            .map((x) => (
              <div className="row" key={x.id}>
                <span className="t">
                  {sd(x)}
                  <small>{x.n || 'Birikim'}</small>
                </span>
                <b className="pos">+{tl(x.a)}</b>
                <button className="ib" aria-label="Sil" onClick={() => del(x.id)}>
                  <I.x size={16} />
                </button>
              </div>
            ))
        ) : (
          <p className="mut" style={{ margin: '.5rem 0' }}>
            Henüz para birikimi yok.
          </p>
        )}
      </Card>
    </>
  )
}

/* ================= Kredi kartları ================= */
function CardDetail({ i, onClose }: { i: number; onClose: () => void }) {
  const { D } = useApp()
  const d = D!
  const c = d.cards[i]
  if (!c) return null
  const spent = d.daily.filter((x) => x.s == c.id).slice(-6).reverse()
  return (
    <Sheet title={c.n} onClose={onClose}>
      <div className="hero">
        <small>Kalan borç</small>
        <div className="big">{tl(cb(d, c))}</div>
        <small>Aylık taksit {tl(c.m || 0)}</small>
      </div>
      <Card>
        <b>Kartla yapılan harcamalar</b>
        {spent.length ? (
          spent.map((x) => (
            <div className="row" key={x.id}>
              <span className="t">
                {x.c}
                <small>
                  {x.d}
                  {x.n ? ' · ' + x.n : ''}
                </small>
              </span>
              <b>{tl(x.a)}</b>
            </div>
          ))
        ) : (
          <small className="mut" style={{ display: 'block' }}>
            Bu karttan henüz harcama yok.
          </small>
        )}
      </Card>
      <div className="bs">
        <button
          className="btn g"
          onClick={() => {
            onClose()
            cardPay(i, 'o')
          }}
        >
          Borç öde
        </button>
        <button
          className="btn o"
          onClick={() => {
            onClose()
            cardPay(i, 'b')
          }}
        >
          Yeni kredi çek
        </button>
        <button className="btn s" onClick={() => deleteCard(i, onClose)}>
          Sil
        </button>
      </div>
      {c.h.length ? (
        c.h
          .slice()
          .reverse()
          .map((h, k) => (
            <div className="row" key={k}>
              <span className="t">
                {h.t === 'o' ? 'Ödeme' : 'Yeni borç'}
                <small>{h.d}</small>
              </span>
              <b className={h.t === 'o' ? 'pos' : 'neg'}>
                {h.t === 'o' ? '-' : '+'}
                {tl(h.a)}
              </b>
            </div>
          ))
      ) : (
        <p className="mut">Henüz hareket yok.</p>
      )}
    </Sheet>
  )
}

export function Cards() {
  const { D, ym } = useApp()
  const d = D!
  const [open, setOpen] = useState<number | null>(null)
  const td = sum(d.cards.map((c) => cb(d, c)))
  const mp = sum(d.cards.map((c) => c.m || 0))
  return (
    <>
      <div className="hero">
        <small>Toplam borç</small>
        <div className="big">
          <Num v={td} f={fmt} />
        </div>
        <div className="g3" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
          <div>
            Bu ay ödenecek<b>{tl(mp)}</b>
          </div>
          <div>
            Bu ay ödenen<b>{tl(T(d, ym).cp)}</b>
          </div>
        </div>
      </div>
      <button className="btn" onClick={addCard} style={{ marginBottom: '.9rem' }}>
        + Kart / kredi ekle
      </button>
      <div>
        {d.cards.length ? (
          d.cards.map((c, i) => (
            <Reveal key={String(c.id)} i={i}>
              <motion.div className={cn('cd')} style={{ background: bkc(c) }} role="button" tabIndex={0} whileTap={{ scale: 0.98 }} onClick={() => setOpen(i)} onKeyDown={(e) => e.key === 'Enter' && setOpen(i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
                  <span style={{ fontWeight: 800 }}>{c.n}</span>
                  <I.card size={20} />
                </div>
                <div className="chip" />
                <small>Kalan borç</small>
                <br />
                <b>{tl(cb(d, c))}</b>
                <br />
                <small>Aylık taksit: {tl(c.m || 0)}</small>
              </motion.div>
            </Reveal>
          ))
        ) : (
          <p className="mut">Henüz kart yok. Her bankan için bir kart ekle, borcunu takip et.</p>
        )}
      </div>
      <AnimatePresence>{open !== null && <CardDetail key="cd" i={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </>
  )
}
