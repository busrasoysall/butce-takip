# Butce Takip: Supabase Kurulumu (giris + bulut veritabani, ucretsiz plan yeter)

Bu adimlari bir kez yaparsin. Sonra e-posta dogrulama, sifremi unuttum e-postasi,
farkli telefonlarda ayni hesapla giris ve verilerin buluta kaydi calisir.

1. https://supabase.com adresinde "Start your project" de, GitHub hesabinla giris yap.
   "New project" ile proje olustur (isim: butce-takip, bolge: Frankfurt/EU, guclu bir
   veritabani sifresi sec ve bir yere kaydet. Bu sifre uygulamada kullanilmaz).
2. Soldan SQL Editor > New query. Bu klasordeki `supabase/schema.sql` dosyasinin
   tamamini yapistir ve Run de. "Success" gormelisin. (user_data tablosu ve guvenlik
   kurallari olusur: herkes sadece kendi verisini okur/yazar.)
3. Authentication > Sign In / Providers > Email: acik olsun, "Confirm email" acik olsun,
   minimum sifre uzunlugu 6 olsun.
4. Authentication > URL Configuration:
   - Site URL: Vercel adresin (ornek: https://butce-takip.vercel.app)
   - Redirect URLs: ayni adresi ve `https://butce-takip.vercel.app/**` ekle.
   (Dogrulama ve sifre sifirlama e-postalarindaki baglanti buraya doner.)
   GitHub Pages adresini de ekle: https://busrasoysall.github.io/butce-takip/ ve https://busrasoysall.github.io/butce-takip/**
   (Vercel adresi bazi mobil operatorlerde acilmayabilir; Pages adresi yedek olarak kullanilir.)
5. Authentication > Emails > Templates: "Confirm signup" ve "Reset password"
   sablonlarini Turkce yap (konu ve metin). Hazir e-posta servisi saatte az sayida mail
   gonderir; cok kullanici gelirse Project Settings > Auth > SMTP'den kendi servisini bagla.
6. Project Settings > API: "Project URL" ve "anon public" (veya "publishable") anahtari
   kopyala. DIKKAT: "service_role" / "secret" anahtarini ASLA kopyalama, kimseyle paylasma.
7. `web/src/lib/config.ts` dosyasini ac, `DEFAULTS` icindeki iki degeri yaz (sbUrl ve sbKey).
   Ayar paketin icine gomulur; ayri bir dosyaya bagli degildir. (`web/public/config.js` yalnizca /eski/ surumu icindir.)
8. Degisikligi GitHub'a gonder (git push); Vercel otomatik yeniden yayinlar.

Notlar
- Project URL ve anon anahtar gizli degildir, tarayicida gorunur. Guvenligi veritabanindaki
  RLS kurallari saglar (schema.sql). Bu yuzden RLS'i asla kapatma.
- service_role anahtari RLS'i asar. Sadece sunucu tarafinda (Vercel Environment Variables)
  kullanilir, kodda ve repoda hic bulunmamali.
- Sifreler Supabase'de hash'lenerek saklanir, sen goremezsin.
- Veriler `user_data` tablosunda, kullanici basina tek satir (JSON) olarak durur.
  Cevrimdisiyken yapilan degisiklikler telefonda kalir, internet gelince buluta yazilir.
  Iki cihazda ayni anda degisiklik yapilirsa uygulama hangisinin kalacagini sorar.
