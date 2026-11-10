import { loadUserData, setS, getS, type Flash } from './store'
import type { Session } from './types'
import { jget, jset, EMAIL } from './util'
import { sypull, sypush } from './sync'
import { gauto } from './misc'
import { CFG } from './config'

export const CLOUD = !!(CFG.sbUrl && CFG.sbKey)
const SBU = CFG.sbUrl.replace(/\/+$/, '')
const SBK = CFG.sbKey
// e-posta bağlantısının döneceği adres: uygulamanın bulunduğu klasör (kökte de alt klasörde de doğru)
const RD = () => encodeURIComponent(new URL('./', document.baseURI).href)

const FE: Record<string, string> = {
  EMAIL_EXISTS: 'Bu e-posta ile zaten bir hesap var.',
  INVALID_LOGIN_CREDENTIALS: 'E-posta veya şifre hatalı.',
  EMAIL_NOT_CONFIRMED: 'E-postan henüz doğrulanmamış.',
  INVALID_EMAIL: 'Geçerli bir e-posta gir.',
  WEAK_PASSWORD: 'Şifre en az 6 karakter olmalı.',
  RATE_LIMIT: 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.',
  USER_DISABLED: 'Bu hesap devre dışı bırakılmış.',
  NETWORK: 'İnternet bağlantısı yok. Bağlantını kontrol et.',
  SIGNUP_DISABLED: 'Yeni kayıtlar şu an kapalı.',
  SAME_PASSWORD: 'Yeni şifre eskisiyle aynı olamaz.',
}
const SEC: Record<string, string> = {
  invalid_credentials: 'INVALID_LOGIN_CREDENTIALS',
  email_not_confirmed: 'EMAIL_NOT_CONFIRMED',
  user_already_exists: 'EMAIL_EXISTS',
  email_exists: 'EMAIL_EXISTS',
  weak_password: 'WEAK_PASSWORD',
  over_request_rate_limit: 'RATE_LIMIT',
  over_email_send_rate_limit: 'RATE_LIMIT',
  email_address_invalid: 'INVALID_EMAIL',
  validation_failed: 'INVALID_EMAIL',
  signup_disabled: 'SIGNUP_DISABLED',
  user_banned: 'USER_DISABLED',
  same_password: 'SAME_PASSWORD',
  refresh_token_not_found: 'INVALID_REFRESH_TOKEN',
  refresh_token_already_used: 'INVALID_REFRESH_TOKEN',
  session_not_found: 'INVALID_REFRESH_TOKEN',
  user_not_found: 'USER_NOT_FOUND',
  bad_jwt: 'INVALID_REFRESH_TOKEN',
}
export const errMsg = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e)
  return FE[m] || `Bir hata oluştu (${m}). Tekrar dene.`
}

export class SbError extends Error {
  status = 0
}
type SbOpts = { m?: string; body?: unknown; tk?: string; h?: Record<string, string> }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sb<T = any>(p: string, o: SbOpts = {}): Promise<T> {
  let r: Response
  try {
    r = await fetch(SBU + p, {
      method: o.m || 'POST',
      headers: { apikey: SBK, 'Content-Type': 'application/json', ...(o.tk ? { Authorization: 'Bearer ' + o.tk } : {}), ...(o.h || {}) },
      body: o.body ? JSON.stringify(o.body) : undefined,
    })
  } catch {
    throw new SbError('NETWORK')
  }
  const j = await r.json().catch(() => null)
  if (!r.ok) {
    const c = j && (j.error_code || j.code)
    const e = new SbError(SEC[c] || (r.status === 429 ? 'RATE_LIMIT' : 'ERR_' + (c || r.status)))
    e.status = r.status
    throw e
  }
  return j as T
}

/* ---- oturum ---- */
type SbSession = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: { id: string; email: string; email_confirmed_at?: string | null; user_metadata?: { name?: string } }
}
function makeSession(j: SbSession, n?: string): Session {
  const u = j.user || ({} as NonNullable<SbSession['user']>)
  const s: Session = {
    rt: j.refresh_token || '',
    it: j.access_token || '',
    ex: Date.now() + (j.expires_in || 3600) * 1000,
    uid: u.id,
    e: u.email,
    n: n || u.user_metadata?.name || '',
    v: !!u.email_confirmed_at,
  }
  jset('bt_cl', s)
  return s
}

