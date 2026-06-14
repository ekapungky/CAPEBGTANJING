'use strict';

if(!window.THREE){
  alert('Three.js gagal dimuat. Pastikan internet aktif atau ganti CDN di index.html.');
}

const $ = id => document.getElementById(id);
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
const lerp = (a,b,t)=>a+(b-a)*t;
const dist2 = (a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const pointToV3 = p => new THREE.Vector3(p.x, p.y || 0, p.z);

const Game = {
  scene:null, renderer:null, camera:null, clock:null,
  car:null, carBody:null, wheels:[], headlights:[],
  world:new THREE.Group(),
  input:{},
  started:false,
  mode:'Drive', cameraMode:0, quality:'High', muted:false, ghostMode:false, kliwon:false,
  speed:0, verticalVelocity:0, onGround:true, heading:WORLD_CONFIG.startRotation,
  maxSpeed:25, accel:22, brake:18, reverse:10, friction:4.2, turn:2.35,
  danger:0, sanity:100, relics:0, relicGame:false, lastScare:0, lastLocation:null, activeLoc:null,
  hauntedMeshes:new Map(), relicMeshes:new Map(), trapMeshes:new Map(), ghosts:[], particles:[],
  synth:null, audioCtx:null, lastSafeDrop:0, lastRiskGain:0, idleTime:0, distanceTravel:0,
  lastPos:new THREE.Vector3(),
};

init();

function init(){
  Game.clock = new THREE.Clock();
  Game.scene = new THREE.Scene();
  Game.scene.background = new THREE.Color(0x05020a);
  Game.scene.fog = new THREE.FogExp2(0x07020d, 0.022);

  const canvas = $('gameCanvas');
  Game.renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
  Game.renderer.setSize(window.innerWidth, window.innerHeight);
  Game.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  Game.renderer.shadowMap.enabled = true;
  Game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  Game.camera = new THREE.PerspectiveCamera(58, window.innerWidth/window.innerHeight, 0.1, 520);
  Game.camera.position.set(-48, 12, -70);

  setupLights();
  createWorld();
  createCar();
  buildLegendList();
  bindUI();
  respawn(false);
  animate();
}

function setupLights(){
  const ambient = new THREE.HemisphereLight(0x17142b, 0x040204, 1.8);
  Game.scene.add(ambient);

  const moon = new THREE.DirectionalLight(0xffd6f1, 1.6);
  moon.position.set(-40, 70, -30);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024,1024);
  moon.shadow.camera.left = -130; moon.shadow.camera.right = 130; moon.shadow.camera.top = 130; moon.shadow.camera.bottom = -130;
  Game.scene.add(moon);

  const red = new THREE.PointLight(0xff105e, 38, 98);
  red.position.set(0, 24, 10);
  Game.scene.add(red);

  const cyan = new THREE.PointLight(0x5ac8ff, 18, 72);
  cyan.position.set(-18, 14, 38);
  Game.scene.add(cyan);
}

function createWorld(){
  const world = Game.world;
  Game.scene.add(world);

  const groundMat = new THREE.MeshStandardMaterial({color:0x08080d, roughness:.95, metalness:.02});
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260,260,32,32), groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  world.add(ground);

  createGridLines();
  ROAD_PATHS.forEach((path,i)=>createRoadPath(path,i));
  createZones();
  createBuildings();
  createLandmarks();
  createHauntedPoints();
  createTrees();
  createNeonTitle();
  createBoundary();
}

function createGridLines(){
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({color:0x40113a, transparent:true, opacity:.3});
  for(let i=-120;i<=120;i+=10){
    const g1 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-120,.025,i),new THREE.Vector3(120,.025,i)]);
    const g2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i,.026,-120),new THREE.Vector3(i,.026,120)]);
    group.add(new THREE.Line(g1,mat), new THREE.Line(g2,mat));
  }
  Game.world.add(group);
}

function createRoadPath(path,index){
  const roadMat = new THREE.MeshStandardMaterial({color:index===0?0x151218:0x211123, roughness:.8, metalness:.05, emissive:index===0?0x1d0012:0x140018, emissiveIntensity:.35});
  const lineMat = new THREE.MeshBasicMaterial({color:0xff2da4, transparent:true, opacity:index===0?.42:.28});
  for(let i=0;i<path.length-1;i++){
    const a = path[i], b = path[i+1];
    const dx=b.x-a.x, dz=b.z-a.z;
    const len=Math.hypot(dx,dz);
    const angle=Math.atan2(dx,dz);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(WORLD_CONFIG.roadWidth,.09,len), roadMat);
    mesh.position.set((a.x+b.x)/2,.045,(a.z+b.z)/2);
    mesh.rotation.y=angle;
    mesh.receiveShadow=true;
    Game.world.add(mesh);

    const lane = new THREE.Mesh(new THREE.BoxGeometry(.38,.11,len*.78), lineMat);
    lane.position.copy(mesh.position); lane.position.y=.12; lane.rotation.y=angle;
    Game.world.add(lane);
  }
}

