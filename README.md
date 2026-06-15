import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';

'use strict';

const POINTS = window.HAUNTED_POINTS || [];
const ROUTES = window.ROUTES || [];
const RISK_ZONES = window.RISK_ZONES || [];
const FACILITIES = window.FACILITIES || [];
const WORLD = window.WORLD_SETTINGS || { spawn:{x:0,y:1,z:-100,rotation:0}, bounds:{minX:-120,maxX:120,minZ:-130,maxZ:130} };
const AUDIO = window.AUDIO || {};

const state = {
  started:false,
  muted:false,
  quality:'high',
  cameraMode:'follow',
  kliwon:false,
  ghostHunt:false,
  miniGame:false,
  collected:0,
  sanity:100,
  danger:0,
  speedKmh:0,
  nearest:null,
  activeTrack:null,
  activeTrackKey:null,
  lastScareAt:0,
  scareCooldownMs:9000,
  scareVisible:false,
  idle:0,
  lastInteract:0
};

const input = {
  forward:false,
  back:false,
  left:false,
  right:false,
  boost:false,
  brake:false,
  jump:false
};

const vehicle = {
  group:null,
  speed:0,
  verticalSpeed:0,
  grounded:true,
  steering:0,
  spawn:new THREE.Vector3(WORLD.spawn.x, WORLD.spawn.y, WORLD.spawn.z)
};

const refs = {};
let UI = null;

function setupUIRefs(){
  refs.heroPanel = document.getElementById('heroPanel') || document.querySelector('.hero-panel');
  refs.legendPanel = document.getElementById('legendPanel') || document.querySelector('.legend-panel');
  refs.controlPanel = document.getElementById('controlPanel') || document.querySelector('.control-panel');
  refs.infoPanel = document.getElementById('infoPanel') || document.querySelector('.info-panel');
  refs.driveHud = document.getElementById('driveHud') || document.querySelector('.drive-hud');

  refs.heroHeader = refs.heroPanel?.querySelector('.drag-handle');
  refs.legendHeader = refs.legendPanel?.querySelector('.drag-handle');
  refs.controlHeader = refs.controlPanel?.querySelector('.drag-handle');
  refs.infoHeader = refs.infoPanel?.querySelector('.drag-handle');

  UI = {
    hero: refs.heroPanel,
    hud: refs.driveHud,
    control: refs.controlPanel,
    legend: refs.legendPanel,
    info: refs.infoPanel,
    game: refs.gamePanel,
    intro: refs.introGate
  };
}

function show(el){
  if(!el) return;
  el.classList.remove('hidden');
  el.classList.add('ui-visible');
}

function hide(el){
  if(!el) return;
  el.classList.add('hidden');
  el.classList.remove('ui-visible');
}
function showDock(){
  const dock = document.getElementById('uiDock');
  if(!dock) return;

  dock.classList.remove('hidden');
}
function togglePanel(panel){
  if(!panel) return;

  const isClosed =
    panel.classList.contains('hidden') ||
    !panel.classList.contains('ui-visible');

  if(isClosed){
    show(panel);
  } else {
    hide(panel);
  }
}
function setupDockButtons(){
  const dock = document.getElementById('uiDock');
  if(!dock) return;

  document.getElementById('quickDock')?.remove();

  document.querySelectorAll('.ui-dock').forEach(item => {
    if(item.id !== 'uiDock') item.remove();
  });

  dock.innerHTML = `
    <button type="button" id="dockToggle" class="dock-toggle">☰ UI</button>

    <div class="dock-menu">
      <button type="button" data-panel="heroPanel">Hero</button>
      <button type="button" data-panel="controlPanel">Control</button>
      <button type="button" data-panel="legendPanel">Legend</button>
      <button type="button" data-panel="infoPanel">Info</button>
      <button type="button" data-panel="driveHud">HUD</button>
    </div>
  `;

  const toggleBtn = dock.querySelector('#dockToggle');

  toggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    dock.classList.toggle('dock-open');
  });

  dock.querySelectorAll('.dock-menu button').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();

      const panel = document.getElementById(btn.dataset.panel);
      togglePanel(panel);

      dock.classList.remove('dock-open');
    });
  });
}

const objects = {
  scene:null,
  camera:null,
  renderer:null,
  clock:null,
  car:null,
  headlights:null,
  ghostLight:null,
  labels:[],
  riskMeshes:[],
  safeMeshes:[],
  routeMeshes:[],
  relics:[],
  traps:[],
  landmarkGroups:[],
  animated:[]
};

const creatures = {
  kunti:{name:'KUNTILANAK', img:'assets/img/kunti.svg', sequence:['terror','kuntiLaugh','scream']},
  pocong:{name:'POCONG', img:'assets/img/pocong.svg', sequence:['terror','scream']},
  genderuwo:{name:'GENDERUWO', img:'assets/img/genderuwo.svg', sequence:['terror','thunder']}
};

initDomRefs();
setupUIRefs();
initThree();
createWorld();
bindUI();
renderLegendList(POINTS.slice(0, 3));
makeDraggable();
updateUI();
animate();

globalThis.playLocationAudio = playLocationAudio;
globalThis.focusLocation = focusLocation;
globalThis.interactWithPoint = interactWithPoint;

function initDomRefs(){
  const ids = [
    'worldCanvas','introGate','enterBtn',
    'kliwonBtn','ghostHuntBtn','miniGameBtn',
    'qualityBtn','cameraBtn','respawnBtn','resetBtn',
    'muteBtn','panicBtn','toast','infoContent',
    'legendItems','searchInput','mSpeed','hudSpeed',
    'mLegend','mRelic','mSanity','dangerText',
    'dangerFill','nearHint','gamePanel','gameProgress',
    'gameStatus','scenarioTitle','scenarioText','miniMap',
    'jumpscareOverlay','jumpscareImage','jumpscareCaption',
    'flashLayer','bloodText'
  ];

  ids.forEach(id => {
    refs[id] = document.getElementById(id);
  });
}

function initThree(){
  objects.scene = new THREE.Scene();
  objects.scene.background = new THREE.Color(0x030308);
  objects.scene.fog = new THREE.FogExp2(0x06040a, 0.014);

  objects.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 800);
  objects.camera.position.set(0, 18, -136);

  objects.renderer = new THREE.WebGLRenderer({canvas:refs.worldCanvas, antialias:true, powerPreference:'high-performance'});
  objects.renderer.setSize(window.innerWidth, window.innerHeight);
  objects.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  objects.renderer.outputColorSpace = THREE.SRGBColorSpace;
  objects.renderer.shadowMap.enabled = true;
  objects.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  objects.clock = new THREE.Clock();

  const ambient = new THREE.AmbientLight(0x7766aa, 0.55);
  objects.scene.add(ambient);

  const moon = new THREE.DirectionalLight(0xb7d5ff, 1.3);
  moon.position.set(-60, 120, -80);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -170;
  moon.shadow.camera.right = 170;
  moon.shadow.camera.top = 170;
  moon.shadow.camera.bottom = -170;
  objects.scene.add(moon);

  const redGlow = new THREE.PointLight(0xff0f68, 1.7, 170, 1.7);
  redGlow.position.set(0, 24, 15);
  objects.scene.add(redGlow);

  objects.ghostLight = new THREE.SpotLight(0xff4fb8, 0, 65, Math.PI * 0.18, 0.45, 1.2);
  objects.ghostLight.position.set(0, 6, 0);
  objects.scene.add(objects.ghostLight);
  objects.scene.add(objects.ghostLight.target);

  window.addEventListener('resize', onResize);
}

