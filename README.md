# Jogja After Dark — Full Bruno Driving Horror

Versi ini mengubah konsep WebGIS panel-heavy menjadi **3D driving horror world** seperti gaya Bruno Simon: pemain mengendarai mobil di world 3D, kamera mengikuti kendaraan, titik urban legend menjadi checkpoint, dan zona rawan menjadi trigger gameplay.

## Fitur

- Three.js full 3D world.
- Mobil 3D bisa dikendarai dengan WASD / Arrow.
- Kamera follow vehicle, cinematic, dan top-down.
- World low-poly Jogja After Dark.
- 10 titik urban legend/heritage Jogja.
- Zona rawan, safe zone, rute eksplorasi, landmark 3D.
- Mini game Relik Kutukan dengan collectible 3D.
- Trap mata merah dan jumpscare critical-only.
- Fog, vignette, noise, flash, mode Malam Jumat, Ghost Hunt Mode.
- UI lebih bersih: HUD minimal, dashboard kecil, panel misi bisa dibuka/tutup.

## Struktur folder

```text
jogja-after-dark-full-bruno/
├── index.html
├── css/
│   └── style.css
├── data/
│   ├── points.js
│   └── layers.js
├── js/
│   └── app.js
├── assets/
│   ├── img/
│   └── audio/
│       └── user/
├── RUN_LOCAL_SERVER.bat
├── TUTORIAL_DEMO_PRESENTASI.md
└── README.md
```

## Cara menjalankan lokal

Jangan dibuka langsung dengan `file://` kalau ingin stabil. Jalankan server lokal:

```bash
python -m http.server 8000
```

Lalu buka:

```text
http://localhost:8000
```

Atau di Windows, double-click:

```text
RUN_LOCAL_SERVER.bat
```

## Cara upload ke GitHub Pages

1. Extract ZIP.
2. Copy semua isi folder ke root repository GitHub kamu.
3. Pastikan file `index.html` berada di root repo, bukan di dalam subfolder tambahan.
4. Commit dan push.
5. Buka GitHub Pages repo kamu.

## Kontrol

- `W` / Arrow Up: maju
- `S` / Arrow Down: mundur/rem
- `A` / Arrow Left: belok kiri
- `D` / Arrow Right: belok kanan
- `SHIFT`: boost
- `SPACE`: lompat
- `ENTER`: buka info lokasi terdekat
- `R`: respawn
- `M`: mute/unmute

## Catatan presentasi

Narasi horor diposisikan sebagai **urban storytelling**, sedangkan aspek akademiknya tetap bisa dijelaskan sebagai geovisualisasi 3D, waypoint, rute, zona risiko, safe zone, dan interaksi spasial berbasis jarak.
