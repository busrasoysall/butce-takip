// Supabase adresi ve "publishable/anon" anahtarı. İkisi de GİZLİ DEĞİLDİR (tarayıcıda görünür);
// verileri korumak RLS kurallarının işidir (supabase/schema.sql). ASLA service_role / secret anahtarı yazma.
//
// Ayarlar paketin İÇİNE gömülüdür: ayrı bir config.js dosyasına bağlı olmadığı için
// operatör/mobil ağ gibi nedenlerle o dosya inmese bile uygulama çalışır.
declare global {
  interface Window {
    APP_CFG?: { sbUrl?: string; sbKey?: string }
  }
}

export type Cfg = { sbUrl: string; sbKey: string }

const DEFAULTS: Cfg = {
  sbUrl: 'https://brjibjagvzdqqbbtwywf.supabase.co',
  sbKey: 'sb_publishable__Yu44TiPDPJXaSI-CND1bg_VnA28XDl',
}

function stored(): Partial<Cfg> {
  // Test için: localStorage.bt_cfg = '{"sbUrl":"http://localhost:8096","sbKey":"TEST"}'
  try {
    return JSON.parse(localStorage.getItem('bt_cfg') || '{}') as Partial<Cfg>
  } catch {
    return {}
  }
}

const pick = (...o: (Partial<Cfg> | undefined)[]): Cfg => {
  const r = { ...DEFAULTS }
  for (const x of o) {
    if (x?.sbUrl) r.sbUrl = x.sbUrl
    if (x?.sbKey) r.sbKey = x.sbKey
  }
  return r
}

export const CFG: Cfg = pick(window.APP_CFG, stored())