function createZones(){
  const riskMat = new THREE.MeshBasicMaterial({color:0xff174f, transparent:true, opacity:.18, side:THREE.DoubleSide});
  const safeMat = new THREE.MeshBasicMaterial({color:0x33dd7a, transparent:true, opacity:.15, side:THREE.DoubleSide});
  RISK_ZONES.forEach(z=>{
    const circle = new THREE.Mesh(new THREE.CircleGeometry(z.r, 48), riskMat.clone());
    circle.rotation.x=-Math.PI/2; circle.position.set(z.x,.13,z.z); circle.userData={type:'risk',...z};
    Game.world.add(circle);
    const ring = makeRing(z.r,0xff174f,.75); ring.position.set(z.x,.18,z.z); Game.world.add(ring);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(z.r*.08,z.r*.28,18,24,1,true), new THREE.MeshBasicMaterial({color:0xff174f, transparent:true, opacity:.12, side:THREE.DoubleSide}));
    col.position.set(z.x,9,z.z); Game.world.add(col);
  });
  SAFE_ZONES.forEach(z=>{
    const circle = new THREE.Mesh(new THREE.CircleGeometry(z.r, 48), safeMat.clone());
    circle.rotation.x=-Math.PI/2; circle.position.set(z.x,.14,z.z); circle.userData={type:'safe',...z};
    Game.world.add(circle);
    const ring = makeRing(z.r,0x35e277,.72); ring.position.set(z.x,.2,z.z); Game.world.add(ring);
  });
}

function makeRing(radius,color,opacity){
  const pts=[];
  for(let i=0;i<=96;i++){
    const t=i/96*Math.PI*2;
    pts.push(new THREE.Vector3(Math.cos(t)*radius,0,Math.sin(t)*radius));
  }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color,transparent:true,opacity}));
  return line;
}

function createBuildings(){
  const seed = mulberry32(117230034);
  BUILDING_CLUSTERS.forEach(cluster=>{
    for(let i=0;i<cluster.count;i++){
      const x=cluster.cx+(seed()-.5)*cluster.spread;
      const z=cluster.cz+(seed()-.5)*cluster.spread;
      if(isOnRoad(x,z,5.2)) continue;
      const h=cluster.base+seed()*8 + (seed()>.92?8:0);
      const w=1.8+seed()*3.8;
      const d=1.8+seed()*3.8;
      const mat = new THREE.MeshStandardMaterial({color:shiftColor(cluster.color, seed()*30), roughness:.78, metalness:.05, emissive:0x160016, emissiveIntensity:.18});
      const b = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
      b.position.set(x,h/2,z);
      b.rotation.y=(seed()-.5)*.16;
      b.castShadow=true; b.receiveShadow=true;
      Game.world.add(b);
      if(seed()>.78) addWindowGlow(x,z,h,w,d,b.rotation.y);
    }
  });
}

function addWindowGlow(x,z,h,w,d,rot){
  const mat = new THREE.MeshBasicMaterial({color:0xffcc61, transparent:true, opacity:.36});
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w*.55, Math.min(h*.45,3)), mat);
  panel.position.set(x, h*.55, z + d/2 + .02);
  panel.rotation.y=rot;
  Game.world.add(panel);
}

