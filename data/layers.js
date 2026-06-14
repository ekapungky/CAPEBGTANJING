'use strict';

const WORLD_CONFIG = {
  bounds: 110,
  fogNear: 26,
  fogFar: 150,
  roadWidth: 7,
  startPosition: {x:-42, y:1.15, z:-55},
  startRotation: 0.55
};

const ROAD_PATHS = [
  [{x:-40,z:-55},{x:-26,z:-32},{x:-12,z:-12},{x:0,z:8},{x:1,z:25},{x:7,z:54},{x:4,z:80}],
  [{x:0,z:8},{x:-16,z:38}],
  [{x:8,z:8},{x:52,z:30}],
  [{x:-22,z:-26},{x:2,z:2},{x:8,z:8}]
];

const RISK_ZONES = [
  {id:'tamansari-risk', name:'Zona Rawan Tamansari', x:-16,z:38,r:17, creature:'kunti'},
  {id:'keraton-risk', name:'Zona Rawan Keraton', x:2,z:25,r:15, creature:'genderuwo'},
  {id:'alkid-risk', name:'Zona Rawan Alkid', x:8,z:54,r:20, creature:'pocong'},
  {id:'kotagede-risk', name:'Zona Rawan Kotagede', x:52,z:30,r:18, creature:'kunti'},
  {id:'krapyak-risk', name:'Zona Rawan Krapyak', x:4,z:78,r:16, creature:'genderuwo'}
];

const SAFE_ZONES = [
  {id:'vredeburg-safe', name:'Safe Zone Vredeburg', x:2,z:2,r:10},
  {id:'malioboro-safe', name:'Safe Zone Malioboro', x:-10,z:-12,r:10},
  {id:'alkid-safe', name:'Lapangan Terbuka Alkid', x:19,z:53,r:9}
];

const BUILDING_CLUSTERS = [
  {cx:-16,cz:-18,count:35,spread:26,base:1.8,color:0x241029},
  {cx:8,cz:12,count:45,spread:34,base:2.2,color:0x1a1025},
  {cx:-16,cz:38,count:22,spread:20,base:1.4,color:0x11172b},
  {cx:50,cz:30,count:40,spread:30,base:1.7,color:0x1c1222},
  {cx:3,cz:70,count:24,spread:23,base:1.3,color:0x131b17}
];
