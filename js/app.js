'use strict';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

const Game = {
  started: false,
  muted: false,
  qualityHigh: true,
  modeIndex: 0,
  kliwon: false,
  ghostHunt: false,
  relicMode: false,
  danger: 0,
  sanity: 100,
  collected: 0,
  speedKmh: 0,
  lastInfoId: null,
  lastScare: 0,
  nearest: null,
  keys: Object.create(null),
  clock: new THREE.Clock(),
  scene: null,
  camera: null,
  renderer: null,
  world: new THREE.Group(),
  car: null,
  carBody: null,
  wheels: [],
  headlights: [],
  relics: new Map(),
  traps: new Map(),
  pointMeshes: new Map(),
  mixers: [],
  audioCtx: null,
  velocity: 0,
  verticalVelocity: 0,
  grounded: true,
  targetCamera: new THREE.Vector3(),
  cameraLook: new THREE.Vector3()
};

boot();

function boot(){
  if(!window.THREE){
    alert('Three.js gagal dimuat. Pastikan internet aktif saat membuka GitHub Pages/local server.');
    return;
  }
  initScene();
  createWorld();
  createCar();
  bindUI();
  renderLegendList(HAUNTED_POINTS);
  respawn();
  animate();
  toast('World siap. Klik Mulai Drive.');
}

function initScene(){
  Game.scene = new THREE.Scene();
  Game.scene.background = new THREE.Color(0x05020a);
  Game.scene.fog = new THREE.FogExp2(0x06020a, 0.018);

  Game.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 650);
  Game.camera.position.set(-24, 18, -82);

  Game.renderer = new THREE.WebGLRenderer({canvas:$('game'), antialias:true, alpha:false, powerPreference:'high-performance'});
  Game.renderer.setSize(window.innerWidth, window.innerHeight);
  Game.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  Game.renderer.shadowMap.enabled = true;
  Game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const amb = new THREE.HemisphereLight(0x3c2e64, 0x08020a, 1.6);
  Game.scene.add(amb);

  const moon = new THREE.DirectionalLight(0xe9deff, 2.1);
  moon.position.set(-48, 80, -34);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024,1024);
  moon.shadow.camera.left = -130; moon.shadow.camera.right = 130; moon.shadow.camera.top = 130; moon.shadow.camera.bottom = -130;
  Game.scene.add(moon);

  const red = new THREE.PointLight(0xff0f68, 45, 115);
  red.position.set(0, 25, 0);
  Game.scene.add(red);

  const cyan = new THREE.PointLight(0x4aa3ff, 18, 85);
  cyan.position.set(-26, 16, 34);
  Game.scene.add(cyan);

  window.addEventListener('resize', onResize);
}

function onResize(){
  Game.camera.aspect = window.innerWidth / window.innerHeight;
  Game.camera.updateProjectionMatrix();
  Game.renderer.setSize(window.innerWidth, window.innerHeight);
}

function createWorld(){
  Game.scene.add(Game.world);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240, 20, 20),
    new THREE.MeshStandardMaterial({color:0x08070d, roughness:.96, metalness:.02})
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  Game.world.add(ground);

  createGrid();
  ROAD_PATHS.forEach(createRoadPath);
  createZones();
  createBuildings();
  createTrees();
  createHauntedPoints();
  createLandmarks();
  createBoundary();
}

function createGrid(){
  const mat = new THREE.LineBasicMaterial({color:0x441139, transparent:true, opacity:.28});
  for(let i=-110; i<=110; i+=10){
    const gx = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-110,.03,i), new THREE.Vector3(110,.03,i)]);
    const gz = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i,.031,-110), new THREE.Vector3(i,.031,110)]);
    Game.world.add(new THREE.Line(gx, mat), new THREE.Line(gz, mat));
  }
}