function createLandmarks(){
  HAUNTED_POINTS.forEach(p=>{
    let landmark;
    const mat = new THREE.MeshStandardMaterial({color:0x2a1129, roughness:.65, metalness:.06, emissive:0x290018, emissiveIntensity:.35});
    if(p.id==='tugu'){
      landmark = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6,3.2,1.2,6), mat);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(.75,1.2,9,8), mat);
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.4,3,8), new THREE.MeshStandardMaterial({color:0xffd25f, emissive:0xff2da4, emissiveIntensity:.5}));
      tower.position.y=5.1; top.position.y=11.1; landmark.add(base,tower,top);
    } else if(p.id==='alkid'){
      landmark = new THREE.Group();
      landmark.add(makeTree(-3,0,0,6), makeTree(3,0,0,6));
    } else if(p.id==='vredeburg'){
      landmark = new THREE.Group();
      const wallMat = new THREE.MeshStandardMaterial({color:0x3a2634, roughness:.8});
      [[0,0,10,3,1],[-5,0,1,3,8],[5,0,1,3,8],[0,0,10,3,1]].forEach((v,i)=>{
        const m = new THREE.Mesh(new THREE.BoxGeometry(v[2],v[3],v[4]),wallMat); m.position.set(v[0],1.5,v[1]+(i===3?4:-4)); m.castShadow=true; landmark.add(m);
      });
    } else if(p.id==='keraton'){
      landmark = new THREE.Group();
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5,3.4,4), new THREE.MeshStandardMaterial({color:0x5d3210, emissive:0x2a1000, emissiveIntensity:.25}));
      roof.rotation.y=Math.PI/4; roof.position.y=5.4;
      const hall = new THREE.Mesh(new THREE.BoxGeometry(8,3.5,6), mat); hall.position.y=2;
      landmark.add(hall,roof);
    } else if(p.id==='tamansari'){
      landmark = new THREE.Group();
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(5,5,.25,40), new THREE.MeshStandardMaterial({color:0x102a48, emissive:0x155a88, emissiveIntensity:.45, roughness:.25}));
      pool.position.y=.2;
      const gate = new THREE.Mesh(new THREE.BoxGeometry(6,5,1.2), mat); gate.position.y=2.6; gate.position.z=-5;
      landmark.add(pool,gate);
    } else if(p.id==='kotagede'){
      landmark = new THREE.Group();
      for(let i=0;i<6;i++){
        const tomb = new THREE.Mesh(new THREE.BoxGeometry(.9,1.3,.25), new THREE.MeshStandardMaterial({color:0x383038, roughness:.9}));
        tomb.position.set((i%3-1)*2, .65, Math.floor(i/3)*2-1); tomb.rotation.y=(i-.5)*.1; landmark.add(tomb);
      }
    } else {
      landmark = new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.6,5,8), mat);
      landmark.position.y=2.5;
    }
    landmark.position.set(p.pos.x, 0, p.pos.z);
    landmark.userData={type:'haunted', id:p.id};
    Game.world.add(landmark);
  });
}

function createHauntedPoints(){
  HAUNTED_POINTS.forEach(p=>{
    const group = new THREE.Group();
    group.position.set(p.pos.x, .3, p.pos.z);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.35,1.8,12,20,1,true), new THREE.MeshBasicMaterial({color:0xff2da4, transparent:true, opacity:.18, side:THREE.DoubleSide}));
    beacon.position.y=6;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.35,24,18), new THREE.MeshStandardMaterial({color:0xff2da4, emissive:0xff006e, emissiveIntensity:1.4, roughness:.3}));
    orb.position.y=2.4;
    const ring = makeRing(5.2,0xff2da4,.55); ring.rotation.x=0; ring.position.y=.08;
    group.add(beacon,orb,ring);
    group.userData = {type:'haunted', id:p.id};
    Game.world.add(group);
    Game.hauntedMeshes.set(p.id, group);
  });
}

function createTrees(){
  const seed = mulberry32(314159);
  for(let i=0;i<85;i++){
    const x=(seed()-.5)*220, z=(seed()-.5)*220;
    if(isOnRoad(x,z,6)) continue;
    if(seed()<.25 && z<20) continue;
    Game.world.add(makeTree(x,0,z,2.6+seed()*2.6));
  }
}

function makeTree(x=0,y=0,z=0,s=4){
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.25*s,.36*s,1.8*s,7), new THREE.MeshStandardMaterial({color:0x22130a, roughness:.9}));
  trunk.position.y=.9*s;
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.15*s,3.1*s,8), new THREE.MeshStandardMaterial({color:0x06351e, roughness:.85, emissive:0x001b08, emissiveIntensity:.2}));
  leaf.position.y=3*s;
  g.add(trunk,leaf); g.position.set(x,y,z); return g;
}

function createNeonTitle(){
  const group = new THREE.Group();
  group.position.set(-5,.1,-4);
  const mat = new THREE.MeshBasicMaterial({color:0xff2da4, transparent:true, opacity:.55});
  const geo = new THREE.BoxGeometry(30,.18,2.4);
  const plate = new THREE.Mesh(geo, mat); plate.position.y=.05;
  group.add(plate);
  Game.world.add(group);
}

function createBoundary(){
  const mat = new THREE.MeshBasicMaterial({color:0xff174f, transparent:true, opacity:.22});
  const s = WORLD_CONFIG.bounds;
  [[0,-s,2,3,260],[0,s,2,3,260],[-s,0,260,3,2],[s,0,260,3,2]].forEach(v=>{
    const m = new THREE.Mesh(new THREE.BoxGeometry(v[2],v[3],v[4]), mat);
    m.position.set(v[0],1.5,v[1]); Game.world.add(m);
  });
}

