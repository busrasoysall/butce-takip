import { AnimatePresence, MotionConfig, animate, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { I } from './Icons'
import {
  closeItem,
  sheetCount,
  submitForm,
  toast as _toast,
  useUI,
  type AskItem,
  type ChooseItem,
  type FormItem,
  type ImageItem,
  type TextItem,
} from '@/lib/ui'
import { cn } from '@/lib/utils'

export { _toast }
export const spring = { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 } as const
const ease = [0.32, 0.72, 0, 1] as const

export const Motion = ({ children }: { children: ReactNode }) => <MotionConfig reducedMotion="user">{children}</MotionConfig>

/* ---- Sayfa geçişi ve liste girişi ---- */
export function Page({ children, k }: { children: ReactNode; k: string }) {
  return (
    <motion.div key={k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease }}>
      {children}
    </motion.div>
  )
}
export function Reveal({ children, i = 0, className }: { children: ReactNode; i?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.045, ease }}>
      {children}
    </motion.div>
  )
}

/* ---- Sayıların yumuşak değişimi ---- */
export function Num({ v, f }: { v: number; f: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(v)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || prev.current === v) {
      if (ref.current) ref.current.textContent = f(v)
      prev.current = v
      return
    }
    const c = animate(prev.current, v, { duration: 0.6, ease: 'easeOut', onUpdate: (x) => ref.current && (ref.current.textContent = f(x)) })
    prev.current = v
    return () => c.stop()
  }, [v, f])
  return <span ref={ref}>{f(v)}</span>
}

/* ---- İlerleme çubuğu ---- */
export function Bar({ pct, color, h }: { pct: number; color: string; h?: string }) {
  return (
    <div className="bar" style={h ? { height: h } : undefined}>
      <motion.i initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }} transition={{ duration: 0.7, ease }} style={{ background: color }} />
    </div>
  )
}

/* ---- Segment (kayan seçili arka plan) ---- */
export function Seg<T extends string>({ value, opts, onChange, small, className }: { value: T; opts: [T, string][]; onChange: (v: T) => void; small?: boolean; className?: string }) {
  const id = useId()
  return (
    <div className={cn('seg', small && 's2', className)} role="tablist">
      {opts.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>
          {value === k && <motion.span layoutId={id} className="pillbg" transition={spring} />}
          <span>{l}</span>
        </button>
      ))}
    </div>
  )
}