function createRoadPath(path){
  const roadMat = new THREE.MeshStandardMaterial({color:0x171219, roughness:.82, metalness:.04, emissive:0x160012, emissiveIntensity:.35});
  const laneMat = new THREE.MeshBasicMaterial({color:0xff2da4, transparent:true, opacity:.36});
  for(let i=0; i<path.length-1; i++){
    const a = path[i], b = path[i+1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx,dz);
    const angle = Math.atan2(dx,dz);
    const road = new THREE.Mesh(new THREE.BoxGeometry(WORLD_CONFIG.roadWidth,.08,len), roadMat);
    road.position.set((a.x+b.x)/2,.04,(a.z+b.z)/2);
    road.rotation.y = angle;
    road.receiveShadow = true;
    Game.world.add(road);

    const lane = new THREE.Mesh(new THREE.BoxGeometry(.36,.1,len*.76), laneMat);
    lane.position.copy(road.position);
    lane.position.y = .11;
    lane.rotation.y = angle;
    Game.world.add(lane);
  }
}

function createZones(){
  RISK_ZONES.forEach(z=>{
    const disc = new THREE.Mesh(new THREE.CircleGeometry(z.r,64), new THREE.MeshBasicMaterial({color:0xff174f, transparent:true, opacity:.17, side:THREE.DoubleSide}));
    disc.rotation.x = -Math.PI/2; disc.position.set(z.x,.12,z.z);
    Game.world.add(disc);
    const ring = ringLine(z.r,0xff174f,.78); ring.position.set(z.x,.2,z.z); Game.world.add(ring);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(z.r*.08,z.r*.22,18,28,1,true), new THREE.MeshBasicMaterial({color:0xff174f, transparent:true, opacity:.09, side:THREE.DoubleSide}));
    col.position.set(z.x,9,z.z); Game.world.add(col);
  });
  SAFE_ZONES.forEach(z=>{
    const disc = new THREE.Mesh(new THREE.CircleGeometry(z.r,64), new THREE.MeshBasicMaterial({color:0x29d86f, transparent:true, opacity:.15, side:THREE.DoubleSide}));
    disc.rotation.x = -Math.PI/2; disc.position.set(z.x,.13,z.z);
    Game.world.add(disc);
    const ring = ringLine(z.r,0x29d86f,.78); ring.position.set(z.x,.22,z.z); Game.world.add(ring);
  });
}

function ringLine(r,color,opacity){
  const pts = [];
  for(let i=0;i<=96;i++){
    const t = i / 96 * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t)*r,0,Math.sin(t)*r));
  }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color, transparent:true, opacity}));
}

function createBuildings(){
  const rnd = mulberry32(117230034);
  BUILDING_CLUSTERS.forEach(c=>{
    for(let i=0;i<c.count;i++){
      const x = c.cx + (rnd()-.5)*c.spread;
      const z = c.cz + (rnd()-.5)*c.spread;
      if(onRoad(x,z,5.2)) continue;
      const h = c.base + rnd()*9 + (rnd()>.93 ? 10 : 0);
      const w = 1.8 + rnd()*3.8;
      const d = 1.8 + rnd()*3.8;
      const mat = new THREE.MeshStandardMaterial({color:shiftColor(c.color, rnd()*34), roughness:.78, metalness:.05, emissive:0x140013, emissiveIntensity:.2});
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
      mesh.position.set(x,h/2,z);
      mesh.rotation.y = (rnd()-.5)*.22;
      mesh.castShadow = mesh.receiveShadow = true;
      Game.world.add(mesh);
      if(rnd()>.8) addWindow(mesh, w, d, h);
    }
  });
}

function addWindow(building,w,d,h){
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w*.52, Math.min(h*.46,3.3)), new THREE.MeshBasicMaterial({color:0xffd16b, transparent:true, opacity:.33}));
  panel.position.set(building.position.x, h*.55, building.position.z+d/2+.04);
  panel.rotation.y = building.rotation.y;
  Game.world.add(panel);
}

function createTrees(){
  const rnd = mulberry32(314159);
  for(let i=0;i<90;i++){
    const x = (rnd()-.5)*216;
    const z = (rnd()-.5)*216;
    if(onRoad(x,z,6.4)) continue;
    Game.world.add(makeTree(x,z,2.4+rnd()*2.6));
  }
}

function makeTree(x,z,s=4){
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.28*s,1.7*s,7), new THREE.MeshStandardMaterial({color:0x241508, roughness:.9}));
  trunk.position.y = .85*s;
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.05*s,3.0*s,8), new THREE.MeshStandardMaterial({color:0x06351d, roughness:.86, emissive:0x001b08, emissiveIntensity:.2}));
  leaf.position.y = 2.85*s;
  g.add(trunk,leaf);
  g.position.set(x,0,z);
  return g;
}

