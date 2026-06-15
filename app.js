'use strict';

window.HAUNTED_POINTS = [
  {
    id:'tugu', name:'Tugu Pal Putih', icon:'🕯️', category:'Sumbu Filosofis', sourceType:'Sejarah-budaya + storytelling',
    level:'Sedang', score:72, creature:'kunti', audio:'wind', x:0, z:-86,
    story:'Tugu menjadi gerbang simbolik kota. Dalam versi horror drive ini, tugu divisualkan sebagai titik awal aksis gelap yang menghubungkan utara dan selatan Jogja.',
    quote:'Dari utara, kota mulai berbisik.',
    spatial:'Berada pada sumbu utama kota sehingga cocok menjadi titik orientasi dan respawn awal.',
    safety:'Area terbuka dan mudah dikenali; gunakan sebagai titik kembali jika tersesat.'
  },
  {
    id:'stasiun', name:'Stasiun Tugu', icon:'🚉', category:'Heritage transport', sourceType:'Storytelling berbasis tempat',
    level:'Sedang', score:69, creature:'genderuwo', audio:'radio', x:-42, z:-58,
    story:'Suara roda besi dan pengumuman malam dipakai sebagai atmosfer urban legend. Stasiun menjadi zona transisi antara dunia nyata dan kota gelap.',
    quote:'Kereta terakhir tidak berhenti untuk semua orang.',
    spatial:'Dekat koridor Malioboro dan menjadi node pergerakan pengguna dari barat laut.',
    safety:'Rute keluar menuju koridor utama lebih jelas dibanding gang kecil.'
  },
  {
    id:'malioboro', name:'Malioboro', icon:'🌃', category:'Koridor wisata malam', sourceType:'Budaya populer + storytelling',
    level:'Sedang', score:76, creature:'pocong', audio:'heartbeat', x:-8, z:-34,
    story:'Koridor ramai yang dalam mode malam berubah menjadi jalan panjang dengan lampu neon, bayangan toko, dan bisikan dari sisi trotoar.',
    quote:'Di tempat paling ramai, bayangan justru paling mudah bersembunyi.',
    spatial:'Rute utama utara–selatan. Dalam game menjadi jalur aman relatif, tetapi danger naik jika terlalu lama idle.',
    safety:'Tetap di jalan utama; hindari masuk gang gelap ketika danger tinggi.'
  },
  {
    id:'vredeburg', name:'Benteng Vredeburg', icon:'🏰', category:'Heritage kolonial', sourceType:'Sejarah-budaya + urban storytelling',
    level:'Sedang', score:74, creature:'kunti', audio:'whisper', x:18, z:-17,
    story:'Benteng divisualkan sebagai blok batu besar dan halaman sunyi. Narasi noni Belanda diposisikan sebagai storytelling kreatif, bukan klaim sejarah pasti.',
    quote:'Jendela tua itu seperti masih mengawasi.',
    spatial:'Dekat Titik Nol dan Keraton, menjadi simpul antara rute heritage dan rute ekstrem.',
    safety:'Area terbuka; cocok sebagai titik berhenti sementara.'
  },
  {
    id:'nolkm', name:'Titik Nol Kilometer', icon:'📍', category:'Node kota', sourceType:'Sejarah-budaya + storytelling',
    level:'Sedang', score:70, creature:'genderuwo', audio:'hum', x:9, z:-4,
    story:'Titik pusat kota dipakai sebagai hub misi. Semua rute seolah kembali ke sini sebelum menuju zona lebih gelap.',
    quote:'Semua arah kembali ke nol.',
    spatial:'Hub persilangan rute easy, medium, dan extreme.',
    safety:'Gunakan sebagai titik orientasi sebelum menuju Keraton atau Tamansari.'
  },
  {
    id:'keraton', name:'Keraton Yogyakarta', icon:'👑', category:'Pusat budaya', sourceType:'Sejarah-budaya + storytelling',
    level:'Tinggi', score:84, creature:'kunti', audio:'gong', x:0, z:20,
    story:'Keraton divisualkan sebagai kompleks 3D berlapis. Aura sakral ditampilkan melalui lampu merah redup dan kabut rendah.',
    quote:'Tidak semua gerbang boleh dilewati malam-malam.',
    spatial:'Titik tengah sumbu budaya. Dalam game menjadi zona merah karena kompleksitas akses dan kekuatan narasi.',
    safety:'Ikuti rute utama dan gunakan safe zone terdekat jika danger melewati 70%.'
  },
  {
    id:'tamansari', name:'Tamansari', icon:'💧', category:'Heritage air', sourceType:'Storytelling fiktif berbasis tempat',
    level:'Tinggi', score:88, creature:'kunti', audio:'water', x:-33, z:44,
    story:'Lorong air dan ruang bawah tanah divisualkan sebagai labirin kecil. Efek suara air dan langkah jauh menjadi atmosfer utama.',
    quote:'Airnya tenang, tapi pantulannya bergerak sendiri.',
    spatial:'Area barat daya yang lebih tertutup, sehingga cocok menjadi zona risiko tinggi dan lokasi relik.',
    safety:'Jangan berhenti terlalu lama di zona merah; kembali ke jalur utama setelah mengambil relik.'
  },
  {
    id:'alkid', name:'Alun-Alun Kidul', icon:'🌳', category:'Tradisi Masangin', sourceType:'Tradisi/mitos populer',
    level:'Tinggi', score:91, creature:'pocong', audio:'wind', x:6, z:70,
    story:'Beringin kembar divisualkan sebagai dua pohon besar dengan gerbang kabut. Area ini menjadi arena challenge relik.',
    quote:'Lurus bukan berarti sampai.',
    spatial:'Ruang terbuka luas; cocok untuk safe zone sekaligus area misi karena mudah didemo.',
    safety:'Bagian tengah menjadi safe zone, tetapi sisi pinggir tetap rawan trap.'
  },
  {
    id:'krapyak', name:'Panggung Krapyak', icon:'🧱', category:'Sumbu selatan', sourceType:'Sejarah-budaya + storytelling',
    level:'Tinggi', score:82, creature:'genderuwo', audio:'forest', x:0, z:105,
    story:'Bangunan di ujung sumbu divisualkan sebagai menara tua. Dalam narasi game, ini adalah portal akhir kota gelap.',
    quote:'Di ujung sumbu, suara kota hilang.',
    spatial:'Titik selatan dan endpoint rute ekstrem.',
    safety:'Gunakan hanya setelah memahami rute; jaraknya jauh dari safe zone utama.'
  },
  {
    id:'kotagede', name:'Kotagede', icon:'🪦', category:'Heritage makam dan kota tua', sourceType:'Heritage + urban storytelling',
    level:'Tinggi', score:86, creature:'genderuwo', audio:'bell', x:82, z:42,
    story:'Kotagede menjadi ekstensi rute timur. Gang tua, makam, dan rumah tradisional dimodelkan sebagai distrik gelap terpisah.',
    quote:'Jalan kecil itu mengarah ke masa lalu.',
    spatial:'Ekstensi timur memperluas world agar pengalaman tidak hanya linear utara–selatan.',
    safety:'Rute kembali panjang; pantau sanity sebelum masuk distrik ini.'
  }
];