function createWorld(){
  createGround();
  createRouteRoads();
  createRiskAndSafeZones();
  createFacilities();
  createLandmarks();
  createDecorativeCity();
  createVehicle();
  createSkyObjects();
}

function createGround(){
  const mat = new THREE.MeshStandardMaterial({color:0x07080f, roughness:0.96, metalness:0.05});
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360, 80, 80), mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  objects.scene.add(ground);

  const grid = new THREE.GridHelper(320, 64, 0x362040, 0x151321);
  grid.position.y = 0.012;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  objects.scene.add(grid);

  const boundaryMat = new THREE.LineBasicMaterial({color:0x4e1a5b, transparent:true, opacity:0.75});
  const b = WORLD.bounds;
  const boundaryPts = [
    new THREE.Vector3(b.minX, .05, b.minZ), new THREE.Vector3(b.maxX, .05, b.minZ),
    new THREE.Vector3(b.maxX, .05, b.maxZ), new THREE.Vector3(b.minX, .05, b.maxZ),
    new THREE.Vector3(b.minX, .05, b.minZ)
  ];
  objects.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(boundaryPts), boundaryMat));
}

function createRouteRoads(){
  ROUTES.forEach(route => {
    const pts = route.ids.map(id => POINTS.find(p => p.id === id)).filter(Boolean);
    for(let i=0;i<pts.length-1;i++) createRoadSegment(pts[i], pts[i+1], route.color, i === 0 ? route.name : '');
    createRouteLine(pts, route.color);
  });
}

function createRoadSegment(a, b, color, label){
  const ax = a.x, az = a.z, bx = b.x, bz = b.z;
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(10, .08, len + 7),
    new THREE.MeshStandardMaterial({color:0x0d0d16, roughness:.86, metalness:.02})
  );
  road.position.set((ax+bx)/2, .055, (az+bz)/2);
  road.rotation.y = angle;
  road.receiveShadow = true;
  objects.scene.add(road);
  objects.routeMeshes.push(road);

  const edgeMat = new THREE.MeshBasicMaterial({color:new THREE.Color(color), transparent:true, opacity:.22});
  [-5.3, 5.3].forEach(offset => {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(.35, .09, len + 7), edgeMat);
    edge.position.set((ax+bx)/2 + Math.cos(angle) * offset, .09, (az+bz)/2 - Math.sin(angle) * offset);
    edge.rotation.y = angle;
    objects.scene.add(edge);
  });

  if(label) {
    const spr = createTextSprite(label, {fontSize:40, color:'#70d6ff', background:'rgba(0,0,0,.2)'});
    spr.position.set((ax+bx)/2, 2.1, (az+bz)/2);
    spr.scale.set(24, 6, 1);
    objects.scene.add(spr);
  }
}

function createRouteLine(points, color){
  const verts = points.map(p => new THREE.Vector3(p.x, .25, p.z));
  const geo = new THREE.BufferGeometry().setFromPoints(verts);
  const mat = new THREE.LineBasicMaterial({color:new THREE.Color(color), transparent:true, opacity:.72});
  const line = new THREE.Line(geo, mat);
  objects.scene.add(line);
}

function createRiskAndSafeZones(){
  RISK_ZONES.forEach(zone => {
    const geo = new THREE.CylinderGeometry(zone.radius, zone.radius, .18, 64, 1, true);
    const mat = new THREE.MeshBasicMaterial({color:0xff174f, transparent:true, opacity:zone.level === 'high' ? .22 : .14, depthWrite:false, side:THREE.DoubleSide});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(zone.x, .2, zone.z);
    mesh.userData = {type:'risk', zone};
    objects.scene.add(mesh);
    objects.riskMeshes.push(mesh);

    const ring = new THREE.Mesh(new THREE.RingGeometry(zone.radius-.5, zone.radius+.5, 96), new THREE.MeshBasicMaterial({color:0xff174f, transparent:true, opacity:.65, side:THREE.DoubleSide}));
    ring.rotation.x = -Math.PI/2;
    ring.position.set(zone.x, .32, zone.z);
    objects.scene.add(ring);
    objects.animated.push({mesh:ring, type:'ring', speed:.9});
  });

  FACILITIES.forEach(f => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(f.radius-.5, f.radius+.5, 72), new THREE.MeshBasicMaterial({color:0x33d17a, transparent:true, opacity:.72, side:THREE.DoubleSide}));
    ring.rotation.x = -Math.PI/2;
    ring.position.set(f.x, .34, f.z);
    ring.userData = {type:'safe', facility:f};
    objects.scene.add(ring);
    objects.safeMeshes.push(ring);

    const fill = new THREE.Mesh(new THREE.CircleGeometry(f.radius, 72), new THREE.MeshBasicMaterial({color:0x33d17a, transparent:true, opacity:.09, side:THREE.DoubleSide, depthWrite:false}));
    fill.rotation.x = -Math.PI/2;
    fill.position.set(f.x, .18, f.z);
    objects.scene.add(fill);
  });
}

function createFacilities(){
  FACILITIES.forEach(f => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.55,.75,6,12), new THREE.MeshStandardMaterial({color:0x0f5d38, emissive:0x052b1b, roughness:.7}));
    pole.position.set(f.x, 3, f.z);
    pole.castShadow = true;
    objects.scene.add(pole);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.7, 24, 16), new THREE.MeshStandardMaterial({color:0x33d17a, emissive:0x33d17a, emissiveIntensity:1.4, roughness:.3}));
    beacon.position.set(f.x, 7, f.z);
    objects.scene.add(beacon);
    objects.animated.push({mesh:beacon, type:'hover', amplitude:.45, baseY:7, speed:1.8});

    const light = new THREE.PointLight(0x33d17a, .9, 30);
    light.position.set(f.x, 8, f.z);
    objects.scene.add(light);

    const label = createTextSprite(f.name, {fontSize:38, color:'#8fffc1', background:'rgba(0,0,0,.25)'});
    label.position.set(f.x, 11, f.z);
    label.scale.set(20, 5, 1);
    objects.scene.add(label);
  });
}

