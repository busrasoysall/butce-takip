import { getD, getS, mutate, save, setS } from './store'
import { normD, txs } from './budget'
import { showTxt, toast } from './ui'
import { pn, sum, today, tl } from './util'

/* ---- ses efektleri ---- */
let ac: AudioContext | undefined
export function snd(up?: boolean | number) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ac = ac || new AC()
    ;(up ? [988, 1319, 1760] : [520, 390, 260]).forEach((f, i) => {
      const o = ac!.createOscillator()
      const g = ac!.createGain()
      const t = ac!.currentTime + i * 0.09
      o.type = up ? 'triangle' : 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0.18, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      o.connect(g)
      g.connect(ac!.destination)
      o.start(t)
      o.stop(t + 0.26)
    })
  } catch {
    /* ses yok */
  }
}

/* ---- altın fiyatları ---- */
export async function gfetch(quiet?: boolean) {
  try {
    const r = await fetch('https://raw.githubusercontent.com/kessinc/darphane/main/altin.json', { cache: 'no-store' })
    if (!r.ok) throw new Error('x')
    const j = await r.json()
    const f: Record<string, number> = {}
    const w = (o: unknown, k: string) => {
      if (!o || typeof o !== 'object') return
      const ob = o as Record<string, unknown>
      if ('alis' in ob || 'satis' in ob) {
        const v = pn(ob.alis ?? ob.satis)
        const K = String(k || '').toUpperCase()
        if (!(v > 0)) return
        if (/CEYREK/.test(K)) f.ceyrek = f.ceyrek || v
        else if (/YARIM/.test(K)) f.yarim = f.yarim || v
        else if (/^(TAM|TEK)|CUMHURIYET/.test(K)) f.tam = f.tam || v
        else if (/^(GRAM_ALTIN|GRAM|ALTIN)$/.test(K)) f.gram = f.gram || v
      } else Object.keys(ob).forEach((x) => w(ob[x], x))
    }
    w(j, '')
    if (!Object.keys(f).length) throw new Error('x')
    mutate((D) => {
      Object.assign(D.rates, f)
      D.rt = new Date().toISOString()
      D.rsrc = 'Darphane serbest piyasa verisi'
    })
    if (!quiet) toast('Fiyatlar güncellendi.')
  } catch {
    if (!quiet) toast('Fiyat internetten alınamadı. Fiyatı elle girebilirsin.')
  }
}
export function gauto() {
  const D = getD()
  if (!D || !D.rt || Date.now() - new Date(D.rt).getTime() > 432e5) void gfetch(true)
}

/* ---- yedek ve CSV ---- */
async function copy(text: string, title: string, okMsg: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast(okMsg)
  } catch {
    showTxt(title, text)
  }
}
export const backupCopy = () => copy(JSON.stringify(getD()), 'Yedek', 'Yedek kopyalandı. Bir notlara yapıştırıp sakla.')
export const csvCopy = () =>
  copy(
    'Tarih;Tür;Kategori;Not;Tutar\n' +
      txs(getD())
        .map((x) => [x.d, x.t, x.c, x.n, x.a].join(';'))
        .join('\n'),
    'CSV',
    'CSV kopyalandı. Excel veya Sheets içine yapıştırabilirsin.',
  )
export function restoreBackup(text: string): boolean {
  try {
    const raw = JSON.parse(text)
    if (!raw || typeof raw !== 'object') return false
    setS({ D: normD(raw) })
    save()
    setS({ rev: getS().rev + 1 })
    return true
  } catch {
    return false
  }
}

/* ---- hatırlatmalar (uygulama açıkken) ---- */
export function askNotifPermission() {
  try {
    void Notification.requestPermission().then((p) => {
      toast(p === 'granted' ? 'Bildirimler açıldı. Uygulama açıkken sabah ve gece hatırlatmaları gelir.' : 'İzin verilmedi.')
      setS({ prefs: getS().prefs + 1 })
    })
  } catch {
    toast('Bu cihaz tarayıcı bildirimini desteklemiyor.')
  }
}
export function ntick() {
  try {
    const D = getD()
    if (!getS().user || !D || !window.Notification || Notification.permission !== 'granted') return
    const n = new Date()
    const t = today()
    const h = n.getHours()
    const N = (k: string, b: string) => {
      if (D.nf[t + k]) return
      D.nf[t + k] = 1
      save()
      new Notification('Bütçe Takip', { body: b })
    }
    const tod = sum(D.daily.filter((x) => x.d === t).map((x) => x.a))
    if (h >= 9 && h < 12) N('a', 'Günaydın! Bugünkü harcamalarını girmeyi unutma.')
    if (h >= 21) {
      if (tod) N('c', 'Bugün toplam ' + tl(tod) + ' harcadın.')
      else N('b', 'Bugün henüz harcama girmedin. Gün bitmeden ekle.')
      if (n.getDay() === 0) N('w', 'Hafta bitti: analizini Bildirimler sayfasında gör.')
      if (new Date(n.getTime() + 864e5).getDate() === 1) N('m', 'Ay bitti: aylık özetin Bildirimler sayfasında.')
    }
  } catch {
    /* bildirim desteklenmiyor */
  }
}

/* ---- fiş fotoğrafı: 800 px, JPEG ---- */
export function pickReceipt(): Promise<string | null> {
  return new Promise((resolve) => {
    const i = document.createElement('input')
    i.type = 'file'
    i.accept = 'image/*'
    i.onchange = async () => {
      const f = i.files?.[0]
      if (!f) return resolve(null)
      try {
        const im = new Image()
        im.src = URL.createObjectURL(f)
        await im.decode()
        const s = Math.min(1, 800 / Math.max(im.width, im.height))
        const c = document.createElement('canvas')
        c.width = Math.round(im.width * s)
        c.height = Math.round(im.height * s)
        c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.55))
      } catch {
        resolve(null)
      }
    }
    i.oncancel = () => resolve(null)
    i.click()
  })
}
