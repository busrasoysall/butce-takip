import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Logo } from '@/components/Logo'
import { spring } from '@/components/kit'
import { clearPending, continueAfterVerify, pending, recover, resendVerify, resetPassword, signIn, signUp, type Res } from '@/lib/auth'
import { getS, setS, type AuthMode } from '@/lib/store'
import { cn } from '@/lib/utils'

const TITLE: Record<AuthMode, string> = {
  in: 'Giriş yap',
  up: 'Hesap oluştur',
  fg: 'Şifremi sıfırla',
  fd: 'E-postanı kontrol et',
  vf: 'E-postanı doğrula',
  rp: 'Yeni şifre belirle',
}
const SWITCH: Record<AuthMode, [string, AuthMode]> = {
  in: ['Hesabın yok mu? Kayıt ol', 'up'],
  up: ['Zaten hesabın var mı? Giriş yap', 'in'],
  fg: ['Girişe dön', 'in'],
  fd: ['Girişe dön', 'in'],
  vf: ['Başka hesapla giriş yap', 'in'],
  rp: ['Girişe dön', 'in'],
}

function Field({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={p.name}>{label}</label>
      <input id={p.name} autoCapitalize="none" autoCorrect="off" spellCheck={false} {...p} />
    </div>
  )
}

export function Login() {
  const flash = getS().flash
  const [mode, setMode] = useState<AuthMode>(flash?.mode ?? 'in')
  const [msg, setMsg] = useState(flash?.msg ?? '')
  const [ok, setOk] = useState(!!flash?.ok)
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ email: '', name: '', pw: '', pw2: '' })
  useEffect(() => {
    setS({ flash: null })
  }, [])

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const go = (m: AuthMode, text = '', good = false) => {
    setMode(m)
    setMsg(text)
    setOk(good)
    if (m === 'in' || m === 'up') setF((x) => ({ ...x, pw: '', pw2: '' }))
  }
  const apply = (r: Res) => {
    if (r.err) {
      setMsg(r.err)
      setOk(false)
    } else if (r.mode) go(r.mode, r.msg, r.ok)
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMsg('')
    try {
      if (mode === 'in') apply(await signIn(f.email, f.pw))
      else if (mode === 'up') apply(await signUp(f.email, f.name, f.pw, f.pw2))
      else if (mode === 'fg') apply(await recover(f.email))
      else if (mode === 'vf') apply(await continueAfterVerify())
      else if (mode === 'rp') apply(await resetPassword(f.pw, f.pw2))
    } finally {
      setBusy(false)
    }
  }

  let body: ReactNode
  if (mode === 'in')
    body = (
      <>
        <Field label="E-posta" name="email" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set('email')} />
        <Field label="Şifre" name="password" type="password" autoComplete="current-password" value={f.pw} onChange={set('pw')} />
        <div style={{ textAlign: 'right', margin: '-.1rem 0 .5rem' }}>
          <button type="button" className="lnk" onClick={() => go('fg')}>
            Şifremi unuttum
          </button>
        </div>
      </>
    )
  else if (mode === 'up')
    body = (
      <>
        <Field label="E-posta" name="email" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set('email')} />
        <Field label="Kullanıcı adı" name="name" type="text" autoComplete="nickname" value={f.name} onChange={set('name')} />
        <Field label="Şifre (en az 6 karakter)" name="password" type="password" autoComplete="new-password" value={f.pw} onChange={set('pw')} />
        <Field label="Şifre tekrar" name="password2" type="password" autoComplete="new-password" value={f.pw2} onChange={set('pw2')} />
      </>
    )
  else if (mode === 'fg')
    body = (
      <>
        <p className="mut" style={{ fontSize: '.8rem', marginBottom: '.5rem' }}>
          Hesabına bağlı e-posta adresini yaz. Şifreni sıfırlaman için bir bağlantı göndereceğiz.
        </p>
        <Field label="E-posta" name="email" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set('email')} />
      </>
    )
  else if (mode === 'rp')
    body = (
      <>
        <p className="mut" style={{ fontSize: '.8rem', marginBottom: '.5rem' }}>
          Yeni şifreni iki kez yaz.
        </p>
        <Field label="Yeni şifre (en az 6 karakter)" name="password" type="password" autoComplete="new-password" value={f.pw} onChange={set('pw')} />
        <Field label="Şifre tekrar" name="password2" type="password" autoComplete="new-password" value={f.pw2} onChange={set('pw2')} />
      </>
    )
  else if (mode === 'fd')
    body = <p style={{ marginBottom: '.6rem' }}>Bu e-posta ile kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gelen kutunu ve spam klasörünü kontrol et.</p>
  else
    body = (
      <>
        <p style={{ marginBottom: '.6rem', overflowWrap: 'anywhere' }}>
          <b>{pending().email}</b> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya dokunduktan sonra buraya dön.
        </p>
        <button
          type="button"
          className="btn s w100"
          style={{ marginBottom: '.5rem' }}
          onClick={async () => {
            setMsg(await resendVerify())
            setOk(true)
          }}
        >
          E-postayı tekrar gönder
        </button>
      </>
    )

  const label = mode === 'fg' ? 'Sıfırlama bağlantısı gönder' : mode === 'vf' ? 'Doğruladım, devam et' : mode === 'rp' ? 'Şifreyi güncelle' : TITLE[mode]
  const [swText, swMode] = SWITCH[mode]

  return (
    <div className="lg">
      <motion.div className="lgw" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <div className="lgh">
          <div className="lgl">
            <Logo size={104} />
          </div>
          <h1>Bütçe Takip</h1>
          <p>Gelirini, giderini ve kartlarını tek yerde yönet.</p>
        </div>
        <div className="card" style={{ padding: '1.4rem', margin: 0 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.form key={mode} onSubmit={submit} noValidate initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.18 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '.6rem' }}>{TITLE[mode]}</h3>
              {body}
              <div role="status" className={cn(ok ? 'pos' : 'neg')} style={{ fontSize: '.8rem', minHeight: '1.3rem', marginBottom: '.25rem', fontWeight: 600 }}>
                {msg}
              </div>
              {mode !== 'fd' && (
                <button type="submit" className="btn w100" disabled={busy}>
                  {busy ? 'Bekle…' : label}
                </button>
              )}
              <p style={{ marginTop: '.9rem', fontSize: '.8rem', textAlign: 'center' }}>
                <button
                  type="button"
                  className="lnk"
                  onClick={() => {
                    if (mode === 'vf' || mode === 'rp') clearPending()
                    go(swMode)
                  }}
                >
                  {swText}
                </button>
              </p>
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