function createCar(){
  const car = new THREE.Group();
  Game.car = car;
  const bodyMat = new THREE.MeshStandardMaterial({color:0xff195f, roughness:.42, metalness:.25, emissive:0x320016, emissiveIntensity:.38});
  const darkMat = new THREE.MeshStandardMaterial({color:0x100914, roughness:.45, metalness:.18});
  const glassMat = new THREE.MeshStandardMaterial({color:0x5ac8ff, roughness:.15, metalness:.05, emissive:0x12365a, emissiveIntensity:.7});

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.8,1.0,4.4), bodyMat); body.position.y=1.0; body.castShadow=true; car.add(body); Game.carBody=body;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.05,.9,2.0), glassMat); cabin.position.set(0,1.72,-.35); cabin.castShadow=true; car.add(cabin);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.35,.45,1.5), bodyMat); nose.position.set(0,1.08,2.38); nose.castShadow=true; car.add(nose);

  const wheelGeo = new THREE.CylinderGeometry(.48,.48,.42,18);
  const wheelPositions = [[-1.55,.55,1.45],[1.55,.55,1.45],[-1.55,.55,-1.45],[1.55,.55,-1.45]];
  wheelPositions.forEach(pos=>{
    const w = new THREE.Mesh(wheelGeo, darkMat); w.rotation.z=Math.PI/2; w.position.set(...pos); w.castShadow=true; car.add(w); Game.wheels.push(w);
  });

  const lampMat = new THREE.MeshBasicMaterial({color:0xfff0a0});
  [[-.75,1.05,2.68],[.75,1.05,2.68]].forEach(p=>{
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.18,12,8), lampMat); lamp.position.set(...p); car.add(lamp);
    const light = new THREE.SpotLight(0xffd6a6, 8, 34, .42, .6, 1.2); light.position.set(p[0],p[1],p[2]+.2); light.target.position.set(p[0],.35,p[2]+12); car.add(light); car.add(light.target); Game.headlights.push(light);
  });
  Game.scene.add(car);
}

function bindUI(){
  $('startBtn').addEventListener('click',()=>{
    $('startGate').classList.add('hidden');
    Game.started=true;
    initAudio();
    playAmbience();
    toast('World 3D aktif. Gas pakai WASD / Arrow. Datangi beacon merah muda.');
  });
  $('menuBtn').addEventListener('click',()=> $('missionPanel').classList.toggle('open'));
  $('closePanelBtn').addEventListener('click',()=> $('missionPanel').classList.remove('open'));
  $('locationClose').addEventListener('click',()=> $('locationCard').classList.add('hidden'));
  $('kliwonBtn').addEventListener('click',toggleKliwon);
  $('ghostBtn').addEventListener('click',toggleGhost);
  $('relicBtn').addEventListener('click',startRelicGame);
  $('cameraBtn').addEventListener('click',()=>{Game.cameraMode=(Game.cameraMode+1)%3; toast(['Kamera follow belakang','Kamera cinematic jauh','Kamera top-down'][Game.cameraMode]);});
  $('qualityBtn').addEventListener('click',toggleQuality);
  $('respawnBtn').addEventListener('click',()=>respawn(true));
  $('muteBtn').addEventListener('click',toggleMute);
  $('searchInput').addEventListener('input', e=>buildLegendList(e.target.value));

  window.addEventListener('keydown',e=>{
    Game.input[e.key.toLowerCase()]=true;
    if(e.key==='Enter') interact();
    if(e.key.toLowerCase()==='r') respawn(true);
    if(e.key.toLowerCase()==='m') toggleMute();
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  }, {passive:false});
  window.addEventListener('keyup',e=>Game.input[e.key.toLowerCase()]=false);
  window.addEventListener('resize',onResize);
  document.addEventListener('mousemove',e=>{
    document.documentElement.style.setProperty('--x',e.clientX+'px');
    document.documentElement.style.setProperty('--y',e.clientY+'px');
  });
}

function buildLegendList(filter=''){
  const q=filter.toLowerCase();
  const box=$('legendList'); box.innerHTML='';
  HAUNTED_POINTS.filter(p=>(p.name+p.category+p.story).toLowerCase().includes(q)).sort((a,b)=>b.score-a.score).forEach(p=>{
    const item=document.createElement('button'); item.className='legend-item'; item.type='button';
    item.innerHTML=`<span class="ico">${p.icon}</span><span><b>${p.name}</b><small>${p.category} · ${p.level}</small></span><span class="score">${p.score}</span>`;
    item.onclick=()=>{flyToPoint(p); showLocation(p); $('missionPanel').classList.remove('open');};
    box.appendChild(item);
  });
}

function flyToPoint(p){
  const car=Game.car;
  car.position.set(p.pos.x-5,1.15,p.pos.z-8);
  Game.heading=Math.atan2(5,8);
  car.rotation.y=Game.heading;
  Game.speed=0;
  toast('Teleport demo ke '+p.name+'.');
}

