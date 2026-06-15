# Jogja After Dark — 3D Drive Horror Experience

Versi ini mengubah WebGIS horor menjadi **3D driving experience** berbasis Three.js. Konsepnya terinspirasi dari web interaktif Bruno Simon: pengguna mengendarai kendaraan di world 3D, melakukan interaksi di titik tertentu, memakai kontrol keyboard, dan membuka panel informasi/misi.

## Cara menjalankan

```bash
python -m http.server 8000
```

Lalu buka:

```text
http://localhost:8000
```

Jangan buka langsung `index.html` dengan `file://`, karena module JavaScript dan audio browser lebih stabil lewat local server.

## Struktur folder

```text
3D-JogjaAfterDark/
├── assets/
│   ├── audio/
│   │   └── user/
│   └── img/
├── css/
│   └── style.css
├── data/
│   ├── layers.js
│   └── points.js
├── js/
│   └── app.js
├── index.html
├── README.md
└── RUN_LOCAL_SERVER.bat
```

## Fitur utama

- World 3D low-poly kota Jogja berbasis Three.js.
- Mobil horror drive dengan kontrol WASD/Arrow.
- Kamera follow, cinematic, dan top view.
- Landmark 3D untuk 10 titik urban legend/heritage.
- Rute 3D: sumbu utama, loop heritage, dan ekstensi Kotagede.
- Zona rawan 3D dan safe zone.
- Mini game relik: kumpulkan 5 relik dan hindari 2 trap mata merah.
- Danger Meter, sanity, speedometer, minimap, dan panel lokasi.
- Jumpscare critical-only agar tidak spam saat presentasi.
- Tombol aman: mute, respawn, reset world, dan matikan efek.

## Kontrol

- `WASD` / `Arrow`: mengendarai mobil.
- `Shift`: boost.
- `Ctrl`: rem.
- `Space`: lompat.
- `Enter`: interaksi saat dekat lokasi.
- `R`: respawn.
- `M`: mute/unmute.

## Catatan GitHub

Kalau repo kamu sudah punya audio seperti `assets/audio/user/*.wav`, biarkan tetap ada. Kode ini otomatis mencoba memutar audio tersebut. Kalau file audio belum ada, web tetap jalan; hanya audio tertentu yang tidak bunyi.

## Catatan akademik presentasi

Narasi hantu digunakan sebagai **urban storytelling**. Bagian yang bisa diklaim secara teknis adalah implementasi world 3D, interaksi spasial, rute, zona risiko, safe zone, minimap, dan game mechanic.