function createLandmarks(){
  POINTS.forEach((p, index) => {
    const group = new THREE.Group();
    group.position.set(p.x, 0, p.z);
    group.userData = {type:'haunted-point', point:p};

    const baseMat = new THREE.MeshStandardMaterial({color:0x16111d, roughness:.86, metalness:.08});
    const accentMat = new THREE.MeshStandardMaterial({color:0x3a173e, emissive:0x240018, emissiveIntensity:.25, roughness:.76});
    const glowMat = new THREE.MeshStandardMaterial({color:0xff4fb8, emissive:0xff0f68, emissiveIntensity:1.45, roughness:.35});

    if(p.id === 'tugu'){
      addMesh(group, new THREE.CylinderGeometry(2.3,3.2,14,18), baseMat, 0, 7, 0);
      addMesh(group, new THREE.ConeGeometry(2.4,4.2,18), glowMat, 0, 16.1, 0);
    } else if(p.id === 'stasiun'){
      addMesh(group, new THREE.BoxGeometry(18,7,10), baseMat, 0, 3.5, 0);
      addMesh(group, new THREE.BoxGeometry(6,12,6), accentMat, -7, 6, -1);
      addMesh(group, new THREE.CylinderGeometry(1,1,2,16), glowMat, 7, 8.5, 0);
    } else if(p.id === 'malioboro'){
      for(let i=-2;i<=2;i++) addMesh(group, new THREE.BoxGeometry(5, 7 + Math.abs(i)*2, 4), i%2 ? accentMat : baseMat, i*6, 3.5 + Math.abs(i), 0);
      addMesh(group, new THREE.BoxGeometry(34,.45,2), glowMat, 0, 8, -4);
    } else if(p.id === 'vredeburg'){
      addMesh(group, new THREE.BoxGeometry(18,8,18), baseMat, 0, 4, 0);
      addMesh(group, new THREE.BoxGeometry(24,2,24), accentMat, 0, 9, 0);
      [[-10,-10],[10,-10],[-10,10],[10,10]].forEach(([x,z])=>addMesh(group,new THREE.CylinderGeometry(2,2,9,12),accentMat,x,4.5,z));
    } else if(p.id === 'keraton'){
      addMesh(group, new THREE.BoxGeometry(26,6,18), baseMat, 0, 3, 0);
      addMesh(group, new THREE.ConeGeometry(16,8,4), accentMat, 0, 10, 0, 0, Math.PI/4, 0);
      addMesh(group, new THREE.SphereGeometry(2.2,24,16), glowMat, 0, 15, 0);
    } else if(p.id === 'tamansari'){
      addMesh(group, new THREE.BoxGeometry(18,5,14), baseMat, 0, 2.5, 0);
      addMesh(group, new THREE.TorusGeometry(8, .7, 12, 64), glowMat, 0, 6, 0, Math.PI/2, 0, 0);
      addMesh(group, new THREE.CylinderGeometry(5,5,.35,32), new THREE.MeshBasicMaterial({color:0x235577, transparent:true, opacity:.45}), 0, .2, 0);
    } else if(p.id === 'alkid'){
      [-6,6].forEach(x => {
        addMesh(group, new THREE.CylinderGeometry(1.2,1.6,8,10), baseMat, x, 4, 0);
        addMesh(group, new THREE.SphereGeometry(5.2,18,12), new THREE.MeshStandardMaterial({color:0x103b22, emissive:0x071b10, roughness:.9}), x, 10, 0);
      });
      addMesh(group, new THREE.TorusGeometry(10, .7, 12, 80), glowMat, 0, 2.2, 0, Math.PI/2, 0, 0);
    } else if(p.id === 'krapyak'){
      addMesh(group, new THREE.BoxGeometry(14,13,14), baseMat, 0, 6.5, 0);
      addMesh(group, new THREE.BoxGeometry(9,4,9), accentMat, 0, 15, 0);
      addMesh(group, new THREE.ConeGeometry(8,6,4), glowMat, 0, 20, 0, 0, Math.PI/4, 0);
    } else if(p.id === 'kotagede'){
      addMesh(group, new THREE.BoxGeometry(18,6,16), baseMat, 0, 3, 0);
      for(let i=0;i<7;i++) addMesh(group, new THREE.BoxGeometry(2.3, 3+Math.random()*5, 2.3), accentMat, -12 + i*4, 2, 10 + Math.sin(i)*5);
      addMesh(group, new THREE.SphereGeometry(2.2,24,16), glowMat, 0, 10, 0);
    } else {
      addMesh(group, new THREE.BoxGeometry(14,7,14), baseMat, 0, 3.5, 0);
      addMesh(group, new THREE.CylinderGeometry(2,2,8,18), glowMat, 0, 8, 0);
    }

    const marker = new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 16), glowMat);
    marker.position.set(0, 17 + (index % 3) * 1.4, 0);
    group.add(marker);
    objects.animated.push({mesh:marker, type:'hover', baseY:marker.position.y, amplitude:.8, speed:1.3 + index*.08});

    const light = new THREE.PointLight(0xff0f68, 0.75, 35);
    light.position.set(0, 15, 0);
    group.add(light);

    const label = createTextSprite(`${p.icon} ${p.name}`, {fontSize:42, color:'#fff4b0', background:'rgba(0,0,0,.38)'});
    label.position.set(0, 23, 0);
    label.scale.set(22, 5.5, 1);
    group.add(label);
    objects.labels.push(label);

    objects.scene.add(group);
    objects.landmarkGroups.push(group);
  });
}

function addMesh(group, geo, mat, x, y, z, rx=0, ry=0, rz=0){
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x,y,z);
  mesh.rotation.set(rx,ry,rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createDecorativeCity(){
  const rng = mulberry32(1337);
  const buildingMats = [
    new THREE.MeshStandardMaterial({color:0x11121b, roughness:.86}),
    new THREE.MeshStandardMaterial({color:0x171022, roughness:.82}),
    new THREE.MeshStandardMaterial({color:0x241229, roughness:.84})
  ];
  for(let i=0;i<130;i++){
    const x = -105 + rng()*220;
    const z = -118 + rng()*240;
    if(distanceToAnyRoute(x,z) < 9 || POINTS.some(p => dist2(x,z,p.x,p.z) < 24)) continue;
    const w = 3 + rng()*7;
    const d = 3 + rng()*7;
    const h = 4 + Math.pow(rng(), 2) * 24;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), buildingMats[Math.floor(rng()*buildingMats.length)]);
    mesh.position.set(x,h/2,z);
    mesh.rotation.y = rng()*Math.PI;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    objects.scene.add(mesh);

    if(rng() > .84){
      const windowGlow = new THREE.Mesh(new THREE.PlaneGeometry(w*.45,h*.35), new THREE.MeshBasicMaterial({color:0xffd166, transparent:true, opacity:.18, side:THREE.DoubleSide}));
      windowGlow.position.set(x, h*.62, z + d*.51);
      objects.scene.add(windowGlow);
    }
  }

  const treeMat = new THREE.MeshStandardMaterial({color:0x123017, roughness:.9});
  const trunkMat = new THREE.MeshStandardMaterial({color:0x2a170e, roughness:.95});
  for(let i=0;i<80;i++){
    const x = -105 + rng()*220;
    const z = -118 + rng()*240;
    if(distanceToAnyRoute(x,z) > 20 && rng() > .25) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.35,.55,3.4,8), trunkMat);
    trunk.position.set(x,1.7,z);
    trunk.castShadow = true;
    objects.scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(2.2+rng()*1.4,5+rng()*3,8), treeMat);
    crown.position.set(x,5,z);
    crown.castShadow = true;
    objects.scene.add(crown);
  }
}