function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(Game.clock.getDelta(), .035);
  updateCar(dt);
  updateWorld(dt);
  updateCamera(dt);
  updateHUD();
  Game.renderer.render(Game.scene, Game.camera);
}

function updateCar(dt){
  const car=Game.car;
  if(!car) return;
  const fwd = Game.input['w'] || Game.input['arrowup'];
  const back = Game.input['s'] || Game.input['arrowdown'];
  const left = Game.input['a'] || Game.input['arrowleft'];
  const right = Game.input['d'] || Game.input['arrowright'];
  const boost = Game.input['shift'];
  const jump = Game.input[' '];

  const max = Game.maxSpeed * (boost?1.55:1);
  if(fwd) Game.speed += Game.accel*dt;
  if(back) Game.speed -= (Game.speed>0?Game.brake:Game.reverse)*dt;
  if(!fwd && !back){
    const sign=Math.sign(Game.speed);
    Game.speed -= sign*Game.friction*dt;
    if(Math.sign(Game.speed)!==sign) Game.speed=0;
  }
  Game.speed = clamp(Game.speed, -Game.maxSpeed*.45, max);

  const turnFactor = clamp(Math.abs(Game.speed)/Game.maxSpeed, .2, 1.25);
  if(left) Game.heading += Game.turn*turnFactor*dt*(Game.speed>=0?1:-1);
  if(right) Game.heading -= Game.turn*turnFactor*dt*(Game.speed>=0?1:-1);

  if(jump && Game.onGround && Math.abs(Game.speed)>4){
    Game.verticalVelocity = 8.5;
    Game.onGround=false;
    pulseBlood('LOMPAT');
  }
  if(!Game.onGround){
    car.position.y += Game.verticalVelocity*dt;
    Game.verticalVelocity -= 22*dt;
    if(car.position.y<=1.15){ car.position.y=1.15; Game.verticalVelocity=0; Game.onGround=true; }
  }

  car.rotation.y = Game.heading;
  car.rotation.z = lerp(car.rotation.z, clamp(-Game.speed/Game.maxSpeed*.08, -.12, .12), .08);
  car.rotation.x = lerp(car.rotation.x, (fwd?-.025:back?.025:0), .08);

  const move = new THREE.Vector3(Math.sin(Game.heading),0,Math.cos(Game.heading)).multiplyScalar(Game.speed*dt);
  car.position.add(move);
  const b = WORLD_CONFIG.bounds-4;
  if(Math.abs(car.position.x)>b || Math.abs(car.position.z)>b){
    car.position.x = clamp(car.position.x,-b,b); car.position.z = clamp(car.position.z,-b,b);
    Game.speed *= -.35;
    raiseDanger(4,'Mobil menyentuh batas world.');
  }
  Game.wheels.forEach(w=>w.rotation.x += Game.speed*dt*2.7);
  const moved = car.position.distanceTo(Game.lastPos);
  Game.distanceTravel += moved;
  if(moved<.02 && Game.started) Game.idleTime += dt; else Game.idleTime=0;
  Game.lastPos.copy(car.position);
}

function updateWorld(dt){
  const car=Game.car;
  if(!car) return;
  const carPos={x:car.position.x,z:car.position.z};

  let nearest=null, nd=999;
  HAUNTED_POINTS.forEach(p=>{
    const d=Math.hypot(carPos.x-p.pos.x, carPos.z-p.pos.z);
    const mesh=Game.hauntedMeshes.get(p.id);
    if(mesh){
      mesh.rotation.y += dt*.8;
      const orb = mesh.children.find(c=>c.geometry && c.geometry.type==='SphereGeometry');
      if(orb) orb.position.y = 2.4 + Math.sin(performance.now()/420 + p.score)*.25;
    }
    if(d<nd){nearest=p; nd=d;}
    if(d<7.2){
      if(Game.activeLoc!==p.id){
        Game.activeLoc=p.id;
        showLocation(p);
        raiseDanger(p.level==='Tinggi'?9:5,'Masuk radius '+p.name+'.', p.creature);
      }
    }
  });
  $('nearestChip').textContent = nearest ? `Terdekat: ${nearest.name} (${Math.round(nd)}m)` : 'Terdekat: -';

  const inRisk = RISK_ZONES.find(z=>Math.hypot(carPos.x-z.x,carPos.z-z.z)<z.r);
  if(inRisk && performance.now()-Game.lastRiskGain>1200){
    Game.lastRiskGain=performance.now();
    raiseDanger(Game.relicGame?4:2,'Zona rawan: '+inRisk.name, inRisk.creature, true);
    if(Game.danger>88 && Math.random()<.18) triggerJumpscare(inRisk.creature,'zona rawan terlalu lama');
  }

  const inSafe = SAFE_ZONES.find(z=>Math.hypot(carPos.x-z.x,carPos.z-z.z)<z.r);
  if(inSafe && performance.now()-Game.lastSafeDrop>1100){
    Game.lastSafeDrop=performance.now();
    reduceDanger(3);
  }

  if(Game.idleTime>7 && Game.danger>64){
    Game.idleTime=0;
    triggerJumpscare(nearest?.creature || 'kunti','idle terlalu lama di area rawan');
  }

  Game.relicMeshes.forEach((mesh,id)=>{
    mesh.rotation.y += dt*2.2;
    mesh.position.y = 1.1 + Math.sin(performance.now()/260 + id.length)*.18;
    if(car.position.distanceTo(mesh.position)<3.2){
      collectRelic(id);
    }
  });
  Game.trapMeshes.forEach((mesh,id)=>{
    mesh.rotation.y -= dt*3;
    const d=car.position.distanceTo(mesh.position);
    if(d<3.4){
      const p=HAUNTED_POINTS.find(x=>x.id===id) || HAUNTED_POINTS[0];
      Game.world.remove(mesh); Game.trapMeshes.delete(id);
      raiseDanger(24,'Trap mata merah aktif.', p.creature);
      if(Game.danger>68 || Game.relics>=3) triggerJumpscare(p.creature,'menabrak trap');
      else pulseBlood('ADA SESUATU');
    }
  });

  Game.ghosts = Game.ghosts.filter(g=>{
    g.life -= dt;
    g.mesh.position.y += dt*2.4;
    g.mesh.rotation.y += dt*2.2;
    g.mesh.scale.multiplyScalar(1+dt*.15);
    if(g.life<=0){Game.scene.remove(g.mesh); return false;} return true;
  });
}

