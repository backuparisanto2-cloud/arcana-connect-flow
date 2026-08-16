# Ganti ringkasan MRTG halaman depan ke embed langsung

Ubah ringkasan grafik MRTG ether1 di halaman depan dashboard agar langsung menampilkan gambar dari URL yang diberikan, bukan lewat proxy internal `/api/graph/ether1.gif`.

## Apa yang berubah

- **URL target:** `http://117.121.207.223:2627/graphs/iface/ether1/daily.gif`
- **Halaman yang terpengaruh:** `/_gated/` (dashboard halaman depan).
- **Halaman tidak berubah:** `/graph` tetap menampilkan tautan eksternal dengan penjelasan mixed-content.

## Langkah pengerjaan

1. Buat komponen presentasi baru `src/components/Ether1DirectGraph.tsx` yang:
   - Menyematkan `<img src="http://117.121.207.223:2627/graphs/iface/ether1/daily.gif">` dengan `cache-busting` (tambah `?t=<timestamp>`).
   - Memberi alt text dan dimensi tetap 500x170 agar layout tidak bergeser.
   - Menyegarkan gambar tiap 60 detik dan saat data router baru.
   - Menangani `onError` dengan pesan fallback jika gambar gagal dimuat (misalnya diblokir karena halaman HTTPS vs gambar HTTP).

2. Ubah `src/routes/_gated/index.tsx`:
   - Ganti pemanggilan `<Ether1Graph ... />` dengan komponen direct-embed baru.
   - Hapus import `Ether1Graph` dan ganti dengan `Ether1DirectGraph`.

3. Verifikasi:
   - Jalankan build untuk memastikan tidak ada error compile.
   - Tinjau preview/dashboard untuk memastikan gambar tampil atau fallback muncul bila diblokir browser.

## Catatan risiko

Aplikasi preview/published berjalan di HTTPS, sementara URL MRTG di atas adalah HTTP. Browser modern dapat memblokir/menandai gambar sebagai mixed-content, sehingga gambar mungkin tidak tampil. Komponen baru akan menampilkan fallback dengan penjelasan jika hal itu terjadi.
