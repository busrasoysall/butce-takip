import { getD, getS, setOnSave, setS, uidKey } from './store'
import { normD } from './budget'
import { sb, tok } from './auth'
import { choose, modalOpen } from './ui'
import { jget, jset } from './util'

type Meta = { u?: string; d?: number }
const meta = (): Meta => jget<Meta>('bt_m_' + (getS().user?.uid || ''), {})
const setMeta = (m: Meta) => jset('bt_m_' + (getS().user?.uid || ''), m)

let timer: ReturnType<typeof setTimeout> | undefined
let busy = false
let n = 0

/** Değişiklik var: 1,5 sn sonra buluta gönder. */
export function syd() {
  if (!getS().user) return
  const m = meta()
  m.d = 1
  setMeta(m)
  n++
  clearTimeout(timer)
  timer = setTimeout(() => void sypush(), 1500)
}
setOnSave(syd)

type Row = { updated_at: string; data?: unknown }

export async function sypush(force?: boolean): Promise<void> {
  const s = getS().user
  if (!s || !s.v || busy) return
  let m = meta()
  if (!m.d && !force) return
  busy = true
  const n0 = n
  try {
    const tk = await tok()
    const H = { Prefer: 'return=representation' }
    const q = '/rest/v1/user_data?user_id=eq.' + s.uid
    const D = getD()
    let r: Row[] | null = null
    if (m.u && !force) {
      r = await sb<Row[]>(q + '&updated_at=eq.' + encodeURIComponent(m.u), { m: 'PATCH', tk, h: H, body: { data: D } })
    } else {
      try {
        r = await sb<Row[]>('/rest/v1/user_data', { tk, h: H, body: { user_id: s.uid, data: D } })
      } catch (e) {
        if ((e as { status?: number }).status !== 409) throw e
        if (force) r = await sb<Row[]>(q, { m: 'PATCH', tk, h: H, body: { data: D } })
      }
    }
    if (!r || !r.length) {
      conflict()
      return
    }
    m = meta()
    m.u = r[0].updated_at
    if (n0 === n) m.d = 0
    setMeta(m)
    if (n0 !== n) {
      clearTimeout(timer)
      timer = setTimeout(() => void sypush(), 800)
    }
  } catch {
    /* çevrimdışı: d=1 kalır, internet gelince tekrar denenir */
  } finally {
    busy = false
  }
}

export async function sypull(bg?: boolean, force?: boolean): Promise<void> {
  const s = getS().user
  if (!s || !s.v || busy) return
  try {
    let m = meta()
    if (bg && (m.d || modalOpen())) return
    const tk = await tok()
    const r = await sb<Row[]>('/rest/v1/user_data?select=data,updated_at&user_id=eq.' + s.uid, { m: 'GET', tk })
    m = meta()
    if (!r.length) {
      m.u = ''
      m.d = 1
      setMeta(m)
      return sypush()
    }
    const b = r[0]
    if (!force && m.u === b.updated_at) {
      if (m.d) void sypush()
      return
    }
    if (m.d && !force) return conflict()
    const D = normD(b.data)
    jset(uidKey(), D)
    m.u = b.updated_at
    m.d = 0
    setMeta(m)
    setS({ D, rev: getS().rev + 1 })
  } catch {
    /* sessiz */
  }
}

function conflict() {
  choose('Veri çakışması', 'Bu hesabın verisi başka bir cihazda da değişmiş. Hangisi kalsın?', [
    { label: 'Bu cihazdaki', run: () => void sypush(true) },
    { label: 'Buluttaki', primary: true, run: () => void sypull(false, true) },
  ])
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void sypull(true)
})
addEventListener('online', () => {
  void sypush()
  void sypull(true)
})