function createHauntedPoints(){
  HAUNTED_POINTS.forEach(p=>{
    const g = new THREE.Group();
    g.position.set(p.x,0,p.z);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.35,1.7,12,22,1,true), new THREE.MeshBasicMaterial({color:0xff2da4, transparent:true, opacity:.18, side:THREE.DoubleSide}));
    beacon.position.y = 6;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.25,24,18), new THREE.MeshStandardMaterial({color:0xff2da4, emissive:0xff006e, emissiveIntensity:1.5, roughness:.35}));
    orb.position.y = 2.4;
    const ring = ringLine(5.4,0xff2da4,.58); ring.position.y = .08;
    const label = createLabel(`${p.icon} ${p.name}`, '#ffe66b'); label.position.y = 5.1;
    g.add(beacon,orb,ring,label);
    Game.world.add(g);
    Game.pointMeshes.set(p.id, g);
  });
}

function createLandmarks(){
  HAUNTED_POINTS.forEach(p=>{
    let g = new THREE.Group();
    if(p.id === 'tugu'){
      const mat = new THREE.MeshStandardMaterial({color:0x372036, roughness:.7, emissive:0x1b0014, emissiveIntensity:.25});
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5,3.1,1.1,8), mat);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(.65,1.05,8.2,8), mat); tower.position.y=4.6;
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.2,2.7,8), new THREE.MeshStandardMaterial({color:0xffd25f, emissive:0xff2da4, emissiveIntensity:.5})); top.position.y=10.1;
      g.add(base,tower,top);
    } else if(p.id === 'alkid'){
      g.add(makeTree(-3,0,4), makeTree(3,0,4));
    } else if(p.id === 'keraton'){
      const hall = new THREE.Mesh(new THREE.BoxGeometry(8,3.5,6), new THREE.MeshStandardMaterial({color:0x2c1830, roughness:.75, emissive:0x230018, emissiveIntensity:.25})); hall.position.y=1.75;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5,3.2,4), new THREE.MeshStandardMaterial({color:0x6b3514, emissive:0x291000, emissiveIntensity:.24})); roof.position.y=5.1; roof.rotation.y=Math.PI/4;
      g.add(hall,roof);
    } else if(p.id === 'tamansari'){
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(5,5,.25,40), new THREE.MeshStandardMaterial({color:0x11315a, emissive:0x125d8d, emissiveIntensity:.5, roughness:.25})); pool.position.y=.15;
      const gate = new THREE.Mesh(new THREE.BoxGeometry(6,5,1.1), new THREE.MeshStandardMaterial({color:0x332039, roughness:.72})); gate.position.set(0,2.6,-5);
      g.add(pool,gate);
    } else if(p.id === 'vredeburg'){
      const mat = new THREE.MeshStandardMaterial({color:0x3a2634, roughness:.82});
      [[0,-4,10,3,1],[0,4,10,3,1],[-5,0,1,3,8],[5,0,1,3,8]].forEach(v=>{const m=new THREE.Mesh(new THREE.BoxGeometry(v[2],v[3],v[4]),mat);m.position.set(v[0],1.5,v[1]);m.castShadow=true;g.add(m);});
    } else if(p.id === 'kotagede'){
      for(let i=0;i<7;i++){const tomb=new THREE.Mesh(new THREE.BoxGeometry(.9,1.25,.25),new THREE.MeshStandardMaterial({color:0x403440,roughness:.9}));tomb.position.set((i%4-1.5)*1.6,.65,Math.floor(i/4)*1.8-1);tomb.rotation.y=(i-.5)*.1;g.add(tomb);}
    } else {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.5,4.8,8), new THREE.MeshStandardMaterial({color:0x2d1831, roughness:.75, emissive:0x210016, emissiveIntensity:.28}));
      m.position.y=2.4; g.add(m);
    }
    g.position.set(p.x,0,p.z);
    Game.world.add(g);
  });
}