function updateCamera(dt){
  const car=Game.car;
  if(!car) return;
  let offset;
  if(Game.cameraMode===0) offset = new THREE.Vector3(0,6.2,-12.5);
  else if(Game.cameraMode===1) offset = new THREE.Vector3(8,10,-18);
  else offset = new THREE.Vector3(0,42,-.1);
  if(Game.cameraMode!==2) offset.applyAxisAngle(new THREE.Vector3(0,1,0), Game.heading);
  const targetPos = car.position.clone().add(offset);
  Game.camera.position.lerp(targetPos, Game.cameraMode===2?.06:.1);
  const look = car.position.clone().add(new THREE.Vector3(0,1.2,0));
  Game.camera.lookAt(look);
}

function updateHUD(){
  const kmh = Math.round(Math.abs(Game.speed)*5.2);
  $('speedValue').textContent=kmh;
  $('mRelic').textContent=Game.relics+'/5';
  $('mSanity').textContent=Math.round(Game.sanity);
  $('mDanger').textContent=Math.round(Game.danger)+'%';
  $('dangerFill').style.width=Game.danger+'%';
  $('mMode').textContent=Game.mode;
}

function showLocation(p){
  Game.lastLocation=p;
  $('locationCard').classList.remove('hidden');
  $('locTitle').textContent=`${p.icon} ${p.name}`;
  $('locMeta').textContent=`${p.category} · Haunted Index ${p.score} · Level ${p.level} · Jenis sumber: ${p.sourceType}`;
  $('locQuote').textContent='“'+p.quote+'”';
  $('locStory').innerHTML='<b>Storytelling:</b> '+p.story;
  $('locSpatial').innerHTML='<b>Analisis spasial:</b> '+p.spatial;
}

function interact(){
  if(Game.lastLocation){
    showLocation(Game.lastLocation);
    reduceDanger(4);
    toast('Info lokasi dibuka: '+Game.lastLocation.name+'.');
  } else toast('Dekati beacon urban legend dulu.');
}

function startRelicGame(){
  if(Game.relicGame){toast('Mini game relik sudah aktif.'); return;}
  Game.relicGame=true; Game.relics=0; Game.mode='Relic'; Game.danger=Math.max(Game.danger,14);
  Game.relicMeshes.forEach(m=>Game.world.remove(m)); Game.relicMeshes.clear();
  Game.trapMeshes.forEach(m=>Game.world.remove(m)); Game.trapMeshes.clear();
  RELIC_POINTS.forEach(id=>{
    const p=HAUNTED_POINTS.find(x=>x.id===id); if(!p) return;
    const mesh=makeRelicMesh(); mesh.position.set(p.pos.x+2,1.1,p.pos.z-2); mesh.userData={id};
    Game.world.add(mesh); Game.relicMeshes.set(id,mesh);
  });
  TRAP_POINTS.forEach(id=>{
    const p=HAUNTED_POINTS.find(x=>x.id===id); if(!p) return;
    const mesh=makeTrapMesh(); mesh.position.set(p.pos.x-2,1.1,p.pos.z+2); mesh.userData={id};
    Game.world.add(mesh); Game.trapMeshes.set(id,mesh);
  });
  pulseBlood('CARI 5 RELIK');
  toast('Mini game aktif: tabrak 5 relik emas, hindari mata merah.');
}

