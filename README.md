# Pixel Realm

Game sandbox 2D pixel, dimainkan di browser, bisa dijadikan aplikasi (PWA, Android APK, Windows/Mac/Linux).
Tanpa server dan tanpa API: semua dunia & inventori tersimpan di perangkat pemain (localStorage).

## Main sekarang
Buka `www/index.html` langsung, atau `npx serve www`.

## Deploy ke Vercel
1. Upload folder ini ke GitHub, lalu vercel.com > Add New > Project > pilih repo.
2. Biarkan pengaturan default (vercel.json sudah mengarah ke folder `www`). Deploy.
Di HP/Chrome, buka situsnya > menu > "Install app" (PWA, jalan offline).

## Workflow GitHub Actions (.github/workflows)
- `web.yml`     : deploy otomatis ke GitHub Pages tiap push ke `main` (Settings > Pages > Source: GitHub Actions).
- `android.yml` : Actions > "Build Android APK" > Run workflow. Hasil: artifact `PixelRealm.apk` (landscape).
- `desktop.yml` : Actions > "Build desktop apps" > Run workflow. Hasil: .exe (Windows), .AppImage (Linux), .zip (Mac).
Buat tag `v1.0.0` agar APK & installer otomatis masuk ke halaman Releases.

## Kontrol
A/D atau panah = jalan, Spasi/W = lompat, tahan klik/tap = hancurkan (Fist) atau pasang blok, 1-9 = slot hotbar.
Seed ditanam di Grass/Dirt, jadi pohon dalam 90 detik (tetap tumbuh saat game ditutup), panen = gems + seed.
Lava = mati. Nama dunia sama = peta sama; tiap dunia tersimpan.

## Ubah cepat
`www/game.js`: DEF (kekerasan/drop blok), SHOP (harga), GROW (waktu tumbuh), W/H (ukuran dunia).
Naikkan `V` di `www/sw.js` setiap rilis agar PWA memuat versi baru.