function createBoundary(){
  const mat = new THREE.MeshBasicMaterial({color:0xff174f, transparent:true, opacity:.18});
  const s = WORLD_CONFIG.bounds;
  [[0,-s,2,3,220],[0,s,2,3,220],[-s,0,220,3,2],[s,0,220,3,2]].forEach(v=>{
    const wall = new THREE.Mesh(new THREE.BoxGeometry(v[2],v[3],v[4]), mat);
    wall.position.set(v[0],1.5,v[1]);
    Game.world.add(wall);
  });
}

function createCar(){
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({color:0xd81269, roughness:.42, metalness:.18, emissive:0x270014, emissiveIntensity:.25});
  const cabinMat = new THREE.MeshStandardMaterial({color:0x221c35, roughness:.25, metalness:.2, emissive:0x080018, emissiveIntensity:.4});
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2,1.05,5.1), bodyMat); body.position.y=1.05; body.castShadow=true; body.receiveShadow=true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.35,1.25,2.15), cabinMat); cabin.position.set(0,1.9,-.45); cabin.castShadow=true;
  car.add(body,cabin);

  const wheelMat = new THREE.MeshStandardMaterial({color:0x0e0e13, roughness:.55, metalness:.12});
  [[-1.85,.58,-1.7],[1.85,.58,-1.7],[-1.85,.58,1.65],[1.85,.58,1.65]].forEach(pos=>{
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.48,20), wheelMat);
    w.rotation.z = Math.PI/2; w.position.set(...pos); w.castShadow=true;
    car.add(w); Game.wheels.push(w);
  });

  const headMat = new THREE.MeshBasicMaterial({color:0xfff2b1, transparent:true, opacity:.75});
  [-.85,.85].forEach(x=>{
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.18,12,8), headMat); lamp.position.set(x,1.18,2.68); car.add(lamp);
  });
  const glow = new THREE.PointLight(0xffeab0, 1.8, 12); glow.position.set(0,1.4,3.2); car.add(glow);
  Game.headlights.push(glow);

  car.position.set(0,0,0);
  Game.car = car;
  Game.carBody = body;
  Game.scene.add(car);
}

function bindUI(){
  $('startBtn').onclick = startGame;
  $('missionBtn').onclick = () => $('missionPanel').classList.add('open');
  $('closeMission').onclick = () => $('missionPanel').classList.remove('open');
  $('closeLocation').onclick = () => $('locationCard').classList.add('hidden');
  $('kliwonBtn').onclick = toggleKliwon;
  $('ghostBtn').onclick = toggleGhost;
  $('miniBtn').onclick = toggleRelicMode;
  $('camBtn').onclick = cycleCamera;
  $('qualityBtn').onclick = toggleQuality;
  $('respawnBtn').onclick = respawn;
  $('muteBtn').onclick = toggleMute;
  $('searchInput').oninput = (e) => {
    const q = e.target.value.toLowerCase();
    renderLegendList(HAUNTED_POINTS.filter(p => `${p.name} ${p.category} ${p.story}`.toLowerCase().includes(q)));
  };
  window.addEventListener('keydown', e => {
    Game.keys[e.key.toLowerCase()] = true;
    if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
    if(e.key.toLowerCase()==='r') respawn();
    if(e.key.toLowerCase()==='m') toggleMute();
    if(e.key === 'Enter') interactNearest();
  });
  window.addEventListener('keyup', e => Game.keys[e.key.toLowerCase()] = false);
}

function startGame(){
  Game.started = true;
  $('startGate').classList.add('hidden');
  initAudio();
  ambienceLoop();
  toast('Drive aktif. Cari checkpoint dan ambil relik.');
}

