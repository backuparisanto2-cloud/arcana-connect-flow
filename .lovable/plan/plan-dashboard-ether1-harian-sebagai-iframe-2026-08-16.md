# Plan: Dashboard ether1 Harian sebagai iframe

Ubah tampilan ringkasan "ether1 to Internet (Harian)" di dashboard agar secara default muncul sebagai iframe (bukan GIF), sambil tetap menyimpan GIF sebagai alternatif.

## Tindakan

1. **Ubah default mode tampilan** di `src/components/Ether1DirectGraph.tsx` dari `gif` menjadi `page` (iframe).
2. **Sesuaikan URL iframe** agar menampilkan halaman MRTG khusus interface `ether1` lewat reverse proxy HTTPS:
   - iframe src: `/api/mrtg/graphs/iface/ether1/?t=<stamp>` (halaman direktori grafik ether1)
   - Pertahankan fallback GIF: `/api/mrtg/graphs/iface/ether1/daily.gif`
3. **Perbarui label toggle** agar mencerminkan perubahan default, misalnya "Grafik GIF" / "Halaman iframe".
4. **Uji build** dan verifikasi dashboard di browser — iframe harus memuat halaman ether1 tanpa mixed content.

## Catatan teknis
- Halaman MRTG dimuat melalui reverse proxy `/api/mrtg/*` yang sudah aktif dan menulis ulang URL absolut/relative upstream ke jalur proxy HTTPS.
- iframe tidak terkena mixed content karena browser meminta origin HTTPS yang sama.
- `daily.gif` tetap tersedia sebagai fallback alternatif bila iframe bermasalah.
