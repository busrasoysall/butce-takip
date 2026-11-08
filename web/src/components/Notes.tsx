import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { I } from './Icons'
import { Seg, Sheet, spring } from './kit'
import { getD, mutate, useApp } from '@/lib/store'
import { ask, toast } from '@/lib/ui'
import { uid } from '@/lib/util'
import { cn } from '@/lib/utils'
import type { Note } from '@/lib/types'
import type { CSSProperties } from 'react'

const NC = ['#14b8a6', '#d9a21b', '#3b82f6', '#f43f5e', '#8b5cf6', '#64748b']
const NCN = ['Zümrüt', 'Altın', 'Mavi', 'Gül', 'Mor', 'Gri']
const cv = (c: string) => ({ '--nc': c }) as CSSProperties

function Dots({ sel, onPick }: { sel: number; onPick: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {NC.map((c, i) => (
        <button key={c} className={cn('nd', sel === i && 'on')} style={cv(c)} aria-label={NCN[i]} onClick={() => onPick(i)} />
      ))}
    </div>
  )
}

export function Notes({ onClose }: { onClose: () => void }) {
  useApp()
  const D = getD()
  D.nb = D.nb || []
  const [q, setQ] = useState('')
  const [text, setText] = useState('')
  const [col, setCol] = useState(0)
  const [typ, setTyp] = useState<'t' | 'l'>('t')
  const [edit, setEdit] = useState<number | null>(null)
  const [eText, setEText] = useState('')
  const [eCol, setECol] = useState(0)

  const ql = q.trim().toLowerCase()
  const list = D.nb.filter((n) => !ql || String(n.t).toLowerCase().includes(ql)).sort((a, b) => (b.p ? 1 : 0) - (a.p ? 1 : 0))

  const save = () => {
    const t = text.trim()
    if (!t) return
    const n = new Date()
    const o: Note = {
      id: uid(),
      t,
      c: col,
      d: n.toLocaleDateString('tr-TR') + ' ' + n.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    }
    if (typ === 'l') {
      o.k = 'l'
      o.it = t
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => ({ t: x, x: 0 }))
    }
    mutate((d) => void d.nb.unshift(o))
    setText('')
    toast(typ === 'l' ? 'Liste eklendi.' : 'Not eklendi.')
  }
  const find = (id: number) => getD().nb.find((x) => x.id === id)
  const pin = (id: number) => mutate(() => {
    const n = find(id)
    if (n) n.p = n.p ? 0 : 1
  })
  const toggle = (id: number, j: number) =>
    mutate(() => {
      const n = find(id)
      if (n?.it?.[j]) n.it[j].x = n.it[j].x ? 0 : 1
    })
  const startEdit = (n: Note) => {
    setEdit(n.id)
    setEText(n.t)
    setECol(n.c || 0)
  }
  const saveEdit = (id: number) => {
    const v = eText.trim()
    if (!v) return toast('Not boş olamaz.')
    mutate(() => {
      const n = find(id)
      if (!n) return
      if (n.k === 'l') {
        const old = n.it || []
        n.it = v
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean)
          .map((t) => ({ t, x: old.find((o) => o.t === t)?.x || 0 }))
      }
      n.t = v
      n.c = eCol
      n.u = 1
    })
    setEdit(null)
    toast('Not güncellendi.')
  }
  const del = (id: number) =>
    ask('Not silinsin mi?', () => {
      mutate((d) => void (d.nb = d.nb.filter((n) => n.id !== id)))
      toast('Not silindi.')
    })

  return (
    <Sheet
      title="Notlarım"
      onClose={onClose}
      head={D.nb.length ? <span className="pill" style={{ background: 'var(--bg)', color: 'var(--mut)' }}>{D.nb.length} not</span> : null}
    >
      <div style={{ position: 'relative', marginBottom: '.6rem' }}>
        <I.search size={16} style={{ position: 'absolute', left: '.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mut)', pointerEvents: 'none' }} />
        <input type="search" placeholder="Notlarda ara…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: '2.4rem', margin: 0 }} />
      </div>
      <div className="ncp">
        <textarea
          placeholder="Yeni not yaz…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && save()}
        />
        <div className="nrw">
          <Dots sel={col} onPick={setCol} />
          <Seg<'t' | 'l'>
            small
            value={typ}
            opts={[
              ['t', 'Not'],
              ['l', 'Liste'],
            ]}
            onChange={setTyp}
          />
          <button className="btn" onClick={save}>
            Ekle
          </button>
        </div>
      </div>

      <div className="ngrid">
        <AnimatePresence initial={false} mode="popLayout">
          {list.length === 0 && (
            <motion.div key="empty" className="nc span" style={{ ...cv('#64748b'), textAlign: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="mut" style={{ fontWeight: 600 }}>
                {D.nb.length ? 'Aramanla eşleşen not yok.' : 'Henüz not yok. Notların sen silmedikçe burada kalır.'}
              </p>
            </motion.div>
          )}
          {list.map((n) =>
            n.id === edit ? (
              <motion.div key={n.id} layout className="nc span" style={cv(NC[eCol])} transition={spring}>
                <textarea value={eText} onChange={(e) => setEText(e.target.value)} style={{ minHeight: '5.5rem' }} />
                <Dots sel={eCol} onPick={setECol} />
                <div className="bs">
                  <button className="btn" onClick={() => saveEdit(n.id)}>
                    Kaydet
                  </button>
                  <button className="btn s" onClick={() => setEdit(null)}>
                    Vazgeç
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key={n.id} layout className="nc" style={cv(NC[n.c || 0])} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={spring}>
                {n.p ? (
                  <span style={{ position: 'absolute', right: '.5rem', top: '.5rem', color: 'var(--nc)', lineHeight: 0 }}>
                    <I.pin size={13} fill="currentColor" />
                  </span>
                ) : null}
                {n.k === 'l' && n.it ? (
                  n.it.map((x, i) => (
                    <div key={i} className={cn('nli', x.x && 'dn')} role="checkbox" aria-checked={!!x.x} tabIndex={0} onClick={() => toggle(n.id, i)} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && toggle(n.id, i)}>
                      <i className="nck" style={{ fontStyle: 'normal' }}>{x.x ? <I.check size={12} strokeWidth={3} /> : null}</i>
                      <span>{x.t}</span>
                    </div>
                  ))
                ) : (
                  <div className="ntx">{n.t}</div>
                )}
                <div className="nft">
                  <small>
                    {n.d}
                    {n.u ? ' · düzenlendi' : ''}
                  </small>
                  <span style={{ display: 'flex', gap: '.1rem', marginLeft: 'auto' }}>
                    <button className={cn('ib', n.p && 'on')} onClick={() => pin(n.id)} aria-label={n.p ? 'Sabitlemeyi kaldır' : 'Sabitle'}>
                      <I.pin size={15} />
                    </button>
                    <button className="ib" onClick={() => startEdit(n)} aria-label="Düzenle">
                      <I.pencil size={15} />
                    </button>
                    <button className="ib" onClick={() => del(n.id)} aria-label="Sil">
                      <I.trash size={15} />
                    </button>
                  </span>
                </div>
              </motion.div>
            ),
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}
