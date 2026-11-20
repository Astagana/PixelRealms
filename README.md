# Pixel Realm

Game sandbox 2D pixel. Offline (guest) langsung jalan. Fitur online (akun, multiplayer, lock world, chat, voice, roulette server)
memakai Supabase, sehingga situs tetap statis dan bisa di-deploy ke Vercel.

## Fitur
- Akun: register/login (1 akun = 1 username, unik, tidak bisa diganti, tidak bisa dipakai orang lain)
- Multiplayer: pemain di world yang sama saling bertemu, edit blok tampil langsung
- Gold Lock (Shop, 100 gems): pasang di world yang belum terkunci -> hanya pemilik yang boleh membangun/menghancurkan. Pecahkan lock untuk membuka lagi
- Style: 20 hair, 20 baju, 20 celana, 6 warna kulit
- Nama di atas karakter: hijau = pemilik world, putih = pemain lain
- Chat (tombol Chat atau Enter) dan voice chat (tombol Mic, WebRTC, volume mengikuti jarak)
- Roulette Eropa (0-36) di tombol Casino; saat login, hasil diundi di database

## Setup online (sekali saja, gratis)
1. supabase.com > New project.
2. SQL Editor > New query > tempel isi `supabase/schema.sql` > Run.
3. Authentication > Providers > Email > matikan **Confirm email**.
4. Project Settings > API > salin Project URL dan anon key ke `www/config.js`.
   (anon key memang publik; keamanan dijaga RLS + fungsi di database.)
5. Jika register menolak domain email, ganti `EMAIL_DOMAIN` di `config.js` dengan domain milik Bos.

## Deploy ke Vercel
Upload folder ke GitHub > vercel.com > Add New > Project > pilih repo > Deploy (vercel.json sudah mengarah ke `www`).
Voice chat butuh HTTPS (Vercel otomatis). Voice memakai STUN publik; jaringan yang sangat ketat bisa butuh server TURN.

## Workflow aplikasi (.github/workflows)
- `web.yml` GitHub Pages | `android.yml` APK Android | `desktop.yml` Windows/Mac/Linux. Jalankan dari tab Actions.

## Batas keamanan (jujur)
- Dijaga server: username unik, penyimpanan world terkunci (hanya pemilik), klaim Gold Lock wajib punya item, hasil roulette.
- Dijaga klien: tampilan live edit pemain lain, jumlah gems dari menambang. Untuk anti-cheat penuh perlu server game otoritatif (Node + WebSocket di Render/Fly, bukan Vercel).
- Jangan jalankan dua orang mengedit world yang sama sambil bergantian simpan terlalu cepat: penyimpanan memakai "terakhir menyimpan menang".

## Kontrol
A/D atau panah jalan, Spasi/W lompat, tahan klik/tap = hancurkan (Fist) atau pasang blok, 1-9 slot hotbar, Enter chat.
Naikkan `V` di `www/sw.js` tiap rilis agar PWA memuat versi baru.
