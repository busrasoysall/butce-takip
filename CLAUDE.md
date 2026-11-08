# Bütçe Takip — Proje Devir Notları (Claude Code için)

Bu dosya, projeyi Claude.ai sohbetinde geliştirdikten sonra Claude Code'a devretmek için yazıldı.
Önce bunu oku. Kullanıcı **Türkçe** konuşur; arayüz metinleri ve kullanıcıyla iletişim Türkçe olmalı.

## 0. GÜNCEL MİMARİ (Kasım 2026): React sürümü — önce bunu oku
Uygulama artık **React 19 + TypeScript + Vite 8 + Tailwind v4 + motion (animasyon) + lucide-react (simgeler)**. Kaynak: `web/`. Dağıtım: Vercel, repo kökündeki
`vercel.json` (`npm --prefix web install` / `npm --prefix web run build`, çıktı `web/dist`). Eski tek dosyalık sürüm `web/public/eski/index.html` olarak `/eski/` adresinde
durur (Ayarlar'da bağlantı var); **artık geliştirilmez**, yalnız yedek/geri dönüş içindir. §1–§9 ve §11–§13 eski sürümü anlatır; **veri modeli (§4), localStorage anahtarları (§5)
ve Supabase giriş/senkron mantığı (§6) React sürümünde aynen geçerli** (aynı anahtarlar, aynı tablo, mevcut oturum ve veriler korunur). Yerel hesap modu React sürümünde yoktur.

Komutlar (web/ içinde): `npm install`, `npm run dev`, `npm run build` (tsc + vite; çıktı `web/dist`). Test: sahte Supabase (GoTrue + PostgREST) sunucusuyla,
aynı origin'den servis edilen `dist` ile (CORS gerekmez); `config.js` içindeki `sbUrl` o sunucuya işaret eder.

Kod haritası (`web/src`):
- `lib/types.ts` veri tipleri · `lib/util.ts` biçim/tarih/ayrıştırıcı (`ev`) · `lib/budget.ts` hesaplar (`T`, `cb`, `health`, `insights`, `txs`, `notifCards`, `chartData`…)
- `lib/store.ts` tek global durum (`useApp`, `setS`, `mutate`, `commit`, `save`, `go`) · `lib/ui.ts` komut tipi pencereler (`F` form, `ask`, `toast`, `showTxt`, `choose`, `showImage`)
- `lib/auth.ts` Supabase Auth REST (`sb`, `signIn`, `signUp`, `recover`, `handleHash`, `bootAuth`…) · `lib/sync.ts` bulut senkronu (`syd`, `sypush`, `sypull`)
- `lib/forms.ts` form açan eylemler (`addExpense`, `addIncome`, `addCard`…) · `lib/misc.ts` ses, altın fiyatı, yedek/CSV, bildirim, fiş fotoğrafı · `lib/themes.ts` 10 renk teması
- `components/` `Shell` (üst çubuk, çekmece, alt çubuk, FAB, sürüklenebilir düğmeler), `kit` (Sheet, Seg, Bar, Num, UIHost…), `Calculator`, `Notes`, `Icons`, `Logo`
- `pages/` `Home`, `Flow` (Gelir, Sabit giderler, Günlük), `Assets` (Yatırım, Kartlar), `More` (Takvim, Grafik, Bildirim, Hareket, Hedefler), `Settings`, `Login`

Kurallar / tuzaklar:
- Veri `getD()` ile **yerinde değiştirilir**, sonra `commit()`/`mutate()` ile kaydedilir (eski mantık). `F(...)` formunun `ok` geri çağrısı `false` dönmezse kaydeder.
- **iOS yakınlaştırma hatası:** 16 px altı alan yazısı odakta sayfayı yakınlaştırır. Tüm `input/select/textarea` `font-size:max(16px,1rem)`; viewport'ta `maximum-scale` yok. Boyut ayarı artık CSS `zoom` değil `html{font-size:calc(16px*var(--fs))}` (rem).
- `Sheet`/`Dlg` efektleri `onClose`'u **ref** ile okur (bağımlılığa koymak sonsuz güncelleme döngüsü yapar: React #185).
- Animasyonlar `motion/react`; `prefers-reduced-motion` desteklenir (`MotionConfig reducedMotion="user"`). Sayfa geçişi `AnimatePresence mode="wait"`.
- Servis çalışanı `web/public/sw.js` (`/assets/*` önce önbellek, sayfa önce ağ, `/eski/` ve `config.js` her zaman ağdan). Yayında sürüm adını (`V`) artır.
- `web/public/config.js` Supabase URL + anon anahtar (gizli değil). Simgeler: `web/public/icon-*.png` (yeni B logosu), `logo.svg`.

## 1. Proje nedir
Türkiye'ye yönelik kişisel bütçe takip uygulaması ("Bütçe Takip"). Şimdilik **tek dosyalık PWA**
(`index.html`, ~90 KB, inline CSS + JS, derleme adımı yok). Hedef: önce kullanıcının kendi telefonu
ve birkaç arkadaşı, sonra App Store / Google Play.

Klasör: `index.html` (uygulama), `config.js` (Supabase URL + anon anahtar), `manifest.webmanifest`, `sw.js`
(service worker, önbellek adı `butce-vN`; her yayında sürümü artır), `icon-180/192/512.png`,
`KURULUM.md` (Supabase kurulum rehberi), `supabase/schema.sql` (veritabanı şeması), bu dosya.

Çalıştırma: `python3 -m http.server 8080` ve `http://localhost:8080` (service worker için http/https gerekir).
Yayın (Vercel): GitHub reposu (`main` dalı) Vercel'e bağlı; `git push` otomatik yayınlar. Derleme komutu yok, çıktı klasörü kök (`.`). Her yayında `sw.js` içindeki `butce-vN` sürümünü artır.

## 2. Kullanıcının verdiği kararlar (bozma)
- **Tema:** Pembe istemedi. Zümrüt/lacivert/altın (varsayılan). 4 renk teması: `zumrut, okyanus, ametist, gunbatimi`
  (`<html data-ct>`), açık/koyu mod ayrı (`<html data-theme>`). Renkler CSS değişkenleri: `--a1 --a2 --h1 --h2 --h3 --pk --bg --bg2 --card --ink --mut --ln --go --te --rd`.
- **Tipografi:** Italik yok, kalın ve net. Font: Plus Jakarta Sans (Google Fonts, çevrimdışıysa sistem fontu).
- **Görsel dil:** Profesyonel, şık, "gereksiz abartı yok". Emoji yok; tek tip çizgisel SVG simge.
- **Logo:** B monogramı (beyaz gövde, zümrüt üst göbek, altın alt göbek) squircle üstünde; `LOGO` sabiti + kök dizinde `logo.svg`. `logo(n)` boyutu verir. PNG ikonlar (`icon-*.png`) henüz eski logoda; onay sonrası yenilenecek.
- **Boyut:** Her şey `body{zoom:var(--zm,.9)}` ile biraz küçültülü; Ayarlar'da Küçük(.85)/Orta(.9)/Büyük(1).
- **Navigasyon (Kasım 2026'da değişti):** Menü çubuğu artık **üstte**, logonun **solunda**: Menü (sol çekmeceyi açar), Ana, Günlük, Kartlar, Takvim; logo çubuğun sağında,
  🔔 Bildirimler ve ⚙ Ayarlar en sağda (`R()`, sınıflar `.hn .hi .hb .ha .ht`). Aktif sayfanın etiketi görünür, diğerleri yalnız simge; çubuk dar ekranda yatay kayar.
  Çekmecede olan sayfalar (Gelir, Giderler…) aktifken çubuğun sonunda geçici bir hap görünür. "‹ Ana" geri düğmesi kalktı (çubukta Ana var). Alt çubuk yok; FAB (+) altta.
  Masaüstünde (≥900px) çubuk gizli, sabit kenar menü var; başlık yazısı (`.ht`) logonun yanında görünür.
  Masaüstünde (≥900px) çekmece sabit kenar menüsü.
- **"Borçlar" adı "Kredi Kartları" oldu** (hızlı kısayolda "Kartlar").
- **Not defteri ve hesap makinesi:** kenarda yüzen düğmeler (`orbs()`), sürüklenebilir, konum `bt_orb`'ta, Ayarlar'dan gizlenebilir (`bt_oh`). Varsayılan sol kenar.
  Paneller alt sayfa (`.mod.xm > .xs`; ≥900px'te ortada). **Hesap makinesi** (`calc()`): Hesap / KDV / Bölüş / Taksit sekmeleri, geçmiş (`bt_ch`), kopyala, klavye desteği, "harcama olarak ekle" (`cadd(v)`).
  **Notlar** (`nbk()`): renk (6), sabitleme, arama, liste (onay kutulu) türü; alanlar `c` renk, `p` sabit, `k:'l'`+`it:[{t,x}]` liste. Eski notlar (`{id,t,d,u}`) olduğu gibi çalışır.
- **Ana sayfa (Kasım 2026'da değişti):** Selam satırı, hemen altında **ana para kartı** (gelir/harcama/yatırım dahil) en üstte; ardından "Bugünün harcamaları" (`tdy()`), hızlı kısayollar (`qg()`), ay özeti.
- **Kurtarma kodu istemedi.** Şifre sıfırlama e-postayla olmalı. Şifre en az 6 karakter.
- **Aynı e-postayla tek hesap.** Kullanıcı adı seçilebilir.
- Kartlar alt alta (üst üste binmez); kart rengi bankanın kart rengi (`BK`, `bkc()`).
- İçerikler (özellikler) sabit kalsın, tasarım iyileştirilsin.

## 3. Özellikler (hepsi var)
Giriş/hesap, ana sayfa (ana para, finansal sağlık skoru `hs()`, harcama oranı, 6 ay grafiği, yaklaşan ödemeler `upc()`,
ay sonu tahmini), Gelir (maaş + ek gelir alanları), Sabit giderler (kategori ekle/çıkar, ödeme günü, "geçen ayı kopyala"),
Günlük harcama (+ kategori limitleri `clc()`, ödeme yöntemi: nakit/maaş kartı veya kredi kartı), Fiş okuma (`scan()`),
Yatırım (para birikimi + altın alımları, ortalama maliyet, güncel değer, kâr/zarar), Kredi Kartları (borç, taksit, ödeme, yeni kredi),
Takvim (yıl görünümü + ay görünümü + günlere not/özel gün), Grafik (gün/hafta/ay/yıl), Hedefler, Hareketler (arama/süzme),
Bildirimler (günlük/haftalık/aylık analiz kartları), Ayarlar (tema, yazı boyutu, yedek, CSV, şifre değiştir), hesap makinesi, notlar,
ses efektleri (WebAudio), 4 tema, yedek al/yükle (JSON panoya).

## 4. Veri modeli (`D`, kullanıcı başına JSON, localStorage)
`D` = { inc:[{id,m:'YYYY-MM',t:'Maaş'|'Ek gelir',s,a}], cats:[], fx:{'YYYY-MM':{kategori:tutar}}, dcats:[], ek:[],
daily:[{id,d:'YYYY-MM-DD',c,n,a,r?,s?}], inv:[{id,m,d,k:'p'|'g',g?,q?,a,n?}],
cards:[{id,n,bk,b,m,g,h:[{t:'o'|'b',a,d}]}], rates:{gram,ceyrek,yarim,tam}, rt, rsrc, gl:[{n,t,s}], lim, nt:{'YYYY-MM-DD':[{id,t,k}]},
nb:[{id,t,d,u?}], cl:{kategori:limit}, due:{kategori:ayGünü}, pm, nf:{} }`
- `daily.r` = fiş fotoğrafı (base64 dataURL, 800px, kalite .55). `daily.s` = kart id'si (kredi kartıyla yapılan harcama).
- `inv` altın: `g` ∈ gram|ceyrek|yarim|tam, `q` adet, `a` **toplam** ödenen. Para birikimi `k:'p'`.
- Kart `h`: `t:'o'` ödeme (borcu azaltır, ana parayı azaltır), `t:'b'` yeni kredi (borcu artırır, ana parayı artırır).
- ID'ler `Date.now()+Math.random()` (ondalıklı). HTML `onclick` içinde **string** olarak geçir (`'${x.id}'`) ve `==` ile karşılaştır.

### Para mantığı (`T(prefix)`)
`bal = gelir + yeni krediler − sabit giderler − (kartsız günlük harcama) − yatırım − kart ödemeleri`.
Kredi kartıyla yapılan günlük harcama (`x.s`) ana parayı **hemen düşürmez**; kart borcunu artırır (`cb(c)`),
karta ödeme yapılınca ana paradan düşer. `T().dc` = kartla harcanan (ay sonu ödenecek). Grafik/analiz kartları
(`cht`, `ntf`) kartlı harcamayı da kategori olarak sayar (tahakkuk esası); ana sayfa oranı/skor nakit esaslıdır.

## 5. localStorage anahtarları
`bt_acc`, `bt_cl`, `bt_ct`, `bt_d_`, `bt_fl`, `bt_fs`, `bt_ch`, `bt_lk`, `bt_m_`, `bt_oh`, `bt_orb`, `bt_rst`, `bt_sess`, `bt_t`, `bt_th`, `bt_users`
(`bt_d_<kullanıcı adı | uid>` = kullanıcı verisi. Bulut modunda anahtar Supabase `uid`; `bt_m_<uid>` = senkron meta, yerel modda kullanıcı adıdır: `UK()`.)

## 6. Giriş sistemi ve bulut (Supabase)
`window.APP_CFG.sbUrl` + `sbKey` (config.js) **boşsa yerel mod**, doluysa **bulut (Supabase) modu**. `CLOUD` sabiti buna bakar.
Firebase **kullanılmıyor** (kullanıcı karar verdi); kodda izi yok.
- **Yerel mod** (`loginL/actL`): hesaplar `bt_acc` içinde; şifre PBKDF2-SHA256 (150.000 tur, hesap başına tuz). 5 yanlış denemede 30 sn kilit.
  Eski düz metin hesaplar (`bt_users`) ilk girişte hash'e geçirilir ve e-posta ister (`addMail`). Şifre sıfırlama burada **demo**
  (`MAIL.mode='demo'`, "Test modu" kutusu): bağlantıyı ekranda gösterir. **Üretimde kaldırılmalı (güvenlik açığı).**
- **Bulut modu** (`loginC/actC`): Supabase Auth (GoTrue) REST: `/auth/v1/signup, token?grant_type=password|refresh_token, recover, resend, user, logout`
  (`sb()` yardımcısı; hata kodları `SEC` tablosuyla `FE` Türkçe mesajlarına çevrilir). Giriş **sadece e-posta + şifre**; kullanıcı adı = `user_metadata.name`.
  E-posta doğrulaması zorunlu (Supabase "Confirm email" açık; doğrulanmamış girişte `email_not_confirmed` → `vf` ekranı).
  Doğrulama / sıfırlama e-postasındaki bağlantı siteye `#access_token=...&type=signup|recovery` ile döner; `hsh()` bunu işler
  (signup → otomatik giriş, recovery → `rp` ekranı "Yeni şifre belirle"). Oturum `bt_cl` (access+refresh token, `ex` bitiş) ile kalıcı;
  `tok()` süresi dolmaya yakın token'ı yeniler (`rfo()` aynı anda tek yenileme). Şifre değiştir = sıfırlama e-postası gönderir.
- **Bulut veri senkronu**: tablo `public.user_data(user_id pk, data jsonb, updated_at)` (`supabase/schema.sql`; RLS: herkes yalnız kendi satırı,
  `updated_at` tetikleyiciyle sunucuda yenilenir). `save()` yerel kaydeder ve `syd()` ile 1,5 sn sonra `sypush()` çağırır.
  Yerel meta `bt_m_<uid>` = `{u: bilinen sunucu updated_at, d: gönderilmemiş değişiklik var mı}`.
  `sypush` iyimser kilitle (`PATCH ...&updated_at=eq.<u>`) yazar; satır yoksa POST; 0 satır/409 → `sycon()` çakışma penceresi
  ("Bu cihazdaki" / "Buluttaki"). `sypull` girişte (`cbg` sonrası), sekme öne gelince ve çevrimiçi olunca çeker; yerelde bekleyen değişiklik
  varsa kullanıcıya sorar. Çevrimdışıyken `d=1` kalır, internet gelince gönderilir. Fişler (base64) de bu satırda; büyüyünce Storage'a taşı.
- **Gerçek Supabase ile henüz test edilmedi.** Sahte (mock) GoTrue+PostgREST sunucusuyla tarayıcıda denendi: kayıt, doğrulama bağlantısı ile
  otomatik giriş, yanlış şifre, aynı e-posta, ikinci cihazdan veri çekme, token yenileme, çakışma (iki seçenek), çevrimdışı kuyruk, şifre sıfırlama,
  oturum kalıcılığı, çıkış ve yerel modun bozulmaması. İlk iş: `KURULUM.md` adımlarıyla gerçek projede uçtan uca dene.
- Yeni Supabase anahtarları (`sb_publishable_...`) JWT değildir: `Authorization` başlığına yalnız kullanıcı token'ı konur, `apikey` başlığına anahtar.

## 7. Önemli tuzaklar (hepsi yaşandı)
1. **Tek global kapsam.** Tüm fonksiyon/const'lar üst düzey; aynı isim tekrar tanımlanırsa **sessizce sonuncusu kazanır**
   (`rc` ve `scl` çakışması gerçek hata verdi). Her değişiklikten sonra çakışma kontrolü çalıştır (bkz. §9).
2. **`alert/confirm/prompt` sandbox'ta engelli** (Claude artifact iframe'inde `confirm` hep false döner). Bunun yerine `ask(msg,cb)`,
   `toast(msg)`, `showTxt(baslik,metin)` kullan. `window.alert=toast` olarak ezildi. Yeni kodda tarayıcı diyaloğu kullanma.
3. **Emoji → SVG dönüşümü DOM'da yapılıyor** (`ei()` + `MutationObserver`, `EM` ve `P` tabloları). Metin düğümlerindeki bilinen emojiler
   SVG olur. `<option>`, attribute veya textarea içine emoji koyma. Yeni simge: `P`'ye yol, `EM`'e eşleme ekle.
4. **Kullanıcı metni her zaman `esc()` ile** basılır (`innerHTML` şablonları). XSS'e dikkat.
5. Şablonlar çok katmanlı template literal; iç içe `` ` `` ve `${}` dikkat. Düzenleme sonrası: `node --check`.
6. `body{zoom}`: Firefox'ta eski sürümlerde yok; `.lg` giriş ekranı `100vh/zoom` ile telafi edildi.
7. localStorage kotası ~5 MB; fişler base64 olarak orada. Çok fiş olunca dolar (IndexedDB/buluta taşı).
8. Kullanıcı adının büyük/küçük harf farkı yok sayılır; şifre sonundaki boşluk toleranslı (klavye tahmini).
9. iOS'ta ana ekran uygulaması ve Safari sekmesi **ayrı depolama** kullanır: hesabı ana ekran simgesinden aç.
10. Service worker önbelleği: yayında `sw.js` sürümünü artırmazsan kullanıcı eski sürümü görür.

## 8. Claude'a özgü, PWA'da çalışmayan özellikler
- **Fiş okuma (`scan()`)** `claude.use('sample')` (Claude artifact çalışma zamanı) ile fotoğraftan mağaza/tutar/tarih/kategori çıkarıyordu.
  PWA'da `claude` yok → `try/catch` ile elle doldurma formuna düşer. Üretimde bir **sunucu** üzerinden görüntü-model API'si çağır
  (**API anahtarını asla istemciye koyma**).
- **Altın fiyatı (`gfetch`)** `https://raw.githubusercontent.com/kessinc/darphane/main/altin.json` adresini dener. Veri şeması **doğrulanmadı**;
  toleranslı ayrıştırıcı yazıldı (alis/satis, GRAM/CEYREK/YARIM/TAM anahtarları). Resmi (TCMB/Borsa İstanbul) ücretsiz API bulunamadı.
  Güvenilirlik için sunucu tarafında bir sağlayıcıya bağla ve önbellekle. Değer hesabı **alış (bozdurma)** fiyatıyla yapılır.
- **Bildirimler:** `Notification` API yalnızca uygulama açıkken (`ntick`, dakikada bir; 09:00 ve 21:00 hatırlatma, gün/hafta/ay sonu özet).
  Gerçek push için Web Push + sunucu veya Capacitor yerel bildirim gerekir.

## 9. Geliştirme yöntemi (işe yarayan)
Kod haritası (isimler, hızlı arama için):
- Fonksiyonlar: F, R, T, act, actC, actL, ad, ad0, ad1, addMail, ae, ai, an, ask, av, bk, boot, cadd, cal, calc, calx, cbg, cc, chpw, chpwL, cht, clc, cm, cpf, crd, csv, cu, dd, di, dly, dn, drawer, ei, ev, fb, fm, fx, gauto, gfetch, go0, gol, gp, home, hp, hs, inc, ins, inv, ivd, login, login0, loginC, loginL, mg, mo, nbk, nc, ndl, ned, ng, nk, nk0, nl, not, npm, nse, nsv, ntf, ntick, ok_, orbs, out, rc, rfs, rsd, scan, scc, scl, sd, sd_, sdu, set_, sf, showTxt, sm, tdy, th, toast, tx, txs, unotes, upc, vr
- Üst düzey sabit/değişkenler: BK, CG, CL, COL, EM, FE, GT, GW, LOGO, MAIL, MAIN, MN, P, PM, RX, TABS, U, UK, ac, add, cb, ce, defD, dg, dl, dro, ds, enc, esc, ic, id, jget, lm, logo, lw, nedit, nr, pad, q, qg, rtk, save, sct, sum, svg, tl, today, y

Kontroller (her değişiklikten sonra):
```bash
# 1) Sözdizimi
python3 - <<'E'
import re;s=open('index.html',encoding='utf-8').read()
open('/tmp/a.js','w',encoding='utf-8').write(re.findall(r'<script>(.*?)</script>',s,re.S)[-2])
E
node --check /tmp/a.js
# 2) İsim çakışması (çıktı boş olmalı)
python3 - <<'E'
import re,collections;s=open('index.html',encoding='utf-8').read();js=re.findall(r'<script>(.*?)</script>',s,re.S)[-2]
n=re.findall(r'^(?:async )?function (\w+)',js,re.M)+re.findall(r'^(?:const|let) (\w+)',js,re.M)
print([k for k,c in collections.Counter(n).items() if c>1])
E
```
(Ana betik, `<script>` bloklarının sondan ikincisidir; sonuncusu service worker kaydı.)

Uçtan uca test: Playwright (Python). Püf noktaları: `page.on('dialog', d=>d.dismiss())` (sandbox gibi), giriş alanları `#a1 #a2 #a3 #a4`,
onay modalı `#y_`, `window.APP_CFG={sbUrl:'http://localhost:PORT',sbKey:'TEST'}` için `context.add_init_script` (veya test kopyasında `config.js`), Supabase'i
`/auth/v1/*` ve `/rest/v1/user_data` uçlarını taklit eden küçük bir sahte sunucuyla (aynı origin, CORS gerekmez) ya da `context.route` ile taklit et. Çıkış testlerinde giriş ekranının gelmesini `wait_for_selector('#a1')` ile bekle.

## 10. Yapılacaklar (öncelik sırasıyla)
1. Supabase projesini kur (`KURULUM.md`), `config.js`'e `sbUrl`/`sbKey` yaz, Vercel adresini Supabase "Site URL"ine ekle, uçtan uca ve telefonda dene.
2. Mevcut yerel hesap verisini ilk bulut girişinde taşıma (yerel modda `bt_d_<kullanıcı adı>` var, bulutta `bt_d_<uid>`).
3. Demo şifre sıfırlamayı (`MAIL.mode`, "Test modu") ve yerel hesap modunu üretimde kaldır.
4. **Hesap silme** (Apple, uygulama içi hesap oluşturma varsa uygulama içinde silme ister — kuralı doğrula), e-posta değiştirme.
5. Fişleri IndexedDB/bulut depolamaya taşı; fiş okumayı sunucu üzerinden yap.
6. Altın fiyatı için güvenilir kaynak + sunucu önbelleği.
7. Gerçek push bildirimleri.
8. Analiz (PostHog/GA4): kaç kullanıcı, ne kadar süre. **Finansal tutarları asla gönderme**; sadece isimsiz kullanım olayları. Kullanıcıya bildir (KVKK).
9. Mağaza: Capacitor ile paketleme; Apple geliştirici hesabı (yıllık ücretli, Mac/Xcode gerekir), Google Play (tek seferlik ücret);
   gizlilik politikası, KVKK aydınlatma metni, App Store gizlilik beyanı, Play veri güvenliği formu.
10. Kod sağlığı: tek dosyayı modüllere böl (Vite), durumu merkezileştir, birim ve uçtan uca testler ekle.

## 11. Mağaza görselleri
10 adet App Store ekran görüntüsü (1290×2796) ve Play sürümleri HTML→PNG (Playwright) ile üretilip kullanıcıya verildi; üretim betikleri bu klasörde **yok**.
İçerikler örnek veridir (uydurma tutarlar, banka adları); gerçek ekran görüntüleriyle değiştirmek en güvenlisi.

## 12. Dürüstlük notları
- Çoğu özellik tarayıcıda Playwright ile denendi; **gerçek iPhone/Android cihazlarda test edilmedi.**
- Veriler cihazda tutulduğu için "veriler korunuyor" demek şimdilik doğru değil; kullanıcıya yedek almasını söyle.
- Giriş sistemi (bulut modu) gerçek sunucuyla doğrulanmadan "güvenli" diye sunma.

## 13. (ESKİ) Arayüz prototipi (React + shadcn/ui) — artık ana uygulamanın içinde, bu bölüm geçersiz
`web-shadcn/` = Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui (base-nova) projesi. Yalnızca **ana sayfa** var; veriyi aynı origin'deki
localStorage'dan **salt okunur** okur (`bt_cl` → `bt_d_<uid>` ya da `bt_sess` → `bt_d_<ad>`; yoksa örnek veri). Diğer sayfalar eski uygulamaya (`/`) bağlanır.
Derleme çıktısı kök dizinde `prototip/shadcn/` (commit'li; Vercel `/prototip/shadcn/` adresinde statik yayınlar). Derlemek için:
```bash
cd web-shadcn && npm install && npm run build
```
Not: `shadcn init` komutu bu ortamda yarıda kesildi; `src/lib/utils.ts` ve `src/index.css` (tema değişkenleri) elle yazıldı, bileşenler `@/lib/utils`'ten `cn` alır.
Bu prototip eski uygulamanın yerine geçmez; karar verilirse sayfalar tek tek taşınır.