/* ---- Alt sayfa (sheet) ---- */
export function Sheet({ title, onClose, children, head }: { title?: string; onClose: () => void; children: ReactNode; head?: ReactNode }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    sheetCount(1)
    document.documentElement.classList.add('noscroll')
    const k = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', k)
    return () => {
      sheetCount(-1)
      window.removeEventListener('keydown', k)
      // çıkış animasyonu bitene kadar kilit kalır; başka açık pencere yoksa kaldır
      setTimeout(() => {
        if (!document.querySelector('.mod')) document.documentElement.classList.remove('noscroll')
      }, 300)
    }
  }, [])
  return (
    <motion.div className="mod" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="panel" role="dialog" aria-modal="true" aria-label={title} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}>
        <div className="grab" />
        {(title || head) && (
          <div className="xh">
            {title && <h2>{title}</h2>}
            {head}
            <button className="ib" onClick={onClose} aria-label="Kapat">
              <I.x size={18} />
            </button>
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ---- Ortalanmış küçük pencere ---- */
function Dlg({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  return (
    <motion.div className="mod ctr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="panel dlg" role="alertdialog" aria-modal="true" initial={{ scale: 0.92, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} transition={spring}>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ---- Form penceresi ---- */
function FormSheet({ item }: { item: FormItem }) {
  const [vals, setVals] = useState<string[]>(() => item.fields.map((f) => String(f[2] ?? '')))
  const close = () => closeItem(item.id)
  const submit = () => {
    const v = item.fields.map((f, i) => {
      const r = vals[i]
      return f[1] === 'number' ? parseFloat(String(r).replace(',', '.')) || 0 : r.trim()
    })
    submitForm(item, v)
  }
  return (
    <Sheet title={item.title} onClose={close}>
      {item.top}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {item.fields.map((f, i) => (
          <div key={i}>
            <label htmlFor={`f${item.id}_${i}`}>{f[0]}</label>
            {f[1] === 's' ? (
              <select id={`f${item.id}_${i}`} value={vals[i]} onChange={(e) => setVals(vals.map((x, j) => (j === i ? e.target.value : x)))}>
                {(f[3] || []).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                id={`f${item.id}_${i}`}
                type={f[1] === 'number' ? 'text' : f[1]}
                inputMode={f[1] === 'number' ? 'decimal' : undefined}
                autoCapitalize="none"
                autoComplete={f[1] === 'password' ? 'current-password' : 'off'}
                value={vals[i]}
                onChange={(e) => setVals(vals.map((x, j) => (j === i ? e.target.value : x)))}
              />
            )}
          </div>
        ))}
        <div className="bs">
          <button type="submit" className="btn">
            Kaydet
          </button>
          {item.del && (
            <button
              type="button"
              className="btn o"
              onClick={() => {
                item.del?.()
                close()
              }}
            >
              Sil
            </button>
          )}
          <button type="button" className="btn s" onClick={close}>
            Vazgeç
          </button>
        </div>
      </form>
    </Sheet>
  )
}

function AskDlg({ item }: { item: AskItem }) {
  const close = () => closeItem(item.id)
  return (
    <Dlg onClose={close}>
      <p style={{ fontWeight: 700, marginBottom: '.9rem' }}>{item.msg}</p>
      <div className="bs" style={{ justifyContent: 'center' }}>
        <button className="btn s" onClick={close}>
          Vazgeç
        </button>
        <button
          className="btn o"
          onClick={() => {
            close()
            item.cb()
          }}
        >
          Evet
        </button>
      </div>
    </Dlg>
  )
}
function ChooseDlg({ item }: { item: ChooseItem }) {
  const close = () => closeItem(item.id)
  return (
    <Dlg onClose={close}>
      <p style={{ fontWeight: 800, marginBottom: '.4rem' }}>{item.title}</p>
      <p className="mut" style={{ fontSize: '.8rem', marginBottom: '.9rem' }}>
        {item.msg}
      </p>
      <div className="bs" style={{ justifyContent: 'center' }}>
        {item.opts.map((o) => (
          <button
            key={o.label}
            className={cn('btn', !o.primary && 's')}
            onClick={() => {
              close()
              o.run()
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Dlg>
  )
}
function TextDlg({ item }: { item: TextItem }) {
  const close = () => closeItem(item.id)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => ref.current?.select(), [])
  return (
    <Sheet title={item.title} onClose={close}>
      <textarea ref={ref} readOnly defaultValue={item.text} style={{ height: '10rem' }} />
      <p className="mut" style={{ fontSize: '.75rem', margin: '.3rem 0' }}>
        Metni seçip kopyala.
      </p>
      <button className="btn" onClick={close}>
        Kapat
      </button>
    </Sheet>
  )
}
function ImageDlg({ item }: { item: ImageItem }) {
  const close = () => closeItem(item.id)
  return (
    <Sheet title={item.title} onClose={close}>
      <img src={item.src} alt="Fiş" style={{ maxWidth: '100%', borderRadius: '.9rem', display: 'block', margin: '0 auto' }} />
    </Sheet>
  )
}

/* ---- Tüm pencereler ve bildirimler tek yerde ---- */
export function UIHost() {
  const { items, toasts } = useUI()
  return (
    <>
      <AnimatePresence>
        {items.map((it) =>
          it.kind === 'form' ? <FormSheet key={it.id} item={it} /> : it.kind === 'ask' ? <AskDlg key={it.id} item={it} /> : it.kind === 'choose' ? <ChooseDlg key={it.id} item={it} /> : it.kind === 'text' ? <TextDlg key={it.id} item={it} /> : <ImageDlg key={it.id} item={it} />,
        )}
      </AnimatePresence>
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} className="toast" initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={spring}>
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

/* ---- Küçük yardımcı bileşenler ---- */
export const Card = ({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => (
  <div className={cn('card', className)} onClick={onClick}>
    {children}
  </div>
)
export const Empty = ({ children }: { children: ReactNode }) => (
  <p className="mut" style={{ margin: '.5rem 0' }}>
    {children}
  </p>
)
export function MonthNav({ label, onPrev, onNext, left }: { label: string; onPrev: () => void; onNext: () => void; left?: ReactNode }) {
  return (
    <div className="mo">
      {left}
      <button className="ib" onClick={onPrev} aria-label="Önceki">
        <I.left size={18} />
      </button>
      <b>{label}</b>
      <button className="ib" onClick={onNext} aria-label="Sonraki">
        <I.right size={18} />
      </button>
    </div>
  )
}
