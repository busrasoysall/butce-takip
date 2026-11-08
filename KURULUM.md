# Butce Takip: Guvenli Giris Kurulumu (Firebase, ucretsiz)

Bu adimlari bir kez yaparsin. Sonra e-posta dogrulama, sifremi unuttum e-postasi
ve farkli telefonlarda ayni hesapla giris calisir.

1. https://console.firebase.google.com adresine Google hesabinla gir, "Proje ekle" de.
   Google Analytics'i simdilik kapali birakabilirsin.
2. Soldan Build > Authentication > "Get started". Sign-in method sekmesinde
   "Email/Password" secenegini ac ve kaydet. ("Email link" kismini acma.)
3. Authentication > Templates: "Email address verification" ve "Password reset"
   sablonlarinda dili Turkce yap. Istersen gonderici adini "Butce Takip" yap.
4. Authentication > Settings > Authorized domains: uygulamayi koydugun adresi
   (ornegin bir-isim.vercel.app) ekle.
5. Project settings (disli simge) > General > "Web API Key" degerini kopyala.
6. Bu klasordeki config.js dosyasini bir metin editoruyle ac, tirnaklarin arasina yapistir:
       window.APP_CFG={fbKey:"BURAYA_YAPISTIR"};
7. Degisikligi GitHub'a gonder (git push); Vercel otomatik yeniden yayinlar.

Notlar
- Web API Key gizli bir sifre degil, herkese acik olabilir. Guvenligi Firebase saglar.
  Yine de Google Cloud Console > APIs & Services > Credentials'ta bu anahtari sadece
  kendi adresine (HTTP referrer) kisitlamani oneririm.
- Hesaplar ve sifreler Google'in sunucularinda saklanir; sifreyi sen goremezsin.
- Uygulama verileri (gelir, gider vb.) hala kullanicinin kendi telefonunda durur.
  Farkli telefonda ayni hesapla giris yapilir ama veriler gelmez. Bunun icin sonraki
  adimda bulut veritabani (Firestore) eklenmeli.