function createVehicle(){
  const car = new THREE.Group();
  car.position.copy(vehicle.spawn);
  car.rotation.y = WORLD.spawn.rotation || 0;

  const bodyMat = new THREE.MeshStandardMaterial({color:0x2a0b16, roughness:.45, metalness:.35, emissive:0x16000a, emissiveIntensity:.18});
  const roofMat = new THREE.MeshStandardMaterial({color:0x07070c, roughness:.5, metalness:.25});
  const wheelMat = new THREE.MeshStandardMaterial({color:0x08080a, roughness:.85});
  const glowMat = new THREE.MeshStandardMaterial({color:0xff174f, emissive:0xff174f, emissiveIntensity:.9});

  const body = new THREE.Mesh(new THREE.BoxGeometry(5.4,1.25,8.2), bodyMat);
  body.position.y = 1.1;
  body.castShadow = true;
  body.receiveShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.3,1.7,3.8), roofMat);
  cabin.position.set(0,2.15,-.75);
  cabin.castShadow = true;
  car.add(cabin);

  const hoodGlow = new THREE.Mesh(new THREE.BoxGeometry(3.9,.16,1), glowMat);
  hoodGlow.position.set(0,1.8,-4.25);
  car.add(hoodGlow);

  const wheelGeo = new THREE.CylinderGeometry(.82,.82,.68,24);
  const wheelPositions = [[-2.95,.65,-2.8],[2.95,.65,-2.8],[-2.95,.65,2.8],[2.95,.65,2.8]];
  wheelPositions.forEach(([x,y,z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(x,y,z);
    wheel.rotation.z = Math.PI/2;
    wheel.castShadow = true;
    car.add(wheel);
    objects.animated.push({mesh:wheel, type:'wheel'});
  });

  const leftLight = new THREE.PointLight(0xfff4c0, .9, 20);
  leftLight.position.set(-1.4,1.6,-4.7);
  const rightLight = new THREE.PointLight(0xfff4c0, .9, 20);
  rightLight.position.set(1.4,1.6,-4.7);
  car.add(leftLight, rightLight);

  const head = new THREE.SpotLight(0xfff2bd, 2.1, 60, Math.PI*.22, .45, 1.2);
  head.position.set(0, 2.7, -4.6);
  head.target.position.set(0, .5, -18);
  car.add(head);
  car.add(head.target);
  objects.headlights = head;

  const label = createTextSprite('🚗 3D Horror Drive', {fontSize:36, color:'#ffde72', background:'rgba(0,0,0,.28)'});
  label.position.set(0,5.5,0);
  label.scale.set(20,5,1);
  car.add(label);

  objects.scene.add(car);
  vehicle.group = car;
  objects.car = car;
}

function createSkyObjects(){
  const moon = new THREE.Mesh(new THREE.SphereGeometry(11,32,16), new THREE.MeshBasicMaterial({color:0xc9d7ff}));
  moon.position.set(-78,84,-96);
  objects.scene.add(moon);

  const rng = mulberry32(771);
  const starGeo = new THREE.BufferGeometry();
  const positions = [];
  for(let i=0;i<650;i++){
    positions.push((rng()-.5)*420, 30 + rng()*130, (rng()-.5)*420);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({color:0xffffff, size:.45, transparent:true, opacity:.65}));
  objects.scene.add(stars);
}

function bindUI(){
  hide(UI.hero);
  hide(UI.hud);
  hide(UI.control);
  hide(UI.legend);
  hide(UI.info);
  hide(UI.game);

  refs.enterBtn.addEventListener('click', () => {
    if(state.started) return;
    state.started = true;

    refs.introGate.style.opacity = '0';
    refs.introGate.style.pointerEvents = 'none';

    setTimeout(() => {
      refs.introGate.style.display = 'none';
    }, 500);

    playLoop('ambience');
    setupDockButtons();
    showDock();
    // Tampilan muncul bertahap supaya tidak kosong dan tidak langsung penuh.
    setTimeout(() => show(UI.hero), 300);
    setTimeout(() => show(UI.hud), 500);
    setTimeout(() => show(UI.control), 900);
    setTimeout(() => show(UI.legend), 1300);
    setTimeout(() => show(UI.info), 1700);

    toast('Drive mode aktif. Gunakan WASD/Arrow, dekati ikon, lalu tekan Enter.');
  });

  refs.kliwonBtn?.addEventListener('click', toggleKliwonMode);
  refs.ghostHuntBtn?.addEventListener('click', toggleGhostHunt);
  refs.miniGameBtn?.addEventListener('click', startMiniGame);
  refs.qualityBtn?.addEventListener('click', toggleQuality);
  refs.cameraBtn?.addEventListener('click', toggleCameraMode);
  refs.respawnBtn?.addEventListener('click', respawnVehicle);
  refs.resetBtn?.addEventListener('click', resetWorld);
  refs.muteBtn?.addEventListener('click', toggleMute);
  refs.panicBtn?.addEventListener('click', panic);

  document.querySelectorAll('.test-scare').forEach(btn => {
    btn.addEventListener('click', () => triggerJumpscare(btn.dataset.creature || 'kunti', 'test efek'));
  });

  refs.searchInput?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderLegendList(POINTS.filter(p => `${p.name} ${p.category} ${p.story}`.toLowerCase().includes(q)));
  });

  refs.jumpscareOverlay?.addEventListener('click', hideJumpscare);

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function onKeyDown(e){

  // ENTER bisa dipakai untuk mulai game dari intro,
  // lalu berubah fungsi menjadi interaksi lokasi setelah game berjalan.
  if(e.code === 'Enter'){
    if(!state.started){
      refs.enterBtn?.click();
      return;
    }
    interactNearest();
    return;
  }

  // Selain ENTER, input game dikunci sebelum tombol start ditekan.
  if(!state.started) return;

  switch(e.code){
    case 'KeyW': case 'ArrowUp': input.forward = true; break;
    case 'KeyS': case 'ArrowDown': input.back = true; break;
    case 'KeyA': case 'ArrowLeft': input.left = true; break;
    case 'KeyD': case 'ArrowRight': input.right = true; break;
    case 'ShiftLeft': case 'ShiftRight': input.boost = true; break;
    case 'ControlLeft': case 'ControlRight': input.brake = true; break;
    case 'Space': input.jump = true; e.preventDefault(); break;
    case 'KeyR': respawnVehicle(); break;
    case 'KeyM': toggleMute(); break;
  }
}

function onKeyUp(e){
  switch(e.code){
    case 'KeyW': case 'ArrowUp': input.forward = false; break;
    case 'KeyS': case 'ArrowDown': input.back = false; break;
    case 'KeyA': case 'ArrowLeft': input.left = false; break;
    case 'KeyD': case 'ArrowRight': input.right = false; break;
    case 'ShiftLeft': case 'ShiftRight': input.boost = false; break;
    case 'ControlLeft': case 'ControlRight': input.brake = false; break;
    case 'Space': input.jump = false; break;
  }
}

function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(objects.clock.getDelta(), .05);
  updateVehicle(dt);
  updateCamera(dt);
  updateWorldState(dt);
  animateObjects(objects.clock.elapsedTime, dt);
  updateMinimap();
  objects.renderer.render(objects.scene, objects.camera);
}

