# Sinkron Perangkat dari IP-Binding Hotspot — Anti Duplikat

## Kondisi saat ini

- Sinkron sudah mengambil IP-Binding dari MikroTik dan menulis ke tabel perangkat, dicocokkan hanya berdasarkan MAC address.
- Di database sekarang ada 18 baris, 17 kombinasi MAC+IP unik: satu pasangan kembar (`6.IPCAM-H6C`, MAC `0C:A6:4C:4C:AA:FD`, IP `192.168.35.170`) tercatat dua kali.
- Setiap sinkron, baris yang cocok tetap ditulis ulang (catatan diperbarui) walau isinya sama.

## Yang akan diubah

1. **Kunci unik MAC + IP.** Perangkat dianggap sama bila MAC dan IP sama. Bila MAC sama tetapi IP berbeda (atau sebaliknya), itu perangkat/entri berbeda dan tetap disimpan.
2. **Bersihkan duplikat lama.** Hapus baris kembar yang sudah terlanjur masuk, menyisakan satu baris (yang paling awal dibuat) per kombinasi MAC+IP.
3. **Cegah duplikat di masa depan.** Tambah indeks unik di database untuk kombinasi MAC+IP (hanya untuk baris yang punya MAC), sehingga sinkron ganda tidak bisa membuat baris kembar.
4. **Sinkron jadi idempoten.** Saat sinkron:
   - Binding dengan MAC+IP yang sudah ada → dilewati, tidak ditulis ulang, tidak dihitung sebagai perubahan.
   - Binding dengan MAC baru, atau MAC lama dengan IP berbeda → dibuat baris baru.
   - Duplikat di dalam hasil router itu sendiri (binding kembar) juga disaring sebelum ditulis.
5. **Tampilan daftar** tetap seperti sekarang, tapi karena data sudah bersih tidak ada lagi baris kembar; ringkasan hasil sinkron menampilkan jumlah baru / dilewati.

## Catatan teknis

- Migrasi SQL: hapus duplikat berdasarkan `ctid`/`created_at`, lalu `CREATE UNIQUE INDEX ... ON public.devices (upper(mac_address), coalesce(ip_address,'')) WHERE mac_address IS NOT NULL`.
- `syncDevicesFromBindings` di `src/lib/devices.functions.ts` diubah: bangun peta kunci `MAC|IP` dari data yang ada, saring binding duplikat, hanya `insert` untuk kunci yang belum ada, tanpa `update` massal. Kembalikan `{ created, skipped }`.
- Teks status di `src/routes/_gated/perangkat.tsx` disesuaikan dengan bentuk hasil baru.
