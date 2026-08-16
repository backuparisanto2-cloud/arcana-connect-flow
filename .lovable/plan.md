# Impor Griya Arca — MikroTik Dashboard

Menyalin isi repo `backuparisanto2-cloud/connect-arcana-flow` ke proyek ini, mengaktifkan backend Lovable Cloud, menerapkan skema database, dan menyimpan semua kredensial sebagai secret server.

## Apa yang akan ada di aplikasi

- **Halaman masuk** dengan username + password situs (gerbang akses, sesi cookie 7 hari).
- **Dashboard** status MikroTik (uptime, resource, trafik) + grafik MRTG ether1.
- **Halaman Hotspot** — daftar user hotspot dan IP binding dari router.
- **Halaman Perangkat** — katalog perangkat jaringan (nama, tipe, lokasi, IP/MAC, SSID, serial, catatan, foto) tersimpan di database dengan upload gambar.
- **Halaman Grafik** trafik ether1.

## Langkah pengerjaan

1. Salin seluruh source repo (routes, komponen, lib MikroTik, integrasi Supabase, aset, styling, manifest PWA) ke proyek ini, menggantikan halaman placeholder.
2. Samakan dependensi `package.json` dengan repo asal dan pasang.
3. Aktifkan Lovable Cloud dan jalankan kedua migrasi: tabel `devices` (+ kolom `serial_number`, `image_url`), grant, RLS policy, trigger `updated_at`, serta bucket/policy storage `device-images`.
4. Simpan secret server: `SITE_USERNAME`, `SITE_PASSWORD`, `MIKROTIK_HOST`, `MIKROTIK_PORT`, `MIKROTIK_USER`, `MIKROTIK_PASSWORD`, dan `SESSION_SECRET` (dibuat acak otomatis).
5. Verifikasi: build bersih, halaman masuk berfungsi, dashboard memanggil router, halaman perangkat membaca database.

## Catatan teknis

- Stack repo sama dengan proyek ini (TanStack Start + Vite + Tailwind v4 + shadcn), jadi impor bersifat langsung; `routeTree.gen.ts` akan diregenerasi.
- Akses MikroTik hanya lewat server function/`*.server.ts` — kredensial tidak pernah masuk bundle browser.
- Migrasi asli memberi akses baca/tulis penuh ke `anon` pada tabel `devices` dan storage. Karena aplikasi sudah dilindungi gerbang password situs, saya akan mempersempit akses `anon` agar data perangkat (termasuk password Wi‑Fi) tidak bisa dibaca publik lewat API, dan operasi perangkat dilakukan lewat server function di balik sesi gerbang.
- Bila koneksi ke `117.121.207.223:2629` tidak bisa dijangkau dari runtime server, halaman akan menampilkan status error dan kita perlu memastikan API MikroTik terbuka untuk IP keluar Lovable.