let RF: Promise<void> | null = null
async function rfs() {
  const s = getS().user as Session
  const j = await sb<SbSession>('/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: s.rt } })
  setS({ user: makeSession(j, s.n) })
}
const rfo = () => RF || (RF = rfs().finally(() => (RF = null)))
export async function tok() {
  const s = getS().user
  if (!s) throw new Error('NOAUTH')
  if (s.ex - Date.now() < 60000) await rfo()
  return (getS().user as Session).it
}

export function startSession(j: SbSession, name?: string) {
  const user = makeSession(j, name)
  setS({ user, D: loadUserData(user), phase: 'app', tab: 'home', drawer: false })
  gauto()
  void checkSession()
}

/** Arka planda oturumu yeniler; geçersizse giriş ekranına döner, değilse buluttan veriyi çeker. */
export async function checkSession() {
  if (!getS().user) return
  try {
    await rfo()
  } catch (e) {
    const x = e as SbError
    if (x.status === 400 || x.status === 401 || ['INVALID_REFRESH_TOKEN', 'USER_NOT_FOUND', 'USER_DISABLED'].includes(x.message)) {
      localStorage.removeItem('bt_cl')
      setS({ user: null, D: null, phase: 'auth', flash: { mode: 'in', msg: 'Oturumun sona erdi. Tekrar giriş yap.' } })
      return
    }
  }
  void sypull()
}

/* ---- ekran akışları: sonuç döndürür, ekran durumunu Login bileşeni yönetir ---- */
let PE = ''
let PW = ''
export const pending = () => ({ email: PE, hasPw: !!PW })
export const clearPending = () => {
  PE = ''
  PW = ''
}

export type Res = { err?: string; mode?: Flash['mode']; msg?: string; ok?: boolean }

export async function signIn(email: string, pw: string): Promise<Res> {
  const e = email.trim().toLowerCase()
  if (!EMAIL.test(e) || !pw) return { err: 'E-posta ve şifreni gir.' }
  try {
    const j = await sb<SbSession>('/auth/v1/token?grant_type=password', { body: { email: e, password: pw } })
    clearPending()
    startSession(j)
    return {}
  } catch (x) {
    if (x instanceof Error && x.message === 'EMAIL_NOT_CONFIRMED') {
      PE = e
      PW = pw
      return { mode: 'vf', msg: 'E-postan henüz doğrulanmamış.' }
    }
    return { err: errMsg(x) }
  }
}

export async function signUp(email: string, name: string, pw: string, pw2: string): Promise<Res> {
  const e = email.trim().toLowerCase()
  const n = name.trim()
  if (!EMAIL.test(e)) return { err: 'Geçerli bir e-posta gir.' }
  if (n.length < 2) return { err: 'Kullanıcı adı en az 2 karakter olmalı.' }
  if (pw.length < 6) return { err: 'Şifre en az 6 karakter olmalı.' }
  if (pw !== pw2) return { err: 'Şifreler aynı değil.' }
  try {
    const j = await sb<SbSession & { identities?: unknown[] }>('/auth/v1/signup?redirect_to=' + RD(), {
      body: { email: e, password: pw, data: { name: n } },
    })
    const u = (j.user || j) as { identities?: unknown[] }
    if (u.identities && !u.identities.length) return { err: FE.EMAIL_EXISTS }
    if (j.access_token) {
      startSession(j, n)
      return {}
    }
    PE = e
    PW = pw
    return { mode: 'vf', msg: 'Hesabın oluşturuldu. Doğrulama e-postası gönderildi.', ok: true }
  } catch (x) {
    return { err: errMsg(x) }
  }
}

export async function recover(email: string): Promise<Res> {
  const e = email.trim().toLowerCase()
  if (!EMAIL.test(e)) return { err: 'Geçerli bir e-posta gir.' }
  try {
    await sb('/auth/v1/recover?redirect_to=' + RD(), { body: { email: e } })
  } catch (x) {
    if (!(x instanceof Error) || x.message !== 'USER_NOT_FOUND') return { err: errMsg(x) }
  }
  return { mode: 'fd' }
}

export async function continueAfterVerify(): Promise<Res> {
  if (!PW) return { mode: 'in', msg: 'Doğruladıysan e-posta ve şifrenle giriş yap.', ok: true }
  try {
    const j = await sb<SbSession>('/auth/v1/token?grant_type=password', { body: { email: PE, password: PW } })
    clearPending()
    startSession(j)
    return {}
  } catch (x) {
    if (x instanceof Error && x.message === 'EMAIL_NOT_CONFIRMED')
      return { err: 'E-posta henüz doğrulanmamış. Gelen kutunu ve spam klasörünü kontrol et.' }
    return { err: errMsg(x) }
  }
}

export async function resendVerify(): Promise<string> {
  try {
    await sb('/auth/v1/resend?redirect_to=' + RD(), { body: { type: 'signup', email: PE } })
    return 'Doğrulama e-postası tekrar gönderildi.'
  } catch (x) {
    return errMsg(x)
  }
}

let RT = ''
export async function resetPassword(pw: string, pw2: string): Promise<Res> {
  if (pw.length < 6) return { err: 'Şifre en az 6 karakter olmalı.' }
  if (pw !== pw2) return { err: 'Şifreler aynı değil.' }
  try {
    await sb('/auth/v1/user', { m: 'PUT', tk: RT, body: { password: pw } })
    RT = ''
    return { mode: 'in', msg: 'Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.', ok: true }
  } catch (x) {
    return { err: errMsg(x) }
  }
}

export async function changePassword(): Promise<string> {
  const s = getS().user
  if (!s) return ''
  try {
    await sb('/auth/v1/recover?redirect_to=' + RD(), { body: { email: s.e } })
    return `Şifre değiştirme bağlantısı ${s.e} adresine gönderildi.`
  } catch (x) {
    return errMsg(x)
  }
}

export async function signOut() {
  try {
    await sypush()
  } catch {
    /* çevrimdışı olabilir */
  }
  const s = getS().user
  if (s) {
    try {
      await sb('/auth/v1/logout?scope=local', { tk: s.it })
    } catch {
      /* ignore */
    }
  }
  localStorage.removeItem('bt_cl')
  clearPending()
  setS({ user: null, D: null, phase: 'auth', flash: null, tab: 'home', drawer: false })
}

/** E-posta bağlantısından dönüş (#access_token=...&type=signup|recovery). true: işlendi. */
export function handleHash(): boolean {
  if (!CLOUD || !/access_token=|error_code=/.test(location.hash)) return false
  const p = new URLSearchParams(location.hash.slice(1))
  const type = p.get('type')
  const a = p.get('access_token')
  const r = p.get('refresh_token')
  history.replaceState(null, '', location.pathname + location.search)
  if (!a) {
    setS({ phase: 'auth', flash: { mode: 'in', msg: 'Bağlantının süresi dolmuş veya geçersiz. Yeniden dene.' } })
    return true
  }
  if (type === 'recovery') {
    RT = a
    setS({ phase: 'auth', flash: { mode: 'rp' } })
    return true
  }
  ;(async () => {
    try {
      const u = await sb<NonNullable<SbSession['user']>>('/auth/v1/user', { m: 'GET', tk: a })
      startSession({ access_token: a, refresh_token: r || '', expires_in: +(p.get('expires_in') || 0) || 3600, user: u })
    } catch {
      setS({ phase: 'auth', flash: { mode: 'in', msg: 'Doğrulama bağlantısı geçersiz veya süresi dolmuş. Giriş yapmayı dene.' } })
    }
  })()
  return true
}

/** Uygulama açılışı: kayıtlı oturum varsa veriyi yükler. */
export function bootAuth() {
  if (!CLOUD) {
    setS({ phase: 'auth', flash: { mode: 'in', msg: 'Sunucu ayarı eksik. Uygulamayı güncelleyip tekrar dene.' } })
    return
  }
  if (handleHash()) return
  const s = jget<Session | null>('bt_cl', null)
  if (s && s.v && s.uid) {
    setS({ user: s, D: loadUserData(s), phase: 'app' })
    gauto()
    void checkSession()
  } else setS({ phase: 'auth' })
}
