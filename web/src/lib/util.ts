export const MN = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
export const COL = ['#0f9d8a', '#d9a21b', '#2b5fd9', '#6366f1', '#dc4a4a', '#84cc16', '#f97316', '#0ea5e9', '#a855f7', '#14b8a6']
export const GN: Record<string, string> = { gram: 'Gram', ceyrek: 'Çeyrek', yarim: 'Yarım', tam: 'Tam' }
export const GT = ['gram', 'ceyrek', 'yarim', 'tam']

export const pad = (n: number) => String(n).padStart(2, '0')
export const ds = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => ds(new Date())
export const add = (s: string, n: number) => {
  const d = new Date(s + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return ds(d)
}
export const tl = (n: number) => `${(Math.round(n) || 0).toLocaleString('tr-TR')} ₺`
export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
export const uid = () => Date.now() + Math.random()
export const dfm = (d: string) => d.split('-').reverse().join('.')
export const fm = (v: number) => String(Math.round(v * 1e8) / 1e8).replace('.', ',')
export const lw = (s: string) => String(s).toLocaleLowerCase('tr')
export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function jget<T>(k: string, d: T): T {
  try {
    const v = localStorage.getItem(k)
    return v ? (JSON.parse(v) as T) || d : d
  } catch {
    return d
  }
}
export function jset(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* kota dolu / gizli sekme */
  }
}
export const lget = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
export const lset = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* ignore */
  }
}

// Güvenli hesap makinesi ayrıştırıcısı (eval yok): + − × ÷ ( ) % ve virgül/nokta ondalık
export function ev(src: string): number {
  const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.')
  let i = 0
  const pk = () => s[i]
  const E = (): number => {
    let v = T_()
    while (pk() === '+' || pk() === '-') {
      const o = s[i++]
      const r = T_()
      v = o === '+' ? v + r : v - r
    }
    return v
  }
  const T_ = (): number => {
    let v = F_()
    while (pk() === '*' || pk() === '/') {
      const o = s[i++]
      const r = F_()
      v = o === '*' ? v * r : v / r
    }
    return v
  }
  const F_ = (): number => {
    if (pk() === '-') {
      i++
      return -F_()
    }
    if (pk() === '(') {
      i++
      const v = E()
      if (pk() !== ')') throw new Error('x')
      i++
      return v
    }
    const j = i
    while (/[0-9.]/.test(pk() || '')) i++
    let v = parseFloat(s.slice(j, i))
    if (isNaN(v)) throw new Error('x')
    while (pk() === '%') {
      i++
      v /= 100
    }
    return v
  }
  const r = E()
  if (i < s.length || !isFinite(r)) throw new Error('x')
  return r
}

export const pn = (v: unknown): number => {
  if (typeof v === 'number') return v
  let t = String(v)
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  return parseFloat(t)
}
