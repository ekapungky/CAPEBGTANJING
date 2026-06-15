'use strict';

window.ROUTES = [
  { id:'main-axis', name:'Sumbu Utama Tugu–Krapyak', color:'#70d6ff', ids:['tugu','malioboro','nolkm','keraton','alkid','krapyak'] },
  { id:'heritage-loop', name:'Loop Heritage Gelap', color:'#ffd166', ids:['malioboro','stasiun','vredeburg','nolkm','keraton','tamansari','alkid'] },
  { id:'east-extension', name:'Ekstensi Kotagede', color:'#ff4fb8', ids:['nolkm','keraton','kotagede'] }
];

window.RISK_ZONES = [
  { id:'risk-malioboro', name:'Koridor Bayangan Malioboro', x:-8, z:-34, radius:22, level:'medium', creature:'pocong' },
  { id:'risk-keraton', name:'Zona Sakral Keraton', x:0, z:20, radius:24, level:'high', creature:'kunti' },
  { id:'risk-tamansari', name:'Lorong Air Tamansari', x:-33, z:44, radius:21, level:'high', creature:'kunti' },
  { id:'risk-alkid', name:'Beringin Kembar Alkid', x:6, z:70, radius:25, level:'high', creature:'pocong' },
  { id:'risk-kotagede', name:'Gang Tua Kotagede', x:82, z:42, radius:24, level:'high', creature:'genderuwo' }
];

window.WORLD_SETTINGS = {
  spawn: { x: 0, z: -112, y: 1.2, rotation: 0 },
  bounds: { minX: -110, maxX: 120, minZ: -125, maxZ: 128 },
  colors: {
    road: '#101019',
    roadEdge: '#321447',
    ground: '#08090e',
    route: '#70d6ff',
    risk: '#ff174f',
    safe: '#33d17a'
  }
};