function makeRelicMesh(){
  const g=new THREE.Group();
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(1.25), new THREE.MeshStandardMaterial({color:0xffde72, emissive:0xffb000, emissiveIntensity:1.3, roughness:.25, metalness:.35}));
  const ring=makeRing(2,0xffde72,.8); ring.position.y=-.95;
  g.add(gem,ring); return g;
}
function makeTrapMesh(){
  const g=new THREE.Group();
  const eye=new THREE.Mesh(new THREE.SphereGeometry(1.2,24,16), new THREE.MeshStandardMaterial({color:0xff174f, emissive:0xff003c, emissiveIntensity:1.8}));
  const pupil=new THREE.Mesh(new THREE.SphereGeometry(.38,16,12), new THREE.MeshBasicMaterial({color:0x000000})); pupil.position.z=1.0;
  g.add(eye,pupil); return g;
}

function collectRelic(id){
  const mesh=Game.relicMeshes.get(id); if(!mesh) return;
  Game.world.remove(mesh); Game.relicMeshes.delete(id); Game.relics++;
  reduceDanger(12); pulseBlood('RELIK '+Game.relics+'/5');
  if(Game.relics>=5){
    Game.relicGame=false; Game.mode='Drive';
    Game.trapMeshes.forEach(m=>Game.world.remove(m)); Game.trapMeshes.clear();
    toast('Semua relik ditemukan. Portal tertutup.');
    pulseBlood('PORTAL TERTUTUP');
  } else toast('Relik ditemukan: '+Game.relics+'/5.');
}

function raiseDanger(n,msg='',creature='kunti',silent=false){
  Game.danger=clamp(Game.danger+n,0,100); Game.sanity=clamp(Game.sanity-n*.28,0,100);
  if(Game.danger>=100){ Game.danger=42; triggerJumpscare(creature,'danger meter penuh'); }
  if(msg && !silent) toast(msg+' Danger '+Math.round(Game.danger)+'%.');
}
function reduceDanger(n){ Game.danger=clamp(Game.danger-n,0,100); Game.sanity=clamp(Game.sanity+n*.16,0,100); }

function triggerJumpscare(creature='kunti',reason=''){
  const now=performance.now();
  if(now-Game.lastScare<6500) return;
  Game.lastScare=now;
  const map={kunti:['KUNTILANAK','👻'],pocong:['POCONG','🧟'],genderuwo:['GENDERUWO','👹']};
  const [name,face]=map[creature]||map.kunti;
  spawnGhost(creature);
  $('scareName').textContent=name; $('scareFace').textContent=face;
  $('jumpscare').classList.remove('hidden');
  document.body.classList.add('shake');
  doFlash(); beepScare();
  setTimeout(()=>{$('jumpscare').classList.add('hidden'); document.body.classList.remove('shake');},950);
  toast('Jumpscare kritis: '+name+(reason?' — '+reason:''));
}

function spawnGhost(creature){
  const group=new THREE.Group();
  const color=creature==='genderuwo'?0x5c2211:creature==='pocong'?0xeeffe8:0xffe6ff;
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(1.1,3.2,8,18), new THREE.MeshStandardMaterial({color,emissive:creature==='pocong'?0xaaffaa:0xff2da4,emissiveIntensity:1.1,transparent:true,opacity:.78}));
  const head=new THREE.Mesh(new THREE.SphereGeometry(1.1,24,16), new THREE.MeshStandardMaterial({color,emissive:0xff174f,emissiveIntensity:.9,transparent:true,opacity:.88}));
  head.position.y=2.7;
  const eyeMat=new THREE.MeshBasicMaterial({color:0xff0037});
  const e1=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),eyeMat); e1.position.set(-.35,2.9,.9);
  const e2=e1.clone(); e2.position.x=.35;
  group.add(body,head,e1,e2);
  const forward=new THREE.Vector3(Math.sin(Game.heading),0,Math.cos(Game.heading));
  group.position.copy(Game.car.position).add(forward.multiplyScalar(7)); group.position.y=2.5;
  group.lookAt(Game.camera.position);
  Game.scene.add(group); Game.ghosts.push({mesh:group,life:1.4});
}

