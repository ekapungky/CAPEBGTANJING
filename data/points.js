'use strict';

const HAUNTED_POINTS = [
  {
    id:'tugu', name:'Tugu Pal Putih', icon:'🕯️', category:'Sumbu Filosofis', level:'Sedang', score:72,
    pos:{x:-34,z:-40}, creature:'kunti', quote:'Garis kota terasa lurus, tetapi malam membuatnya tidak selesai.',
    story:'Tugu Pal Putih menjadi pembuka sumbu imajiner kota. Dalam world ini, Tugu dibuat sebagai checkpoint awal yang memandu pemain ke koridor urban legend Jogja.',
    spatial:'Titik ini dipakai sebagai anchor utara untuk rute eksplorasi dari Tugu menuju Malioboro, Keraton, Tamansari, Alkid, Krapyak, sampai Kotagede.',
    sourceType:'Sejarah-budaya + urban storytelling'
  },
  {
    id:'stasiun-tugu', name:'Stasiun Tugu', icon:'🚉', category:'Heritage transportasi', level:'Sedang', score:70,
    pos:{x:-22,z:-26}, creature:'genderuwo', quote:'Lampu peron mati satu per satu, tetapi suara roda masih mendekat.',
    story:'Stasiun Tugu divisualisasikan sebagai area transit gelap. Efek radio rusak dan kabut dibuat untuk memberi kesan lorong perjalanan malam.',
    spatial:'Lokasi ini menjadi transisi dari zona utara ke koridor wisata malam Malioboro.',
    sourceType:'Heritage + storytelling berbasis lokasi'
  },
  {
    id:'malioboro', name:'Malioboro', icon:'🛍️', category:'Koridor wisata malam', level:'Sedang', score:68,
    pos:{x:-10,z:-12}, creature:'pocong', quote:'Di tempat paling ramai, justru ada langkah yang tidak punya pemilik.',
    story:'Malioboro dibuat sebagai koridor neon gelap. Bangunan rendah, lampu, dan jalur lurus membuat pemain merasa sedang melewati jalan kota malam.',
    spatial:'Koridor ini menghubungkan Tugu, Vredeburg, Titik Nol, dan Keraton. Rute utama world mengikuti sumbu ini.',
    sourceType:'Wisata-budaya + urban storytelling'
  },
  {
    id:'vredeburg', name:'Benteng Vredeburg', icon:'🏰', category:'Heritage kolonial', level:'Sedang', score:76,
    pos:{x:2,z:2}, creature:'kunti', quote:'Tembok lama tidak menyimpan suara, tetapi memantulkannya.',
    story:'Vredeburg dibuat sebagai fortress low-poly dengan lampu merah redup. Area ini menjadi safe checkpoint sekaligus lokasi narasi kolonial.',
    spatial:'Benteng berada dekat Titik Nol dan Keraton, sehingga cocok sebagai node tengah rute urban legend.',
    sourceType:'Sejarah-budaya + urban storytelling'
  },
  {
    id:'nol-km', name:'Titik Nol Kilometer', icon:'📍', category:'Node pusat kota', level:'Sedang', score:74,
    pos:{x:8,z:8}, creature:'pocong', quote:'Semua arah dimulai dari sini, termasuk arah yang tidak seharusnya dibuka.',
    story:'Titik Nol menjadi pusat world. Ketika pemain terlalu lama idle di area ini, danger meter naik perlahan.',
    spatial:'Node ini menjadi percabangan ke Vredeburg, Keraton, Malioboro, dan Tamansari.',
    sourceType:'Ruang kota + storytelling berbasis tempat'
  },
  {
    id:'keraton', name:'Keraton Yogyakarta', icon:'👑', category:'Pusat budaya', level:'Tinggi', score:82,
    pos:{x:0,z:24}, creature:'genderuwo', quote:'Di balik pagar, ada aturan yang tidak boleh dilanggar saat malam.',
    story:'Keraton divisualisasikan sebagai kompleks heritage dengan gerbang, halaman, dan cahaya emas redup.',
    spatial:'Keraton menjadi pusat rute selatan dan dekat dengan zona Tamansari serta Alkid.',
    sourceType:'Sejarah-budaya + urban storytelling'
  },
  {
    id:'tamansari', name:'Tamansari', icon:'🌊', category:'Heritage air', level:'Tinggi', score:88,
    pos:{x:-16,z:38}, creature:'kunti', quote:'Airnya tenang, tetapi bayangan di permukaannya bergerak terlambat.',
    story:'Tamansari menjadi zona rawan utama. World memberi efek kabut, cahaya biru, dan trigger jumpscare kritis bila danger tinggi.',
    spatial:'Lokasi ini agak menyamping dari sumbu utama, sehingga dibuat sebagai detour eksplorasi dengan risiko tinggi.',
    sourceType:'Heritage + urban storytelling'
  },
  {
    id:'alkid', name:'Alun-Alun Kidul', icon:'🌳', category:'Tradisi Masangin', level:'Tinggi', score:91,
    pos:{x:8,z:54}, creature:'pocong', quote:'Dua pohon itu bukan rintangan; mereka seperti sedang memilih siapa yang boleh lewat.',
    story:'Alkid dipakai sebagai arena tantangan. Dua beringin dibuat sebagai gate 3D; pemain dapat melewatinya untuk menurunkan danger.',
    spatial:'Alkid menjadi safe zone sekaligus challenge zone karena ruang terbukanya cocok untuk manuver mobil.',
    sourceType:'Tradisi/mitos populer'
  },
  {
    id:'krapyak', name:'Panggung Krapyak', icon:'🕳️', category:'Ujung selatan sumbu', level:'Tinggi', score:84,
    pos:{x:4,z:78}, creature:'genderuwo', quote:'Sumbu kota tidak berhenti; ia masuk ke gelap.',
    story:'Krapyak menjadi ujung selatan jalur utama. Semakin dekat ke titik ini, ambience lebih berat dan kabut lebih padat.',
    spatial:'Titik ini menutup rute linear Tugu-Keraton-Krapyak dan menjadi batas world sisi selatan.',
    sourceType:'Sumbu budaya + urban storytelling'
  },
  {
    id:'kotagede', name:'Kotagede', icon:'🏚️', category:'Heritage makam dan kota tua', level:'Tinggi', score:86,
    pos:{x:52,z:30}, creature:'kunti', quote:'Jalan kecil itu mengarah ke masa lalu.',
    story:'Kotagede menjadi ekstensi timur. Gang tua, makam, dan rumah tradisional dimodelkan sebagai distrik gelap terpisah.',
    spatial:'Ekstensi timur memaksa pemain keluar dari koridor utama agar world terasa lebih luas seperti sandbox.',
    sourceType:'Heritage + urban storytelling'
  }
];

const RELIC_POINTS = ['malioboro','vredeburg','keraton','tamansari','alkid'];
const TRAP_POINTS = ['krapyak','kotagede','nol-km'];