function updateVehicle(dt){
  const car = vehicle.group;
  if(!car) return;

  const accel = input.boost ? 46 : 28;
  const reverse = 18;
  const maxSpeed = input.boost ? 42 : 28;
  const friction = input.brake ? 6.5 : 2.7;

  if(input.forward) vehicle.speed += accel * dt;
  if(input.back) vehicle.speed -= reverse * dt;
  if(!input.forward && !input.back) vehicle.speed -= Math.sign(vehicle.speed) * Math.min(Math.abs(vehicle.speed), friction * dt);
  if(input.brake) vehicle.speed *= Math.max(0, 1 - 5.5*dt);
  vehicle.speed = clamp(vehicle.speed, -13, maxSpeed);

  const steeringPower = clamp(Math.abs(vehicle.speed) / 18, .25, 1.0);
  const steeringTarget = (input.left ? 1 : 0) + (input.right ? -1 : 0);
  vehicle.steering = lerp(vehicle.steering, steeringTarget, 8*dt);
  car.rotation.y += vehicle.steering * steeringPower * dt * (vehicle.speed >= 0 ? 1 : -1) * 1.45;

  const forward = new THREE.Vector3(0,0,-1).applyQuaternion(car.quaternion);
  car.position.addScaledVector(forward, vehicle.speed * dt);

  if(input.jump && vehicle.grounded){
    vehicle.verticalSpeed = 13;
    vehicle.grounded = false;
    playOneShot('thunder', .12);
  }
  if(!vehicle.grounded){
    vehicle.verticalSpeed -= 29 * dt;
    car.position.y += vehicle.verticalSpeed * dt;
    if(car.position.y <= WORLD.spawn.y){
      car.position.y = WORLD.spawn.y;
      vehicle.verticalSpeed = 0;
      vehicle.grounded = true;
    }
  }

  const b = WORLD.bounds;
  car.position.x = clamp(car.position.x, b.minX, b.maxX);
  car.position.z = clamp(car.position.z, b.minZ, b.maxZ);

  const roll = -vehicle.steering * clamp(Math.abs(vehicle.speed)/30, 0, .18);
  car.rotation.z = lerp(car.rotation.z, roll, 6*dt);

  state.speedKmh = Math.round(Math.abs(vehicle.speed) * 4.2);
  if(Math.abs(vehicle.speed) > 1 || input.forward || input.back) state.idle = 0;
  else state.idle += dt;
}

function updateCamera(dt){
  const car = vehicle.group;
  if(!car) return;

  const carPos = car.position.clone();
  let desired;
  if(state.cameraMode === 'top'){
    desired = carPos.clone().add(new THREE.Vector3(0, 80, 0));
    objects.camera.position.lerp(desired, 2.7*dt);
    objects.camera.lookAt(carPos.x, 0, carPos.z);
  } else if(state.cameraMode === 'cinematic'){
    const side = new THREE.Vector3(16, 12, 20).applyAxisAngle(new THREE.Vector3(0,1,0), car.rotation.y + Math.sin(objects.clock.elapsedTime*.25)*.4);
    desired = carPos.clone().add(side);
    objects.camera.position.lerp(desired, 2.4*dt);
    objects.camera.lookAt(carPos.x, carPos.y+2.2, carPos.z);
  } else {
    const behind = new THREE.Vector3(0, 12, 24).applyAxisAngle(new THREE.Vector3(0,1,0), car.rotation.y);
    desired = carPos.clone().add(behind);
    objects.camera.position.lerp(desired, 4.3*dt);
    const look = carPos.clone().add(new THREE.Vector3(0,3,0)).add(new THREE.Vector3(0,0,-12).applyQuaternion(car.quaternion));
    objects.camera.lookAt(look);
  }

  objects.labels.forEach(label => label.lookAt(objects.camera.position));
  objects.scene.traverse(obj => {
    if(obj.userData && obj.userData.billboard) obj.lookAt(objects.camera.position);
  });
}

function updateWorldState(dt){
  const car = vehicle.group;
  if(!car) return;
  const x = car.position.x;
  const z = car.position.z;

  let nearest = null;
  let nearestDist = Infinity;
  POINTS.forEach(p => {
    const d = dist2(x,z,p.x,p.z);
    if(d < nearestDist){ nearestDist = d; nearest = p; }
  });
  state.nearest = nearestDist < 16 ? nearest : null;
  if(state.nearest){
    refs.nearHint.textContent = `Tekan ENTER: ${state.nearest.icon} ${state.nearest.name}`;
    refs.nearHint.classList.add('danger-pulse');
  } else {
    refs.nearHint.textContent = nearest ? `Terdekat: ${nearest.name} (${Math.round(nearestDist)}m)` : 'Cari titik urban legend';
    refs.nearHint.classList.remove('danger-pulse');
  }

  let insideRisk = null;
  for(const zone of RISK_ZONES){
    if(dist2(x,z,zone.x,zone.z) < zone.radius){ insideRisk = zone; break; }
  }
  if(insideRisk){
    raiseDanger((insideRisk.level === 'high' ? 2.2 : 1.2) * dt, `Masuk zona rawan: ${insideRisk.name}`, insideRisk.creature, true);
    if(state.danger > 92 && state.miniGame && Date.now() - state.lastScareAt > state.scareCooldownMs) triggerJumpscare(insideRisk.creature, 'terlalu lama di zona rawan');
  }

  for(const safe of FACILITIES){
    if(dist2(x,z,safe.x,safe.z) < safe.radius){
      reduceDanger(8 * dt, '', true);
      state.sanity = Math.min(100, state.sanity + 4 * dt);
    }
  }

  if(state.miniGame){
    checkRelicCollisions(x,z);
    if(state.idle > 8 && state.danger > 72){
      triggerJumpscare('kunti', 'terlalu lama diam saat mini game');
      state.idle = 0;
    }
  }

  updateUI();
}

function animateObjects(t, dt){
  objects.animated.forEach(item => {
    if(item.type === 'hover'){
      item.mesh.position.y = item.baseY + Math.sin(t * item.speed) * item.amplitude;
      item.mesh.rotation.y += dt * .8;
    } else if(item.type === 'ring'){
      item.mesh.rotation.z += dt * item.speed;
      item.mesh.material.opacity = .45 + Math.sin(t*2.2) * .16;
    } else if(item.type === 'wheel'){
      item.mesh.rotation.x += vehicle.speed * dt * 1.2;
    } else if(item.type === 'relic'){
      item.mesh.rotation.y += dt * 1.8;
      item.mesh.position.y = item.baseY + Math.sin(t*2.1 + item.offset) * .55;
    } else if(item.type === 'trap'){
      item.mesh.rotation.y -= dt * 2.3;
      item.mesh.scale.setScalar(1 + Math.sin(t*5 + item.offset) * .12);
    }
  });

  if(objects.ghostLight){
    const car = vehicle.group;
    const forward = new THREE.Vector3(0,0,-1).applyQuaternion(car.quaternion);
    objects.ghostLight.position.copy(car.position).add(new THREE.Vector3(0,7,0));
    objects.ghostLight.target.position.copy(car.position).addScaledVector(forward, 18);
  }
}

