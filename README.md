# Jogja After Dark — GitHub Fixed Bruno Drive

Versi ini dibuat agar struktur GitHub seperti screenshot tetap rapi dan semua komponen web muncul saat dibuka melalui GitHub Pages.

## Struktur folder

```text
assets/
  audio/
    user/
  img/
css/
  style.css
data/
  layers.js
  points.js
js/
  app.js
index.html
README.md
RUN_LOCAL_SERVER.bat
TUTORIAL_DEMO_PRESENTASI.md
.nojekyll
```

## Cara upload ke GitHub

1. Extract ZIP.
2. Upload/copy semua isi folder ke root repository.
3. Pastikan `index.html` berada langsung di root, bukan di dalam folder lain.
4. Pastikan nama folder tetap huruf kecil: `css`, `js`, `data`, `assets`.
5. Commit dan push.
6. Buka GitHub Pages.

## Cara menjalankan lokal

```bash
python -m http.server 8000
```

Buka:

```text
http://localhost:8000
```

Jangan dibuka dengan `file://` karena loading script Three.js dan beberapa asset bisa tidak stabil.

## Perbaikan utama

- Path file dibuat relatif dan cocok untuk GitHub Pages.
- Semua folder asset disediakan agar tidak ada path kosong.
- Panel misi dibuat terbuka default supaya daftar lokasi langsung terlihat.
- UI dibuat tidak numpuk: world 3D fullscreen, HUD bawah, mission drawer kiri, info card kanan.
- Ada `.nojekyll` agar GitHub Pages tidak memproses folder sebagai Jekyll.
