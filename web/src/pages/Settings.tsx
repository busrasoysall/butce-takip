import { motion } from 'motion/react'
import { I } from '@/components/Icons'
import { Card, Seg } from '@/components/kit'
import { changePassword, signOut } from '@/lib/auth'
import { monthLimit, restoreForm } from '@/lib/forms'
import { askNotifPermission, backupCopy, csvCopy, restoreBackup } from '@/lib/misc'
import { bumpPrefs, getD, userName, useApp } from '@/lib/store'
import { THEMES, getCt, getFs, getMode, setCt, setFs, setMode, type Mode } from '@/lib/themes'
import { ask, toast } from '@/lib/ui'
import { lget, lset, tl } from '@/lib/util'
import { cn } from '@/lib/utils'

const notifState = () => {
  try {
    return window.Notification ? Notification.permission : 'unsupported'
  } catch {
    return 'unsupported'
  }
}

export function Settings() {
  useApp()
  const D = getD()
  const ct = getCt()
  const hidden = lget('bt_oh') === '1'
  const perm = notifState()
  return (
    <>
      <h2>Ayarlar</h2>

      <Card>
        <b>Renk teması</b>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(4.4rem,1fr))', gap: '.75rem .5rem', margin: '.85rem 0 .25rem' }}>
          {THEMES.map((t) => {
            const [a, b] = t.swatch.split(',')
            const on = ct === t.id
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.92 }}
                aria-pressed={on}
                aria-label={t.name}
                onClick={() => {
                  setCt(t.id)
                  bumpPrefs()
                }}
                style={{ border: 0, background: 'none', textAlign: 'center', color: 'var(--ink)', fontWeight: 700, fontSize: '.7rem', padding: 0 }}
              >
                <span style={{ display: 'grid', placeItems: 'center', width: '3.1rem', height: '3.1rem', borderRadius: '50%', margin: '0 auto .3rem', background: `linear-gradient(135deg,${a},${b})`, outline: on ? '3px solid var(--go)' : '3px solid transparent', outlineOffset: '2px', transition: 'outline-color .2s' }}>
                  {on && <I.check size={20} color="#fff" strokeWidth={3} />}
                </span>
                {t.name}
              </motion.button>
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="row" style={{ border: 0, flexWrap: 'wrap' }}>
          <span className="t">
            Görünüm<small>Açık, koyu ya da cihazı takip et</small>
          </span>
        </div>
        <Seg<Mode>
          value={getMode()}
          opts={[
            ['auto', 'Otomatik'],
            ['light', 'Açık'],
            ['dark', 'Koyu'],
          ]}
          onChange={(m) => {
            setMode(m)
            bumpPrefs()
          }}
        />
        <div className="row" style={{ border: 0, flexWrap: 'wrap' }}>
          <span className="t">Yazı boyutu</span>
        </div>
        <Seg<string>
          value={getFs()}
          opts={[
            ['.85', 'Küçük'],
            ['.9', 'Orta'],
            ['1', 'Büyük'],
          ]}
          onChange={(v) => {
            setFs(v)
            bumpPrefs()
          }}
        />
      </Card>

      <Card>
        <div className="row" style={{ border: 0 }}>
          <span className="t">
            Not ve hesap makinesi düğmeleri<small>Sürükleyerek istediğin kenara taşı</small>
          </span>
          <button
            className="btn s"
            onClick={() => {
              lset('bt_oh', hidden ? '0' : '1')
              bumpPrefs()
            }}
          >
            {hidden ? 'Göster' : 'Gizle'}
          </button>
        </div>
      </Card>

      <Card>
        <div className="row">
          <span className="t">
            Aylık harcama limiti<small>{D.lim ? tl(D.lim) : 'Kapalı (gelirin baz alınır)'}</small>
          </span>
          <button className="btn" onClick={monthLimit}>
            Değiştir
          </button>
        </div>
        <div className="row" style={{ border: 0 }}>
          <span className="t">
            Hatırlatmalar<small>{perm === 'granted' ? 'Açık · sabah ve gece, uygulama açıkken' : perm === 'denied' ? 'Tarayıcıdan engellenmiş' : 'Sabah ve gece, uygulama açıkken'}</small>
          </span>
          <button className="btn" disabled={perm === 'granted' || perm === 'unsupported'} onClick={askNotifPermission}>
            {perm === 'granted' ? 'Açık' : 'Aç'}
          </button>
        </div>
      </Card>

      <Card>
        <h3>Yedekleme</h3>
        <p className="mut" style={{ fontSize: '.8rem', margin: '.4rem 0' }}>
          Verilerin hesabınla buluta da kaydedilir. Yine de yedek almak istersen:
        </p>
        <div className="bs">
          <button className="btn s" onClick={() => void csvCopy()}>
            CSV kopyala
          </button>
          <button className="btn g" onClick={() => void backupCopy()}>
            Yedeği kopyala
          </button>
          <button className="btn s" onClick={() => restoreForm(restoreBackup)}>
            Yedeği yükle
          </button>
        </div>
      </Card>

      <Card>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <span className="t">
            Hesap<small>{userName()}</small>
          </span>
          <button
            className="btn s"
            onClick={async () => {
              toast(await changePassword())
            }}
          >
            Şifre değiştir
          </button>
          <button className={cn('btn o')} onClick={() => ask('Çıkış yapılsın mı? Verilerin silinmez.', () => void signOut())}>
            Çıkış yap
          </button>
        </div>
        <div className="row" style={{ border: 0 }}>
          <span className="t">
            Eski sürüm<small>Yeni arayüzde sorun olursa eski ekranı açabilirsin · Sürüm {__BUILD__}</small>
          </span>
          <a className="btn s" href="eski/">
            Aç
          </a>
        </div>
      </Card>
    </>
  )
}