function interactNearest(){
  if(!state.nearest){
    if(state.started) toast('Belum cukup dekat dengan lokasi. Drive ke ikon dulu.');
    return;
  }
  interactWithPoint(state.nearest.id);
}

function interactWithPoint(id){
  const point = POINTS.find(p => p.id === id);
  if(!point) return;
  state.lastInteract = Date.now();
  playLocationAudio(point.audio);
  reduceDanger(4, 'Lokasi valid ditemukan.');
  showInfoForPoint(point);
  refs.scenarioTitle.textContent = point.name;
  refs.scenarioText.textContent = `${point.category}. Haunted Index ${point.score}.`;
}

function showInfoForPoint(p){
  show(UI.info);

  refs.infoContent.innerHTML = `
    <h2>${p.icon} ${p.name}</h2>
    <p><b>${p.category}</b> · Haunted Index ${p.score} · Level ${p.level}</p>
    <p><b>Jenis sumber:</b> ${p.sourceType}</p>
    <p>${p.story}</p>
    <div class="quote">“${p.quote}”</div>
    <p><b>Analisis spasial:</b> ${p.spatial}</p>
    <p><b>Safety:</b> ${p.safety}</p>
    <button class="mini-btn" onclick="focusLocation('${p.id}')">🎥 Fokus Kamera</button>
    <button class="mini-btn" onclick="playLocationAudio('${p.audio}')">🔊 Audio Lokasi</button>
  `;
}

function focusLocation(id){
  const p = POINTS.find(item => item.id === id);
  if(!p) return;
  vehicle.group.position.set(p.x + 10, WORLD.spawn.y, p.z + 14);
  vehicle.group.rotation.y = Math.atan2(10, 14);
  vehicle.speed = 0;
  toast(`Mobil dipindahkan dekat ${p.name}. Tekan ENTER untuk interaksi.`);
}

function renderLegendList(list = POINTS){
  refs.legendItems.innerHTML = '';
  [...list].sort((a,b)=>b.score-a.score).forEach(p => {
    const card = document.createElement('div');
    card.className = 'legend-card';
    card.innerHTML = `<div class="icon">${p.icon}</div><div><b>${p.name}</b><small>${p.category} · ${p.level}</small></div><span class="score-pill">${p.score}</span>`;
    card.addEventListener('click', () => {
      focusLocation(p.id);
      showInfoForPoint(p);
    });
    refs.legendItems.appendChild(card);
  });
}

function startMiniGame(){
  if(state.miniGame){
    toast('Mini game sudah aktif. Selesaikan dulu atau tekan Reset World.');
    return;
  }
  state.miniGame = true;
  state.collected = 0;
  state.danger = Math.max(state.danger, 15);
  state.sanity = 100;
  refs.gamePanel.classList.remove('hidden');
  show(UI.game);
  refs.scenarioTitle.textContent = 'Mini Game Relik Aktif';
  refs.scenarioText.textContent = 'Drive ke relik emas. Hindari mata merah. Danger tinggi dapat memicu jumpscare.';
  clearRelicsAndTraps();

  ['malioboro','vredeburg','keraton','tamansari','alkid'].forEach((id, i) => {
    const p = POINTS.find(item => item.id === id);
    if(p) createRelicAt(p, i);
  });
  ['krapyak','kotagede'].forEach((id, i) => {
    const p = POINTS.find(item => item.id === id);
    if(p) createTrapAt(p, i);
  });
  playLoop('heartbeat');
  toast('Mini game aktif. Kumpulkan 5 relik emas dengan menabraknya pakai mobil.');
}

function createRelicAt(point, index){
  const group = new THREE.Group();
  group.position.set(point.x + Math.sin(index*1.7)*5, 3.2, point.z + Math.cos(index*1.4)*5);
  const mat = new THREE.MeshStandardMaterial({color:0xffde72, emissive:0xffb000, emissiveIntensity:1.25, roughness:.36, metalness:.25});
  const relic = new THREE.Mesh(new THREE.TorusKnotGeometry(1.3,.35,80,12), mat);
  relic.castShadow = true;
  group.add(relic);
  const light = new THREE.PointLight(0xffde72, 1.5, 24);
  group.add(light);
  const label = createTextSprite('📿 RELIK', {fontSize:34, color:'#ffde72', background:'rgba(0,0,0,.25)'});
  label.position.set(0,3.4,0);
  label.scale.set(10,3,1);
  group.add(label);
  group.userData = {type:'relic', id:point.id, point};
  objects.scene.add(group);
  objects.relics.push(group);
  objects.animated.push({mesh:group, type:'relic', baseY:3.2, offset:index});
}

function createTrapAt(point, index){
  const group = new THREE.Group();
  group.position.set(point.x + 8 + index*2, 2.7, point.z - 7);
  const mat = new THREE.MeshStandardMaterial({color:0xff174f, emissive:0xff0037, emissiveIntensity:1.4, roughness:.45});
  const eye = new THREE.Mesh(new THREE.SphereGeometry(1.65, 32, 16), mat);
  group.add(eye);
  const slit = new THREE.Mesh(new THREE.BoxGeometry(.4,.1,3), new THREE.MeshBasicMaterial({color:0x000000}));
  slit.position.z = -1.4;
  group.add(slit);
  const light = new THREE.PointLight(0xff174f, 1.6, 24);
  group.add(light);
  group.userData = {type:'trap', point};
  objects.scene.add(group);
  objects.traps.push(group);
  objects.animated.push({mesh:group, type:'trap', offset:index});
}

function checkRelicCollisions(x,z){
  for(let i=objects.relics.length-1;i>=0;i--){
    const r = objects.relics[i];
    if(dist2(x,z,r.position.x,r.position.z) < 5.5){
      state.collected++;
      reduceDanger(12, `Relik ${r.userData.point.name} ditemukan.`);
      playOneShot('whisper', .45);
      objects.scene.remove(r);
      objects.relics.splice(i,1);
      if(state.collected >= 5) winGame();
    }
  }
  for(let i=objects.traps.length-1;i>=0;i--){
    const t = objects.traps[i];
    if(dist2(x,z,t.position.x,t.position.z) < 6){
      const creature = t.userData.point.creature || 'kunti';
      raiseDanger(34, `Trap aktif di ${t.userData.point.name}.`, creature);
      objects.scene.remove(t);
      objects.traps.splice(i,1);
      if(state.danger > 70 || state.collected >= 3) triggerJumpscare(creature, 'menabrak trap mata merah');
      else bloodTextOnce('ADA SESUATU BERGERAK');
    }
  }
}

function winGame(){
  state.miniGame = false;
  clearRelicsAndTraps();
  refs.gameStatus.textContent = 'Semua relik ditemukan. Portal ditutup.';
  refs.scenarioTitle.textContent = 'Mini Game Selesai';
  refs.scenarioText.textContent = 'Relik berhasil diamankan. Gunakan Reset World untuk mengulang.';
  reduceDanger(40, 'Semua relik ditemukan.');
  playLoop('ambience');
  toast('Mini game selesai. Portal gelap ditutup.');
}

function clearRelicsAndTraps(){
  [...objects.relics, ...objects.traps].forEach(obj => objects.scene.remove(obj));
  objects.relics = [];
  objects.traps = [];
  objects.animated = objects.animated.filter(item => item.type !== 'relic' && item.type !== 'trap');
}

