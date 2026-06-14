'use strict';

const WORLD_CONFIG = {
  bounds: 104,
  roadWidth: 8.4,
  carStart: {x:-38, z:-62, rot:0.72},
  cameraModes: ['follow','close','wide','top']
};

const ROAD_PATHS = [
  [{x:-38,z:-62},{x:-24,z:-44},{x:-8,z:-28},{x:0,z:-18},{x:3,z:8},{x:0,z:28},{x:14,z:50},{x:0,z:76}],
  [{x:3,z:8},{x:18,z:2},{x:38,z:8},{x:58,z:26}],
  [{x:0,z:28},{x:-24,z:38},{x:-36,z:44}],
  [{x:-18,z:-34},{x:0,z:-18},{x:18,z:2}],
  [{x:14,z:50},{x:-10,z:58},{x:-28,z:48},{x:-24,z:38}]
];

const RISK_ZONES = [
  {id:'malioboro-risk', name:'Koridor Malioboro', x:0, z:-18, r:14, creature:'genderuwo'},
  {id:'nolkm-risk', name:'Pusat Nol KM', x:4, z:9, r:14, creature:'pocong'},
  {id:'keraton-risk', name:'Keraton Gelap', x:0, z:28, r:16, creature:'genderuwo'},
  {id:'tamansari-risk', name:'Lorong Air Tamansari', x:-24, z:38, r:15, creature:'kunti'},
  {id:'kotagede-risk', name:'Gang Makam Kotagede', x:58, z:26, r:17, creature:'kunti'}
];

const SAFE_ZONES = [
  {id:'alkid-safe', name:'Safe Zone Alkid', x:14, z:50, r:13},
  {id:'vredeburg-safe', name:'Safe Zone Benteng', x:18, z:2, r:10},
  {id:'tugu-safe', name:'Start Safe Zone', x:-34, z:-52, r:11}
];

const BUILDING_CLUSTERS = [
  {cx:-22,cz:-26,spread:42,count:34,base:4,color:0x22172a},
  {cx:14,cz:-4,spread:45,count:38,base:5,color:0x27172c},
  {cx:-16,cz:32,spread:38,count:28,base:4,color:0x2b1a24},
  {cx:44,cz:22,spread:36,count:32,base:3,color:0x211a22},
  {cx:4,cz:66,spread:34,count:24,base:3,color:0x1a2025}
];