function renderLegendList(list){
  const box = $('legendList');
  box.innerHTML = '';
  [...list].sort((a,b)=>b.score-a.score).forEach(p=>{
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<div class="ico">${p.icon}</div><div><b>${p.name}</b><small>${p.category} · ${p.level}</small></div><span class="score">${p.score}</span>`;
    item.onclick = () => {
      $('missionPanel').classList.remove('open');
      Game.car.position.set(p.x, .55, p.z-9);
      Game.car.rotation.y = 0;
      Game.velocity = 0;
      showLocation(p);
    };
    box.appendChild(item);
  });
}

function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(Game.clock.getDelta(), .033);
  if(Game.started) updateGame(dt);
  animateWorld(dt);
  updateCamera(dt);
  Game.renderer.render(Game.scene, Game.camera);
}

function updateGame(dt){
  updateCar(dt);
  checkWorld(dt);
  updateHUD();
}

function updateCar(dt){
  const k = Game.keys;
  const forward = k.w || k.arrowup;
  const backward = k.s || k.arrowdown;
  const left = k.a || k.arrowleft;
  const right = k.d || k.arrowright;
  const boost = k.shift;
  const jump = k[' '];

  const max = boost ? 34 : 22;
  const accel = boost ? 34 : 23;
  if(forward) Game.velocity += accel * dt;
  if(backward) Game.velocity -= accel * .72 * dt;
  if(!forward && !backward) Game.velocity *= Math.pow(.93, dt*60);
  Game.velocity = clamp(Game.velocity, -11, max);

  const moveFactor = Math.abs(Game.velocity) / max;
  const steer = (left ? 1 : 0) - (right ? 1 : 0);
  if(Math.abs(Game.velocity) > .15 && steer){
    Game.car.rotation.y += steer * (1.8 * dt) * Math.sign(Game.velocity) * (0.35 + moveFactor);
  }

  if(jump && Game.grounded){
    Game.verticalVelocity = 8.5;
    Game.grounded = false;
    beep(180, .08, 'triangle', .04);
  }
  Game.verticalVelocity -= 23 * dt;
  Game.car.position.y += Game.verticalVelocity * dt;
  if(Game.car.position.y <= .55){Game.car.position.y = .55; Game.verticalVelocity = 0; Game.grounded = true;}

  const dir = new THREE.Vector3(Math.sin(Game.car.rotation.y), 0, Math.cos(Game.car.rotation.y));
  Game.car.position.addScaledVector(dir, Game.velocity * dt);
  const b = WORLD_CONFIG.bounds - 4;
  Game.car.position.x = clamp(Game.car.position.x, -b, b);
  Game.car.position.z = clamp(Game.car.position.z, -b, b);

  Game.wheels.forEach(w => w.rotation.x += Game.velocity * dt * 3.2);
  Game.carBody.rotation.z = lerp(Game.carBody.rotation.z, -steer * moveFactor * .13, .08);
  Game.carBody.rotation.x = lerp(Game.carBody.rotation.x, -Game.velocity/max*.04, .08);
  Game.speedKmh = Math.abs(Math.round(Game.velocity * 4.1));
}

function checkWorld(dt){
  const pos = {x:Game.car.position.x, z:Game.car.position.z};
  let nearest = null, nd = Infinity;
  HAUNTED_POINTS.forEach(p=>{const d=dist2(pos,p); if(d<nd){nd=d; nearest=p;}});
  Game.nearest = nearest;
  $('objectiveChip').textContent = nearest ? `Terdekat: ${nearest.name} (${Math.round(nd)}m)` : 'Cari checkpoint urban legend';
  if(nearest && nd < 7.2 && Game.lastInfoId !== nearest.id){
    Game.lastInfoId = nearest.id;
    showLocation(nearest);
    reduceDanger(3, 'Checkpoint valid.');
  }

  let inRisk = null;
  for(const z of RISK_ZONES){ if(dist2(pos,z) < z.r){ inRisk = z; break; } }
  let inSafe = null;
  for(const z of SAFE_ZONES){ if(dist2(pos,z) < z.r){ inSafe = z; break; } }
  if(inRisk){
    const amount = (Game.relicMode ? 7 : 2.6) * dt;
    raiseDanger(amount, inRisk.creature);
  }
  if(inSafe){
    reduceDanger(9 * dt);
  }
  if(Math.abs(Game.velocity) < .25 && inRisk && Game.relicMode){
    raiseDanger(9 * dt, inRisk.creature);
  }

  if(Game.relicMode){
    Game.relics.forEach((mesh,id)=>{
      if(mesh.visible && dist2(pos,{x:mesh.position.x,z:mesh.position.z}) < 3.1){
        mesh.visible = false;
        Game.collected++;
        reduceDanger(18, 'Relik diambil.');
        beep(660, .12, 'sine', .07);
        toast(`Relik ditemukan: ${Game.collected}/5`);
        if(Game.collected >= 5) winRelicMode();
      }
    });
    Game.traps.forEach((mesh,id)=>{
      if(mesh.visible && dist2(pos,{x:mesh.position.x,z:mesh.position.z}) < 3.4){
        mesh.visible = false;
        const p = HAUNTED_POINTS.find(x=>x.id===id) || HAUNTED_POINTS[0];
        raiseDanger(38, p.creature, true);
        blood('ADA JEBAKAN');
        if(Game.danger > 72) triggerJumpscare(p.creature);
        else toast('Trap kena. Danger naik, tapi jumpscare ditahan.');
      }
    });
  }

  if(Game.danger >= 100){
    triggerJumpscare((inRisk && inRisk.creature) || 'kunti');
    Game.danger = 42;
    Game.sanity = Math.max(0, Game.sanity - 12);
  }
}

function animateWorld(dt){
  const t = performance.now() * .001;
  Game.pointMeshes.forEach((g,id)=>{
    const orb = g.children[1];
    if(orb){ orb.position.y = 2.4 + Math.sin(t*2.1 + g.position.x) * .25; orb.rotation.y += dt; }
  });
  Game.relics.forEach(mesh=>{ mesh.rotation.y += dt*2.2; mesh.position.y = 1.35 + Math.sin(t*3 + mesh.position.x)*.18; });
  Game.traps.forEach(mesh=>{ mesh.rotation.y -= dt*3; mesh.scale.setScalar(1 + Math.sin(t*8)*.08); });
}

function updateCamera(dt){
  if(!Game.car) return;
  const mode = WORLD_CONFIG.cameraModes[Game.modeIndex];
  const car = Game.car;
  let offset;
  if(mode === 'close') offset = new THREE.Vector3(0, 5.2, -9.5);
  else if(mode === 'wide') offset = new THREE.Vector3(0, 12, -19);
  else if(mode === 'top') offset = new THREE.Vector3(0, 42, -1);
  else offset = new THREE.Vector3(0, 7.5, -13.5);
  offset.applyAxisAngle(new THREE.Vector3(0,1,0), car.rotation.y);
  const desired = car.position.clone().add(offset);
  const look = car.position.clone().add(new THREE.Vector3(0,2.1,0));
  Game.camera.position.lerp(desired, mode==='top' ? .045 : .075);
  Game.cameraLook.lerp(look, .1);
  Game.camera.lookAt(Game.cameraLook);
}

function showLocation(p){
  $('locationCard').classList.remove('hidden');
  $('locTitle').textContent = `${p.icon} ${p.name}`;
  $('locMeta').innerHTML = `<b>${p.category}</b> · Haunted Index ${p.score} · Level ${p.level}<br><b>Jenis sumber:</b> ${p.sourceType}`;
  $('locQuote').textContent = `“${p.quote}”`;
  $('locStory').textContent = p.story;
  $('locSpatial').innerHTML = `<b>Analisis spasial:</b> ${p.spatial}<br><b>Safety:</b> ${p.safety}`;
  $('modeValue').textContent = p.name.length > 8 ? p.name.slice(0,8) : p.name;
  toast(`Lokasi ditemukan: ${p.name}`);
}

function interactNearest(){
  if(Game.nearest && dist2({x:Game.car.position.x,z:Game.car.position.z}, Game.nearest) < 13){
    showLocation(Game.nearest);
  } else toast('Dekati beacon urban legend dulu.');
}

function toggleRelicMode(){
  Game.relicMode = !Game.relicMode;
  if(Game.relicMode){
    Game.collected = 0;
    createRelicsAndTraps();
    $('miniBtn').textContent = '🧯 Stop Relik';
    $('objectiveChip').textContent = 'Misi aktif: ambil 5 relik emas, hindari mata merah';
    toast('Mini game relik aktif. Cari orb emas.');
  }else{
    clearRelicsAndTraps();
    $('miniBtn').textContent = '🎮 Relik';
    toast('Mini game relik dimatikan.');
  }
  updateHUD();
}

function createRelicsAndTraps(){
  clearRelicsAndTraps(false);
  RELIC_IDS.forEach(id=>{
    const p = HAUNTED_POINTS.find(x=>x.id===id);
    if(!p) return;
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,1), new THREE.MeshStandardMaterial({color:0xffd95c, emissive:0xffb300, emissiveIntensity:1.2, roughness:.25}));
    mesh.position.set(p.x+3.5,1.35,p.z-3.5);
    Game.world.add(mesh);
    Game.relics.set(id, mesh);
  });
  TRAP_IDS.forEach(id=>{
    const p = HAUNTED_POINTS.find(x=>x.id===id);
    if(!p) return;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.2,24,18), new THREE.MeshStandardMaterial({color:0xff174f, emissive:0xff003d, emissiveIntensity:1.6, roughness:.3}));
    mesh.position.set(p.x-3.2,1.2,p.z+3.2);
    Game.world.add(mesh);
    Game.traps.set(id, mesh);
  });
}

function clearRelicsAndTraps(reset=true){
  Game.relics.forEach(m=>Game.world.remove(m));
  Game.traps.forEach(m=>Game.world.remove(m));
  Game.relics.clear(); Game.traps.clear();
  if(reset) Game.collected = 0;
}

function winRelicMode(){
  Game.relicMode = false;
  $('miniBtn').textContent = '🎮 Relik';
  clearRelicsAndTraps(false);
  reduceDanger(40, 'Semua relik diamankan.');
  blood('PORTAL TERTUTUP');
  toast('Misi selesai: 5 relik ditemukan.');
}

function toggleKliwon(){
  Game.kliwon = !Game.kliwon;
  if(Game.kliwon){
    Game.scene.fog.density = 0.029;
    $('kliwonBtn').textContent = '☀️ Normal';
    blood('MALAM JUMAT KLIWON');
    flash();
    beep(90,.16,'sawtooth',.06);
    toast('Malam Jumat aktif: fog dan ambience lebih gelap.');
  }else{
    Game.scene.fog.density = 0.018;
    $('kliwonBtn').textContent = '🌑 Malam Jumat';
    toast('Malam Jumat dimatikan.');
  }
}

function toggleGhost(){
  Game.ghostHunt = !Game.ghostHunt;
  Game.headlights.forEach(l=>{ l.intensity = Game.ghostHunt ? 6 : 1.8; l.distance = Game.ghostHunt ? 28 : 12; });
  $('ghostBtn').textContent = Game.ghostHunt ? '🔦 Light Off' : '🔦 Ghost Hunt';
  toast(Game.ghostHunt ? 'Ghost Hunt aktif: lampu mobil diperkuat.' : 'Ghost Hunt mati.');
}

function cycleCamera(){
  Game.modeIndex = (Game.modeIndex + 1) % WORLD_CONFIG.cameraModes.length;
  toast('Kamera: ' + WORLD_CONFIG.cameraModes[Game.modeIndex]);
}

function toggleQuality(){
  Game.qualityHigh = !Game.qualityHigh;
  Game.renderer.setPixelRatio(Game.qualityHigh ? Math.min(window.devicePixelRatio || 1,1.8) : 1);
  Game.renderer.shadowMap.enabled = Game.qualityHigh;
  $('qualityBtn').textContent = Game.qualityHigh ? '⚙️ Quality' : '⚙️ Low FPS';
  toast(Game.qualityHigh ? 'Quality high.' : 'Quality ringan untuk laptop lambat.');
}

function respawn(){
  const s = WORLD_CONFIG.carStart;
  Game.car.position.set(s.x,.55,s.z);
  Game.car.rotation.y = s.rot;
  Game.velocity = 0;
  Game.verticalVelocity = 0;
  Game.danger = 0;
  Game.sanity = 100;
  Game.lastInfoId = null;
  updateHUD();
  toast('Respawn ke titik awal.');
}

function raiseDanger(amount, creature='kunti', force=false){
  Game.danger = clamp(Game.danger + amount, 0, 100);
  Game.sanity = clamp(Game.sanity - amount*.08, 0, 100);
  if(force || (Game.danger > 86 && performance.now() - Game.lastScare > 13000)){
    if(Game.danger > 92) triggerJumpscare(creature);
  }
}

function reduceDanger(amount, reason=''){
  Game.danger = clamp(Game.danger - amount, 0, 100);
  Game.sanity = clamp(Game.sanity + amount*.06, 0, 100);
  if(reason) toast(reason);
}

function triggerJumpscare(creature='kunti'){
  const now = performance.now();
  if(now - Game.lastScare < 9000) return;
  Game.lastScare = now;
  const data = {
    kunti:['👻','KUNTILANAK'],
    pocong:['🧟','POCONG'],
    genderuwo:['👹','GENDERUWO']
  }[creature] || ['👻','KUNTILANAK'];
  $('scareIcon').textContent = data[0];
  $('scareName').textContent = data[1];
  $('jumpscare').classList.remove('hidden');
  flash();
  beep(60,.22,'sawtooth',.12); setTimeout(()=>beep(170,.18,'square',.09),90);
  setTimeout(()=>$('jumpscare').classList.add('hidden'), 1250);
}

function updateHUD(){
  $('speedValue').textContent = Game.speedKmh;
  $('relicValue').textContent = `${Game.collected}/5`;
  $('sanityValue').textContent = Math.round(Game.sanity);
  $('dangerValue').textContent = Math.round(Game.danger) + '%';
  $('dangerLabel').textContent = Math.round(Game.danger) + '%';
  $('dangerFill').style.width = Game.danger + '%';
  if(Game.relicMode) $('modeValue').textContent = 'Relik';
  else if(Game.kliwon) $('modeValue').textContent = 'Kliwon';
  else $('modeValue').textContent = 'Drive';
}

function flash(){
  const el = $('flash');
  el.classList.remove('on');
  void el.offsetWidth;
  el.classList.add('on');
}

function blood(text){
  const el = $('bloodText');
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

let toastTimer;
function toast(msg){
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.add('hidden'), 2600);
}

function initAudio(){
  if(Game.audioCtx) return;
  try{ Game.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
}

function beep(freq=220, dur=.08, type='sine', gain=.035){
  if(Game.muted || !Game.audioCtx) return;
  const ctx = Game.audioCtx;
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type; osc.frequency.value = freq;
  vol.gain.setValueAtTime(gain, ctx.currentTime);
  vol.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + dur);
  osc.connect(vol); vol.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + dur);
}

let ambienceTimer;
function ambienceLoop(){
  clearInterval(ambienceTimer);
  ambienceTimer = setInterval(()=>{
    if(!Game.started || Game.muted) return;
    const f = Game.kliwon ? 55 + Math.random()*20 : 85 + Math.random()*30;
    beep(f, .22, 'sine', Game.kliwon ? .018 : .011);
  }, 1900);
}

function toggleMute(){
  initAudio();
  Game.muted = !Game.muted;
  $('muteBtn').textContent = Game.muted ? '🔇' : '🔊';
  toast(Game.muted ? 'Audio mute.' : 'Audio aktif.');
}

function createLabel(text, color='#fff'){
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scale = 2;
  canvas.width = 512*scale; canvas.height = 110*scale;
  ctx.scale(scale, scale);
  ctx.clearRect(0,0,512,110);
  ctx.font = '900 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff2da4'; ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(5,2,10,.62)'; roundRect(ctx,18,26,476,58,22); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.stroke();
  ctx.fillStyle = color; ctx.fillText(text,256,55);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({map:tex, transparent:true, depthWrite:false});
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(14,3,1);
  return sprite;
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

function onRoad(x,z,pad=5){
  for(const path of ROAD_PATHS){
    for(let i=0;i<path.length-1;i++){
      if(distanceToSegment({x,z}, path[i], path[i+1]) < WORLD_CONFIG.roadWidth*.5 + pad) return true;
    }
  }
  return false;
}

function distanceToSegment(p,a,b){
  const vx=b.x-a.x, vz=b.z-a.z, wx=p.x-a.x, wz=p.z-a.z;
  const c1 = vx*wx + vz*wz;
  if(c1 <= 0) return Math.hypot(p.x-a.x,p.z-a.z);
  const c2 = vx*vx + vz*vz;
  if(c2 <= c1) return Math.hypot(p.x-b.x,p.z-b.z);
  const t = c1 / c2;
  const px = a.x + t*vx, pz = a.z + t*vz;
  return Math.hypot(p.x-px,p.z-pz);
}

function shiftColor(hex, amt){
  let r=(hex>>16)&255, g=(hex>>8)&255, b=hex&255;
  r=clamp(Math.round(r+amt),0,255); g=clamp(Math.round(g+amt*.5),0,255); b=clamp(Math.round(b+amt),0,255);
  return (r<<16)|(g<<8)|b;
}

function mulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