function toggleKliwonMode(){
  state.kliwon = !state.kliwon;
  document.body.classList.toggle('kliwon', state.kliwon);
  refs.kliwonBtn.textContent = state.kliwon ? '☀️ Matikan Malam Jumat' : '🌑 Aktifkan Malam Jumat';
  objects.scene.fog.density = state.kliwon ? 0.024 : 0.014;
  if(state.kliwon){
    playLoop('wind');
    playOneShot('thunder', .7);
    flash(.38);
    bloodTextOnce('MALAM JUMAT KLIWON');
    refs.scenarioTitle.textContent = 'Malam Jumat Kliwon Aktif';
    refs.scenarioText.textContent = 'Kabut lebih tebal, ambience berubah, dan danger naik lebih cepat di zona merah.';
  } else {
    playLoop('ambience');
    refs.scenarioTitle.textContent = state.miniGame ? 'Mini Game Relik Aktif' : 'Mode Drive Horor';
    refs.scenarioText.textContent = state.miniGame ? 'Drive ke relik emas. Hindari mata merah.' : 'Kendarai mobil ke ikon urban legend. Tekan ENTER saat dekat lokasi.';
  }
}

function toggleGhostHunt(){
  state.ghostHunt = !state.ghostHunt;
  objects.ghostLight.intensity = state.ghostHunt ? 2.6 : 0;
  objects.headlights.intensity = state.ghostHunt ? 3.8 : 2.1;
  refs.ghostHuntBtn.textContent = state.ghostHunt ? '🔦 Ghost Hunt: ON' : '🔦 Ghost Hunt Mode';
  playOneShot('whisper', .35);
  toast(state.ghostHunt ? 'Ghost Hunt aktif: lampu mobil lebih kuat.' : 'Ghost Hunt mati.');
}

function toggleQuality(){
  if(state.quality === 'high'){
    state.quality = 'low';
    objects.renderer.setPixelRatio(1);
    objects.renderer.shadowMap.enabled = false;
    document.body.classList.add('low-quality');
    refs.qualityBtn.textContent = '⚙️ Quality: Low';
  } else {
    state.quality = 'high';
    objects.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    objects.renderer.shadowMap.enabled = true;
    document.body.classList.remove('low-quality');
    refs.qualityBtn.textContent = '⚙️ Quality: High';
  }
}

function toggleCameraMode(){
  const modes = ['follow','cinematic','top'];
  const next = modes[(modes.indexOf(state.cameraMode)+1) % modes.length];
  state.cameraMode = next;
  refs.cameraBtn.textContent = `🎥 Kamera: ${capitalize(next)}`;
  toast(`Mode kamera: ${next}.`);
}

function respawnVehicle(){
  vehicle.group.position.copy(vehicle.spawn);
  vehicle.group.rotation.set(0, WORLD.spawn.rotation || 0, 0);
  vehicle.speed = 0;
  vehicle.verticalSpeed = 0;
  vehicle.grounded = true;
  reduceDanger(8, 'Respawn aman.');
}

function resetWorld(){
  clearRelicsAndTraps();
  state.miniGame = false;
  state.collected = 0;
  state.danger = 0;
  state.sanity = 100;
  hide(UI.game);
  refs.gamePanel.classList.add('hidden');
  refs.scenarioTitle.textContent = 'Mode Drive Horor';
  refs.scenarioText.textContent = 'Kendarai mobil ke ikon urban legend. Tekan ENTER saat dekat lokasi.';
  respawnVehicle();
  playLoop('ambience');
  toast('World direset.');
}

function panic(){
  hideJumpscare();
  document.body.classList.remove('kliwon','screen-shake');
  objects.scene.fog.density = 0.014;
  objects.ghostLight.intensity = 0;
  objects.headlights.intensity = 2.1;
  stopTrack();
  clearRelicsAndTraps();
  state.miniGame = false;
  state.kliwon = false;
  state.ghostHunt = false;
  state.danger = 0;
  state.sanity = 100;
  state.collected = 0;
  hide(UI.game);
  refs.gamePanel.classList.add('hidden');
  refs.kliwonBtn.textContent = '🌑 Aktifkan Malam Jumat';
  refs.ghostHuntBtn.textContent = '🔦 Ghost Hunt Mode';
  updateUI();
  toast('Semua efek dimatikan. Aman untuk presentasi.');
}

function raiseDanger(amount, reason='', creature='kunti', quiet=false){
  const before = state.danger;
  state.danger = clamp(state.danger + amount, 0, 100);
  state.sanity = clamp(state.sanity - amount*.22, 0, 100);
  if(!quiet && reason && Math.round(before) !== Math.round(state.danger)) toast(`${reason} Danger ${Math.round(state.danger)}%.`);
  if(state.danger >= 100){
    triggerJumpscare(creature, 'Danger Meter penuh');
    state.danger = 42;
  }
}

function reduceDanger(amount, reason='', quiet=false){
  state.danger = clamp(state.danger - amount, 0, 100);
  if(reason && !quiet) toast(`${reason} Danger ${Math.round(state.danger)}%.`);
}

function triggerJumpscare(creature='kunti', reason=''){
  const now = Date.now();
  if(state.scareVisible || (now - state.lastScareAt < state.scareCooldownMs && reason !== 'test efek')){
    bloodTextOnce('JANGAN MENENGOK');
    return;
  }
  const conf = creatures[creature] || creatures.kunti;
  state.lastScareAt = now;
  state.scareVisible = true;
  refs.jumpscareImage.src = conf.img;
  refs.jumpscareCaption.textContent = conf.name;
  refs.jumpscareOverlay.classList.remove('hidden');
  refs.jumpscareOverlay.setAttribute('aria-hidden','false');
  document.body.classList.add('screen-shake');
  flash(.95);
  conf.sequence.forEach((key, i) => setTimeout(() => playOneShot(key), i * 150));
  state.sanity = clamp(state.sanity - 10, 0, 100);
  toast(`JUMPSCARE: ${conf.name}${reason ? ' — ' + reason : ''}`);
  setTimeout(hideJumpscare, 1500);
}

function hideJumpscare(){
  refs.jumpscareOverlay.classList.add('hidden');
  refs.jumpscareOverlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('screen-shake');
  state.scareVisible = false;
}

function playLocationAudio(key){
  const map = {wind:'wind', radio:'radio', heartbeat:'heartbeat', whisper:'whisper', water:'water', gong:'gong', hum:'hum', forest:'forest', bell:'bell'};
  const audioKey = map[key] || key || 'whisper';
  playOneShot(audioKey, audioKey === 'heartbeat' ? .25 : undefined);
  flash(.16);
}

function playLoop(key){
  if(state.muted) return;
  const conf = AUDIO[key] || AUDIO.ambience;
  if(!conf) return;
  stopTrack();
  const audio = new Audio(conf.src);
  audio.loop = true;
  audio.volume = conf.volume ?? .35;
  audio.play().catch(() => {});
  state.activeTrack = audio;
  state.activeTrackKey = key;
}