window.FACILITIES = [
  { id:'safe-alkid', name:'Safe Zone Alun-Alun Kidul', type:'safe-zone', icon:'🟢', x:20, z:63, radius:18 },
  { id:'safe-vredeburg', name:'Safe Zone Vredeburg', type:'safe-zone', icon:'🟢', x:30, z:-20, radius:14 },
  { id:'safe-malioboro', name:'Safe Zone Malioboro', type:'safe-zone', icon:'🟢', x:-20, z:-36, radius:13 }
];

window.AUDIO = {
  ambience: {src:'assets/audio/user/ambience_loop.wav', volume:.35, loop:true, label:'Ambience horor'},
  wind: {src:'assets/audio/user/graveyard_wind.wav', volume:.45, loop:true, label:'Angin kuburan'},
  radio: {src:'assets/audio/user/terror_radio.wav', volume:.35, loop:true, label:'Radio teror'},
  heartbeat: {src:'assets/audio/user/heartbeat_transition.wav', volume:.4, loop:true, label:'Detak jantung'},
  terror: {src:'assets/audio/user/terror_transition.wav', volume:.8, loop:false, label:'Terror'},
  scream: {src:'assets/audio/scream.wav', volume:.9, loop:false, label:'Scream'},
  kuntiLaugh: {src:'assets/audio/kunti_laugh.wav', volume:.85, loop:false, label:'Ketawa kuntilanak'},
  whisper: {src:'assets/audio/whisper.wav', volume:.45, loop:false, label:'Bisikan'},
  thunder: {src:'assets/audio/thunder.wav', volume:.75, loop:false, label:'Petir'},
  gong: {src:'assets/audio/user/gong.wav', volume:.65, loop:false, label:'Gong'},
  water: {src:'assets/audio/user/water.wav', volume:.45, loop:false, label:'Air'},
  hum: {src:'assets/audio/user/hum.wav', volume:.35, loop:false, label:'Hum'},
  forest: {src:'assets/audio/user/forest_wolves.wav', volume:.55, loop:false, label:'Hutan'},
  bell: {src:'assets/audio/user/bell.wav', volume:.55, loop:false, label:'Lonceng'}
};