function toggleKliwon(){
  Game.kliwon=!Game.kliwon; document.body.classList.toggle('kliwon',Game.kliwon);
  Game.mode=Game.kliwon?'Kliwon':(Game.relicGame?'Relic':'Drive');
  Game.scene.fog.density=Game.kliwon?.037:.022;
  Game.scene.background.set(Game.kliwon?0x090006:0x05020a);
  doFlash(); pulseBlood(Game.kliwon?'MALAM JUMAT':'NORMAL');
  toast(Game.kliwon?'Malam Jumat aktif: fog lebih tebal.':'Malam Jumat dimatikan.');
}
function toggleGhost(){
  Game.ghostMode=!Game.ghostMode; document.body.classList.toggle('ghost-mode',Game.ghostMode);
  Game.mode=Game.ghostMode?'Hunt':(Game.relicGame?'Relic':'Drive');
  toast(Game.ghostMode?'Ghost Hunt aktif: layar jadi mode senter.':'Ghost Hunt mati.');
}
function toggleQuality(){
  if(Game.quality==='High'){
    Game.quality='Low'; Game.renderer.setPixelRatio(1); Game.renderer.shadowMap.enabled=false;
  } else {
    Game.quality='High'; Game.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.65)); Game.renderer.shadowMap.enabled=true;
  }
  toast('Quality: '+Game.quality+'.');
}
function toggleMute(){
  Game.muted=!Game.muted;
  if(Game.audioCtx && Game.synth) Game.synth.gain.value=Game.muted?0:.026;
  $('muteBtn').textContent=Game.muted?'🔇 Unmute':'🔊 Mute';
  toast(Game.muted?'Audio dimute.':'Audio aktif.');
}
function respawn(show=true){
  const p=WORLD_CONFIG.startPosition;
  Game.car.position.set(p.x,p.y,p.z); Game.heading=WORLD_CONFIG.startRotation; Game.car.rotation.y=Game.heading; Game.speed=0; Game.verticalVelocity=0; Game.onGround=true;
  Game.danger=Math.max(0,Game.danger-18); Game.activeLoc=null;
  if(show) toast('Respawn ke gerbang utara.');
}

function pulseBlood(text){
  const b=$('bloodText'); b.textContent=text; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
function doFlash(){ const f=$('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
let toastTimer=null;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.add('hidden'),2600); }

function initAudio(){
  if(Game.audioCtx) return;
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext) return;
  Game.audioCtx=new AudioContext();
  Game.synth=Game.audioCtx.createGain(); Game.synth.gain.value=.026; Game.synth.connect(Game.audioCtx.destination);
}
function playAmbience(){
  if(!Game.audioCtx || !Game.synth || Game.muted) return;
  const ctx=Game.audioCtx;
  const o1=ctx.createOscillator(); const o2=ctx.createOscillator(); const lfo=ctx.createOscillator(); const lfoGain=ctx.createGain();
  o1.type='sine'; o1.frequency.value=55; o2.type='triangle'; o2.frequency.value=82;
  lfo.type='sine'; lfo.frequency.value=.08; lfoGain.gain.value=20; lfo.connect(lfoGain); lfoGain.connect(o1.frequency);
  o1.connect(Game.synth); o2.connect(Game.synth); o1.start(); o2.start(); lfo.start();
}
function beepScare(){
  if(!Game.audioCtx || Game.muted) return;
  const ctx=Game.audioCtx; const g=ctx.createGain(); g.gain.value=.001; g.connect(ctx.destination);
  const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(90,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+.12); o.frequency.exponentialRampToValueAtTime(70,ctx.currentTime+.5); o.connect(g);
  g.gain.exponentialRampToValueAtTime(.28,ctx.currentTime+.02); g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.65);
  o.start(); o.stop(ctx.currentTime+.68);
}

function onResize(){
  Game.camera.aspect=window.innerWidth/window.innerHeight; Game.camera.updateProjectionMatrix();
  Game.renderer.setSize(window.innerWidth,window.innerHeight);
}

function isOnRoad(x,z,pad=4){
  for(const path of ROAD_PATHS){
    for(let i=0;i<path.length-1;i++){
      if(pointSegmentDistance({x,z},path[i],path[i+1])<WORLD_CONFIG.roadWidth/2+pad) return true;
    }
  }
  return false;
}
function pointSegmentDistance(p,a,b){
  const vx=b.x-a.x, vz=b.z-a.z, wx=p.x-a.x, wz=p.z-a.z;
  const c1=vx*wx+vz*wz; if(c1<=0) return Math.hypot(p.x-a.x,p.z-a.z);
  const c2=vx*vx+vz*vz; if(c2<=c1) return Math.hypot(p.x-b.x,p.z-b.z);
  const t=c1/c2; return Math.hypot(p.x-(a.x+t*vx),p.z-(a.z+t*vz));
}
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
function shiftColor(hex,amt){
  let r=(hex>>16)&255,g=(hex>>8)&255,b=hex&255;
  r=clamp(Math.round(r+amt),0,255);g=clamp(Math.round(g+amt*.3),0,255);b=clamp(Math.round(b+amt),0,255);
  return (r<<16)|(g<<8)|b;
}