function stopTrack(){
  if(state.activeTrack){
    state.activeTrack.pause();
    state.activeTrack.currentTime = 0;
  }
  state.activeTrack = null;
  state.activeTrackKey = null;
}

function playOneShot(key, volume){
  if(state.muted) return;
  const conf = AUDIO[key];
  if(!conf) return;
  const audio = new Audio(conf.src);
  audio.volume = clamp(volume ?? conf.volume ?? .4, 0, 1);
  audio.play().catch(() => {});
}

function toggleMute(){
  state.muted = !state.muted;
  if(state.activeTrack) state.activeTrack.volume = state.muted ? 0 : (AUDIO[state.activeTrackKey]?.volume || .35);
  refs.muteBtn.textContent = state.muted ? '🔇 Unmute' : '🔊 Mute / Unmute';
  toast(state.muted ? 'Audio dimute.' : 'Audio aktif lagi.');
}

function updateUI(){
  const spd = String(state.speedKmh);
  refs.mSpeed.textContent = spd;
  refs.hudSpeed.textContent = spd;
  refs.mLegend.textContent = POINTS.length;
  refs.mRelic.textContent = `${state.collected}/5`;
  refs.mSanity.textContent = Math.round(state.sanity);
  refs.dangerText.textContent = `${Math.round(state.danger)}%`;
  refs.dangerFill.style.width = `${state.danger}%`;
  refs.gameProgress.style.width = `${(state.collected/5)*100}%`;
  refs.gameStatus.textContent = `Relik: ${state.collected}/5`;
}

function updateMinimap(){
  const canvas = refs.miniMap;
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = 'rgba(6,6,12,.86)';
  ctx.fillRect(0,0,w,h);
  const b = WORLD.bounds;
  const sx = x => ((x - b.minX) / (b.maxX - b.minX)) * w;
  const sz = z => ((z - b.minZ) / (b.maxZ - b.minZ)) * h;

  ROUTES.forEach(route => {
    const pts = route.ids.map(id => POINTS.find(p => p.id === id)).filter(Boolean);
    ctx.strokeStyle = route.color;
    ctx.globalAlpha = .75;
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p,i) => i ? ctx.lineTo(sx(p.x), sz(p.z)) : ctx.moveTo(sx(p.x), sz(p.z)));
    ctx.stroke();
  });

  RISK_ZONES.forEach(zone => {
    ctx.globalAlpha = .22;
    ctx.fillStyle = '#ff174f';
    ctx.beginPath();
    ctx.arc(sx(zone.x), sz(zone.z), zone.radius/(b.maxX-b.minX)*w, 0, Math.PI*2);
    ctx.fill();
  });

  FACILITIES.forEach(f => {
    ctx.globalAlpha = .65;
    ctx.fillStyle = '#33d17a';
    ctx.beginPath(); ctx.arc(sx(f.x), sz(f.z), 4, 0, Math.PI*2); ctx.fill();
  });

  POINTS.forEach(p => {
    ctx.globalAlpha = .95;
    ctx.fillStyle = '#ffde72';
    ctx.beginPath(); ctx.arc(sx(p.x), sz(p.z), 3, 0, Math.PI*2); ctx.fill();
  });

  if(vehicle.group){
    const car = vehicle.group;
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(sx(car.position.x), sz(car.position.z));
    ctx.rotate(-car.rotation.y);
    ctx.fillStyle = '#70d6ff';
    ctx.beginPath();
    ctx.moveTo(0,-7); ctx.lineTo(5,6); ctx.lineTo(-5,6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function makeDraggable(){
  document.querySelectorAll('.draggable').forEach(panel => {
    const handle = panel.querySelector('.drag-handle');
    if(!handle) return;
    let startX=0,startY=0,startLeft=0,startTop=0,dragging=false;
    handle.addEventListener('pointerdown', e => {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      const rect = panel.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY; startLeft = rect.left; startTop = rect.top;
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
    });
    handle.addEventListener('pointermove', e => {
      if(!dragging) return;
      const left = clamp(startLeft + e.clientX - startX, 8, window.innerWidth - panel.offsetWidth - 8);
      const top = clamp(startTop + e.clientY - startY, 8, window.innerHeight - panel.offsetHeight - 8);
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    });
    handle.addEventListener('pointerup', () => dragging = false);
  });
}

function createTextSprite(text, opts={}){
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = opts.fontSize || 36;
  const pad = 18;
  ctx.font = `900 ${fontSize}px Arial`;
  const metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width + pad*2);
  canvas.height = Math.ceil(fontSize + pad*2);
  ctx.font = `900 ${fontSize}px Arial`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = opts.background || 'rgba(0,0,0,.35)';
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.stroke();
  ctx.fillStyle = opts.color || '#ffffff';
  ctx.shadowColor = '#ff0f68';
  ctx.shadowBlur = 12;
  ctx.fillText(text, pad, canvas.height/2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({map:texture, transparent:true, depthTest:false});
  const sprite = new THREE.Sprite(material);
  sprite.userData.billboard = true;
  return sprite;
}

function roundRect(ctx, x, y, width, height, radius){
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function distanceToAnyRoute(x,z){
  let best = Infinity;
  ROUTES.forEach(route => {
    const pts = route.ids.map(id => POINTS.find(p => p.id === id)).filter(Boolean);
    for(let i=0;i<pts.length-1;i++) best = Math.min(best, pointSegmentDistance(x,z,pts[i].x,pts[i].z,pts[i+1].x,pts[i+1].z));
  });
  return best;
}

function pointSegmentDistance(px,pz,ax,az,bx,bz){
  const dx = bx-ax, dz = bz-az;
  const len2 = dx*dx + dz*dz;
  if(!len2) return dist2(px,pz,ax,az);
  const t = clamp(((px-ax)*dx + (pz-az)*dz)/len2, 0, 1);
  return dist2(px,pz,ax+t*dx,az+t*dz);
}

function mulberry32(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function dist2(ax,az,bx,bz){ return Math.hypot(ax-bx, az-bz); }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function lerp(a,b,t){ return a + (b-a) * clamp(t,0,1); }
function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

function flash(opacity=.7){
  refs.flashLayer.style.opacity = opacity;
  refs.flashLayer.classList.remove('flash');
  void refs.flashLayer.offsetWidth;
  refs.flashLayer.classList.add('flash');
  setTimeout(() => refs.flashLayer.style.opacity = 0, 500);
}

function bloodTextOnce(text){
  refs.bloodText.textContent = text;
  refs.bloodText.style.opacity = 1;
  refs.bloodText.style.transform = 'translateX(-50%) rotate(-2deg) scale(1.05)';
  setTimeout(() => {
    refs.bloodText.style.opacity = 0;
    refs.bloodText.style.transform = 'translateX(-50%) rotate(-2deg) scale(.96)';
  }, 1300);
}

let toastTimer = null;
function toast(message){
  refs.toast.textContent = message;
  refs.toast.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { refs.toast.style.display = ''; }, 4200);
}

function onResize(){
  objects.camera.aspect = window.innerWidth / window.innerHeight;
  objects.camera.updateProjectionMatrix();
  objects.renderer.setSize(window.innerWidth, window.innerHeight);
}
