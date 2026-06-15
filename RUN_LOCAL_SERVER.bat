<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#030307" />
  <title>Jogja After Dark — 3D Drive Horror Experience</title>

  <link rel="stylesheet" href="css/style.css" />
</head>

<body>
  <main id="app" aria-label="Jogja After Dark 3D Horror Driving Experience">
    <canvas id="worldCanvas" aria-label="3D world canvas"></canvas>

    <section id="introGate" class="intro-gate" aria-label="Intro game">
      <div class="intro-card">
        <div class="status-pill">3D HORROR DRIVE EXPERIENCE</div>

        <h1>JOGJA AFTER DARK</h1>
        <h2>Drive Through the Haunted City</h2>

        <p>
          Jelajahi kota horor 3D dengan mobil, temukan urban legend Jogja, masuk zona rawan,
          kumpulkan relik, dan gunakan safe zone untuk menurunkan Danger Meter.
        </p>

        <button id="enterBtn" class="primary-btn" type="button">
          Masuk ke Kota Gelap
        </button>

        <small>
          Kontrol: WASD/Arrow untuk jalan, Shift boost, Space lompat,
          Enter interaksi, R respawn, M mute.
        </small>
      </div>
    </section>

    <div class="noise" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>
    <div id="fogLayer" class="fog-layer" aria-hidden="true"></div>
    <div id="flashLayer" class="flash-layer" aria-hidden="true"></div>
    <div id="bloodText" class="blood-text" aria-hidden="true">JANGAN KELUAR JALUR</div>

    <div id="jumpscareOverlay" class="jumpscare-overlay hidden" aria-hidden="true">
      <img id="jumpscareImage" src="assets/img/kunti.svg" alt="jumpscare creature" />
      <div id="jumpscareCaption" class="jumpscare-caption">KUNTILANAK</div>
    </div>

    <aside id="heroPanel" class="panel hero-panel draggable ui-panel" aria-label="Panel deskripsi game">
      <div class="drag-handle">☰ Jogja After Dark</div>

      <h1>3D Haunted City Drive</h1>

      <p>
        Versi 3D game-like: mobil bisa dikendarai seperti world interaktif,
        bukan hanya peta statis.
      </p>

      <div class="chips">
        <span>Three.js</span>
        <span>Driving World</span>
        <span>Urban Legend</span>
        <span>Mini Game</span>
      </div>
    </aside>

    <aside id="legendPanel" class="panel legend-panel draggable ui-panel" aria-label="Panel arsip urban legend">
      <div class="drag-handle">☰ Arsip Urban Legend</div>

      <input
        id="searchInput"
        type="search"
        placeholder="Cari: Tugu, Tamansari, Alkid..."
        aria-label="Cari urban legend"
      />

      <div id="legendItems" aria-label="Daftar urban legend"></div>
    </aside>

    <aside id="controlPanel" class="panel control-panel draggable ui-panel" aria-label="Panel kontrol game">
      <div class="drag-handle">☰ Control Center</div>

      <div class="scenario-box">
        <span>SKENARIO AKTIF</span>
        <h2 id="scenarioTitle">Mode Drive Horor</h2>
        <p id="scenarioText">
          Kendarai mobil ke ikon urban legend. Tekan ENTER saat dekat lokasi.
        </p>
      </div>

      <div class="metric-grid">
        <div class="metric">
          <b id="mSpeed">0</b>
          <span>km/jam</span>
        </div>

        <div class="metric">
          <b id="mLegend">10</b>
          <span>lokasi</span>
        </div>

        <div class="metric">
          <b id="mRelic">0/5</b>
          <span>relik</span>
        </div>

        <div class="metric">
          <b id="mSanity">100</b>
          <span>sanity</span>
        </div>
      </div>

      <div class="danger-wrap">
        <div class="danger-head">
          <b>Danger Meter</b>
          <span id="dangerText">0%</span>
        </div>

        <div class="danger-bar">
          <div id="dangerFill"></div>
        </div>

        <small>
          Naik saat mobil berada di zona merah, menabrak trap,
          atau terlalu lama idle di area rawan.
        </small>
      </div>

      <h3>Mode Interaktif</h3>

      <button id="kliwonBtn" class="danger-btn" type="button">
        🌑 Aktifkan Malam Jumat
      </button>

      <button id="ghostHuntBtn" class="purple-btn" type="button">
        🔦 Ghost Hunt Mode
      </button>

      <button id="miniGameBtn" class="green-btn" type="button">
        🎮 Mulai Mini Game Relik
      </button>

      <button id="qualityBtn" class="blue-btn" type="button">
        ⚙️ Quality: High
      </button>

      <button id="cameraBtn" class="blue-btn" type="button">
        🎥 Kamera: Follow
      </button>

      <h3>Kontrol Cepat</h3>

      <button id="respawnBtn" class="dark-btn" type="button">
        📍 I'm Stuck / Respawn
      </button>

      <button id="resetBtn" class="dark-btn" type="button">
        ↻ Reset World
      </button>

      <button id="muteBtn" class="dark-btn" type="button">
        🔊 Mute / Unmute
      </button>

      <button id="panicBtn" class="dark-btn" type="button">
        🧯 Matikan Efek
      </button>

      <details class="test-box">
        <summary>Test efek opsional</summary>

        <button data-creature="kunti" class="test-scare" type="button">
          👻 Test Kunti
        </button>

        <button data-creature="pocong" class="test-scare" type="button">
          🧟 Test Pocong
        </button>

        <button data-creature="genderuwo" class="test-scare" type="button">
          👹 Test Genderuwo
        </button>
      </details>
    </aside>

    <aside id="infoPanel" class="panel info-panel draggable ui-panel" aria-label="Panel informasi lokasi">
      <div class="drag-handle">☰ Info Lokasi</div>

      <div id="infoContent">
        <h2>Belum ada lokasi dipilih</h2>
        <p>
          Dekati ikon 3D urban legend dengan mobil. Tekan ENTER untuk membuka cerita,
          analisis spasial, dan safety note.
        </p>
      </div>
    </aside>

    <section id="driveHud" class="drive-hud ui-panel" aria-label="Drive HUD">
      <div id="nearHint" class="near-hint">Cari titik urban legend terdekat</div>

      <div class="speedometer">
        <span id="hudSpeed">0</span>
        <small>km/jam</small>
      </div>

      <div class="control-hints">
        <span>WASD / Arrow: Drive</span>
        <span>SHIFT: Boost</span>
        <span>SPACE: Jump</span>
        <span>ENTER: Interact</span>
        <span>R: Respawn</span>
      </div>
    </section>

    <section id="gamePanel" class="game-panel hidden" aria-label="Mini game panel">
      <b>🎮 MINI GAME: RELIK KUTUKAN</b>

      <p>
        Drive ke 5 relik emas. Hindari mata merah.
        Masuk safe zone untuk menurunkan danger.
      </p>

      <div class="progress">
        <div id="gameProgress"></div>
      </div>

      <span id="gameStatus">Relik: 0/5</span>
    </section>

    <section class="map-legend" tabindex="0" aria-label="Legenda peta">
  <b class="map-legend-title">🧭 Legenda</b>

  <div class="map-legend-list">
    <div><span class="dot high"></span>Zona rawan 3D</div>
    <div><span class="dot safe"></span>Safe zone</div>
    <div><span class="line route"></span>Rute eksplorasi</div>
    <div>🚗 Mobil eksplorasi</div>
    <div>📿 Relik / 👁️ Trap</div>
  </div>
</section>

    <canvas id="miniMap" width="180" height="180" aria-label="Mini map"></canvas>

    <div id="toast" class="toast" role="status" aria-live="polite">
      Klik “Masuk ke Kota Gelap”.
    </div>

    <nav id="uiDock" class="ui-dock hidden" aria-label="Buka panel game"></nav>
  </main>

  <script src="data/points.js"></script>
  <script src="data/layers.js"></script>
  <script type="module" src="js/app.js"></script>
</body>
</html>