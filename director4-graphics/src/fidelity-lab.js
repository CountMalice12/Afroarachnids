import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {EffectComposer,RenderPass,EffectPass,BloomEffect} from 'postprocessing';
import {makeEarth,makeStars,makeShip} from './orbital-assets.js';
import {generatePalaceMaterials} from './palace-textures.js';
import {loadScannedMaterials,remapAuthoredHullMaterials} from './scanned-materials.js';
import {dressExteriorGantry,dressLuxuryCasino,dressDockingCore} from './cinematic-dressing.js';
import {buildCasinoHero} from './casino-hero.js';
import {surroundCasino} from './casino-enclosure.js';
import {loadCasinoHeroProps,dressCasinoWithScans} from './casino-hero-props.js';
import {batchLuxuryArchitecture} from './luxury-mesh-batching.js';
import {createTacticalCharacter} from './character-art.js';
import {prepareDestructionPhysics,createDestructionPhysics} from './destruction-physics.js';
import {createCombatVFX} from './combat-vfx.js';

// All modular assets are exported real GLB mesh geometry with PBR channels.
// The background artwork is an art-direction reference, not a background image.
const cap=new URLSearchParams(location.search).get('capture')==='1';
const APP=document.querySelector('#fidelity');
APP.innerHTML=`<style>
*{box-sizing:border-box}
body{background:#050e19;color:#dff5fb;font-family:Inter,system-ui,sans-serif;margin:0}
#fd-header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 16px;background:linear-gradient(110deg,#07121f,#0c3040);border-bottom:1px solid #256d7c}
#fd-header strong{font-size:14px;letter-spacing:.07em}#fd-header small{display:block;font-size:9px;letter-spacing:.18em;color:#71dcf4;margin-top:4px}
#fd-header a{color:#9becff;font-size:11px}
#fd-film{background:#143b52;border:1px solid #72bcd1;color:#d4f7ff;border-radius:5px;padding:7px 11px;font-size:11px;cursor:pointer}
body.fd-film #fd-layout{display:block}
body.fd-film #fd-panel{display:none}
body.fd-film #fd-viewport{width:100%;height:calc(100vh - 59px)}
body.fd-film #fd-telemetry{display:none}
body.fd-film #fd-actions-hud{background:#071a2899;border:0}
body.fd-film #fd-crosshair{opacity:.27}

#fd-layout{display:grid;grid-template-columns:minmax(0,1fr) 290px;min-height:calc(100vh - 59px)}
#fd-viewport{height:calc(100vh - 59px);min-height:390px;position:relative;overflow:hidden;touch-action:none;background:#010b16}
#fd-viewport canvas{width:100%;height:100%;display:block}
.fd-hud{pointer-events:none;position:absolute;color:#d0f1fa;text-shadow:0 1px 3px #05121c}
#fd-zone{left:17px;top:16px;padding:10px 14px;background:linear-gradient(120deg,#0a2035db,#071e2ba6);border-left:3px solid #6be5ff;backdrop-filter:blur(9px)}
#fd-zone .title{font-weight:800;font-size:15px;letter-spacing:.05em}
#fd-zone .meta{color:#80ccda;font-size:10px;margin-top:3px;letter-spacing:.1em}
#fd-telemetry{right:14px;top:14px;text-align:right;background:#071a27bd;border:1px solid #438393;border-radius:5px;padding:8px 10px;font-size:9px;line-height:1.6}
#fd-actions-hud{left:12px;bottom:14px;background:#071a28dd;border:1px solid #4d96a7;border-radius:7px;padding:9px 14px;font-size:11px;display:flex;gap:18px}
#fd-crosshair{left:50%;top:50%;transform:translate(-50%,-50%);font-size:19px;color:#a4e9f8;opacity:.62}
#fd-alert{display:none;left:50%;top:15px;transform:translateX(-50%);background:#531e30e6;border:1px solid #ff6882;border-radius:3px;color:#ffe4e9;padding:7px 18px;font-size:11px;letter-spacing:.2em}
#fd-toast{left:50%;top:30%;transform:translateX(-50%);font-weight:800;font-size:15px;opacity:0;transition:opacity .2s}
#fd-panel{padding:13px;background:#0a1b2a;border-left:1px solid #31576b;max-height:calc(100vh - 59px);overflow:auto}
#fd-panel h3{font-size:10px;letter-spacing:.15em;color:#85d8ed;margin:17px 0 9px}
#fd-panel p{font-size:11px;color:#b0c8d1;line-height:1.55}
#fd-panel button,#fd-panel select{font-size:11px;color:#d9f8fe;border:1px solid #3c8092;background:#143448;border-radius:5px;padding:9px;cursor:pointer;min-height:38px}
#fd-panel button:hover{background:#205064}#fd-panel button.active{background:#1d627c;border-color:#8ce9fd}
#fd-scenebuttons,#fd-actionbuttons{display:grid;grid-template-columns:1fr 1fr;gap:7px}
#fd-scenebuttons button:first-child{grid-column:span 2}
#fd-controls{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
#fd-log{height:140px;overflow:auto;padding:9px;background:#051522;border:1px solid #294859;font-family:ui-monospace,monospace;font-size:10px;line-height:1.55}
#fd-loading{position:absolute;inset:0;display:grid;place-items:center;z-index:10;background:#03101ef5;font-size:13px;letter-spacing:.09em;text-align:center}
#fd-mini{font-size:11px;padding:10px;background:#123144;border:1px solid #316879;border-radius:5px;line-height:1.65}
.fd-accent{color:#7de9ff}
@media(max-width:800px){#fd-layout{display:flex;flex-direction:column}#fd-viewport{height:59vh;min-height:310px}#fd-panel{max-height:none;overflow:visible;border-left:0;border-top:1px solid #31576b}#fd-zone{top:8px;left:8px;padding:8px}#fd-zone .title{font-size:13px}#fd-telemetry{top:8px;right:8px}#fd-actions-hud{left:7px;right:7px;bottom:6px;justify-content:space-between;font-size:9px;gap:4px;padding:8px}}
</style>
<div id="fd-header"><div><strong>DIRECTOR 4.0 / ORBITAL ART PASS</strong><small>GHOSTS: OPERATION ZERO • CRYSTAL PALACE</small></div><div><button id="fd-film" type="button">IMMERSIVE VIEW</button> <a href="./palace.html">Ten-floor atlas</a> · <a href="./flight.html">Space combat</a></div></div>
<div id="fd-layout"><main id="fd-viewport">
<div id="fd-loading">LOADING AUTHORED GLB ENVIRONMENTS ...</div>
<div class="fd-hud" id="fd-zone"><div class="title" id="fd-zone-title">CRYSTAL PALACE</div><div class="meta" id="fd-zone-sub"></div></div>
<div class="fd-hud" id="fd-telemetry"><div id="fd-res">PIXELS --</div><div id="fd-camera-label">CINEMATIC CAMERA</div><div id="fd-shading">PBR / DYNAMIC</div></div>
<div class="fd-hud" id="fd-actions-hud"><span id="fd-hp">HP 55 / 55</span><span id="fd-move">MOVE 8</span><span id="fd-enemy">HOSTILE 42 HP</span><span id="fd-dv">ROUND 01</span></div>
<div class="fd-hud" id="fd-crosshair">⌖</div><div class="fd-hud" id="fd-toast"></div><div class="fd-hud" id="fd-alert">SECURITY ALERT / LEVEL 03</div>
</main>
<aside id="fd-panel"><h3>PLAYABLE 3D ENVIRONMENT</h3>
<div id="fd-scenebuttons"><button data-scene="gantry" class="active">EXTERIOR GANTRY • CP-10</button><button data-scene="casino">STARBURST CASINO • CP-03</button><button data-scene="dock">DOCKING CORE • CP-01</button></div>
<h3>TACTICAL CONTROLS</h3><div id="fd-actionbuttons">
<button id="fd-scan">Scan 3D space</button><button id="fd-shoot">Fire / cover</button>
<button id="fd-open">Open airlock</button><button id="fd-alarm">Security alarm</button>
<button id="fd-end">End round</button><button id="fd-camera">Change camera</button><button id="fd-grenade">G • Explosive Breach</button><button id="fd-shield">V • Shield Shader</button>
</div>
<div id="fd-controls"><span></span><button data-move="0,-1">↑</button><span></span><button data-move="-1,0">←</button><button data-move="0,1">↓</button><button data-move="1,0">→</button></div>
<p>WASD moves the crew; drag to orbit the camera and pinch to zoom. F shoots and E opens an adjacent airlock. A destroyed cargo case no longer blocks movement or fire.</p>
<h3>GRAPHICS PROFILE</h3><select id="fd-quality"><option value="mobile">Mobile</option><option value="balanced" selected>Balanced</option><option value="ultra">Ultra • GPU</option></select>
<div id="fd-mini">9 original GLB asset families • CC0 photo-scanned PBR maps • actual GLB geometry • dynamic lighting • responsive render scale</div>
<h3>SESSION EVENT LOG</h3><div id="fd-log"></div><p>Art-directed 3D demonstration using real GLB assets. It is not an update to your live Director 4.0 website or a promise of photorealism on every device.</p>
</aside></div>`;
const el=id=>document.querySelector('#fd-'+id);
const stage=el('viewport'), scenes={
 gantry:{title:'FLOOR 10 — EXTERIOR GANTRY',sub:'CRYSTAL PALACE • EVA MAINTENANCE / ZERO-G',gravity:'VACUUM'},
 casino:{title:'FLOOR 03 — STARBURST CASINO',sub:'CRYSTAL PALACE • VIOLET RESORT RING / 0.8G',gravity:'0.8G'},
 dock:{title:'FLOOR 01 — DOCKING CORE',sub:'CRYSTAL PALACE • ARRIVAL DOCK / 0.8G',gravity:'0.8G'}
};
const names=['gantry_floor_panel','gantry_truss_6m','pressure_rail_4m','pressure_bulkhead_5m','airlock_door_3m','cargo_crate_hardcase','gantry_service_console','observation_glazing_5m','habitat_ring_arc'];
const glb=new Map(),loader=new GLTFLoader();
const volume=[],lights=[],animated=[],targets=[];
let renderer,scene,camera,controls,composer,lightSun,roomGroup,ground,crew=[],enemy,quality='balanced',current='gantry',alarm=false,cinematic=true,round=1,moves=8,action=true,enemyHP=42,playerHP=55,scanOff=0,last=0,fx=[],ring,camGoal;
let sampleVolume,earthTexture=null,scannedBank=null,hdriBank={},destruction=null,vfx=null,shields=[],scorches=[],cameraKick=0,walkPulse=0,scanModels=new Map(),floorReflector=null;
function makeEarthPhoto(){
 if(!earthTexture)return makeEarth(THREE);
 const g=new THREE.Group();
 const m=new THREE.Mesh(new THREE.SphereGeometry(152,96,64),
   new THREE.MeshStandardMaterial({map:earthTexture,roughness:1,metalness:0,emissive:0x102d4d,emissiveIntensity:.16}));
 m.rotation.z=.21;g.add(m);
 const glow=new THREE.Mesh(new THREE.SphereGeometry(155.5,80,56),new THREE.ShaderMaterial({
  side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec3 vNormal;varying vec3 vView;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying vec3 vNormal;varying vec3 vView;void main(){float a=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),3.0);gl_FragColor=vec4(.15,.42,.9,a*.30);}'
 }));g.add(glow);return g
}
const keys=new Set(),rays=new THREE.Raycaster();
const M={};
const mkMat=(col,met=.8,rough=.34,extras={})=>new THREE.MeshPhysicalMaterial({color:col,metalness:met,roughness:rough,clearcoat:.35,clearcoatRoughness:.18,...extras});
M.dark=mkMat(0x182b37,.86,.45);M.plate=mkMat(0x5d778a,.88,.27);M.gold=mkMat(0xc18b4c,.92,.2);M.black=mkMat(0x08131e,.5,.5);
M.glass=mkMat(0x73b9de,.08,.07,{transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide,clearcoat:1,clearcoatRoughness:.06,ior:1.48,thickness:.2,envMapIntensity:1.4});
M.marble=generatePalaceMaterials(THREE).marble;
M.violet=mkMat(0x8124af,.15,.18,{emissive:0x7900cf,emissiveIntensity:1.6});
M.holo=new THREE.MeshBasicMaterial({color:0x45dbff,transparent:true,opacity:.45,side:THREE.DoubleSide});
M.amber=new THREE.MeshBasicMaterial({color:0xffb35d,toneMapped:false});
function addLog(message,bad=false){const d=document.createElement('div');d.textContent='› '+message;d.style.color=bad?'#f39ba9':'#9ddce6';el('log').prepend(d)}
function toast(message,bad=false){el('toast').textContent=message;el('toast').style.color=bad?'#ffa0aa':'#a1eeff';el('toast').style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el('toast').style.opacity=0,1300)}
function box(x,y,z,w,h,d,mat=M.plate,shadow=true,parent=roomGroup){
 const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);obj.position.set(x,y,z);obj.castShadow=shadow;obj.receiveShadow=true;parent.add(obj);return obj
}
function cyl(a,b,r,mat=M.plate,parent=roomGroup){
 const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),16),mat);
 o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());o.castShadow=true;parent.add(o);return o
}
function light(x,y,z,color,intensity,dist){const l=new THREE.PointLight(color,intensity,dist,2);l.position.set(x,y,z);l.userData.baseIntensity=intensity;roomGroup.add(l);lights.push(l);return l}
const matrix=(x,y,z,ry=0,s=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(s,s,s));
function batch(asset,transforms,parent=roomGroup,casts=false){
 const source=glb.get(asset);if(!source)throw Error('Missing GLB '+asset);
 source.updateMatrixWorld(true);
 source.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const inst=new THREE.InstancedMesh(mesh.geometry,mesh.material,transforms.length);
  const local=mesh.matrixWorld.clone();
  transforms.forEach((t,i)=>inst.setMatrixAt(i,t.clone().multiply(local)));
  inst.instanceMatrix.needsUpdate=true;inst.castShadow=casts;inst.receiveShadow=true;parent.add(inst)
 });
}
function clone(asset,x,y,z,ry=0,s=1,parent=roomGroup){
 const a=glb.get(asset).clone(true);a.position.set(x,y,z);a.rotation.y=ry;a.scale.setScalar(s);
 a.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});parent.add(a);return a;
}
function collider(x,z,w,d,name,hp=0,obj=null,door=false){
 const rec={x,z,w,d,name,hp,maxHP:hp,obj,active:true,door};
 volume.push(rec);return rec;
}
function addCrew(x,z,role='media'){
 const actor=createTacticalCharacter(role,[x,0,z]);
 roomGroup.add(actor);crew.push(actor);
 if(vfx&&role!=='security')shields.push(vfx.addShield(actor,role==='solo'?0xff7ba3:0x65c9ef,1.25));
 return actor;
}

function solidHit(x,z,pad=.42){
 return volume.find(v=>v.active&&Math.abs(x-v.x)<v.w/2+pad&&Math.abs(z-v.z)<v.d/2+pad);
}
function sight(a,b){
 const A=a.clone().add(new THREE.Vector3(0,1.25,0)),B=b.clone().add(new THREE.Vector3(0,1.25,0)),dir=B.sub(A),len=dir.length();
 for(const o of volume){
  if(!o.active)continue;
  for(let s=1;s<=Math.ceil(len/.16);s++){
   const x=A.x+dir.x*s/Math.ceil(len/.16),z=A.z+dir.z*s/Math.ceil(len/.16);
   if(Math.abs(x-o.x)<o.w/2&&Math.abs(z-o.z)<o.d/2)return o;
  }
 }return null;
}
function decorativeBolts(x,z){
 for(const xx of [-.8,.8])for(const zz of [-.8,.8]){const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.05,12),M.gold);bolt.position.set(x+xx,.16,z+zz);roomGroup.add(bolt)}
}
function buildSky(){
 scene.add(makeStars(THREE));
 const earth=makeEarthPhoto();earth.position.set(145,-214,-350);roomGroup.add(earth);
 const ships=[];
 for(let j=0;j<3;j++){const s=makeShip(THREE,j===2?'heavy':'crew');s.scale.setScalar(j===2?.3:.14);
   s.position.set(35+j*20,17-j*6,-80-j*36);s.rotation.y=.55;roomGroup.add(s);ships.push(s);animated.push({o:s,speed:.035+j*.01})}
}
function buildRing(){
 // All geometry is volumetric: a multi-shell five-band curved ring with visible windows.
 const ringRoot=new THREE.Group();ringRoot.position.set(52,28,-52);roomGroup.add(ringRoot);
 const mk=(radius,tube,mat)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,24,216),mat);t.castShadow=true;ringRoot.add(t)};
 mk(49,3.3,M.plate);mk(52,.48,M.gold);mk(46.6,.55,M.dark);mk(48.2,.16,M.holo);
 for(let i=0;i<210;i++){const a=i/210*Math.PI*2,x=Math.cos(a)*50,z=0,y=Math.sin(a)*50;
  const lightBox=box(x,y,3.25,.48,.76,.2,i%8===0?M.amber:M.holo,false,ringRoot);lightBox.rotation.z=a;
 }
 for(let k=0;k<16;k++){const a=k/16*Math.PI*2,x=Math.cos(a)*49,y=Math.sin(a)*49;
  cyl([x,y,-3],[x,y,3.3],.33,M.gold,ringRoot)
 }
 // Exported custom curved rib from the authored asset pack, not a matte painting.
 const arc=clone('habitat_ring_arc',0,-16,0,0,1.35,ringRoot);arc.rotation.x=Math.PI/2;
 ring=ringRoot;
}
function lighting(mode){
 const cold=mode==='gantry';
 if(hdriBank[cold?'gantry':'casino'])scene.environment=hdriBank[cold?'gantry':'casino'];
 lightSun.intensity=cold?3.7:2.7;
 lightSun.color.setHex(cold?0xd5eaff:0xffdbb6);
 scene.background=new THREE.Color(cold?0x010b18:0x0a1023);
 const main=light(-10,5,-6,cold?0xffbd73:0xffc797,cold?44:32,21);
 const blue=light(8,6,1,cold?0x4bc4ff:0xc85eff,cold?38:32,19);
 light(1,5,10,cold?0x80bafc:0x48baff,22,20);
 RectAreaLightUniformsLib.init();
 for(const [x,z] of [[-16,-8],[0,-8],[15,-8]]){
  const area=new THREE.RectAreaLight(cold?0xffbc7a:0xffa4df,cold?9:12,5,1.4);
  area.position.set(x,6,z);area.lookAt(x,0,z);roomGroup.add(area);
  box(x,6.0,z,4.8,.12,.5,M.amber,false)
 }
}
function buildGantry(){
 lighting('gantry');buildSky();buildRing();
 const tiles=[];for(let x=-21;x<=21;x+=2)for(let z=-10;z<=10;z+=2)tiles.push(matrix(x,0,z));
 batch('gantry_floor_panel',tiles,roomGroup,false);
 box(0,-.58,0,46,.8,24,M.dark,false);
 const bulk=[];for(let x=-20;x<=20;x+=5){if(x!==-20)bulk.push(matrix(x,0,-12))}
 batch('pressure_bulkhead_5m',bulk,roomGroup,true);
 const glasses=[];for(let x=-18;x<=18;x+=6)glasses.push(matrix(x,0,-12.08));
 batch('observation_glazing_5m',glasses,roomGroup,false);
 const trusses=[];for(let x of [-20,-10,0,10,20])trusses.push(matrix(x,6,-5));
 batch('gantry_truss_6m',trusses,roomGroup,false);
 const railing=[];for(let x=-20;x<=20;x+=4){railing.push(matrix(x,0,11.8,Math.PI/2))}
 for(let z=-10;z<=10;z+=4)railing.push(matrix(22,0,z));
 batch('pressure_rail_4m',railing,roomGroup,false);
 const door=clone('airlock_door_3m',-20,0,-11.9);collider(-20,-11.9,3.5,.6,'PRESSURE AIRLOCK',0,door,true);
 for(const [x,z] of [[-11,-5],[-8,-4],[0,1],[6,5],[8,5],[14,-3],[15,-2],[-13,7]]){
  const a=clone('cargo_crate_hardcase',x,0,z,Math.sin(x)*.2);
  collider(x,z,1.7,1.45,'HARDCASE CARGO',22,a,false)
 }
 for(const [x,z] of [[-14,-7],[-5,-8],[5,-8],[15,-8]])clone('gantry_service_console',x,0,z);
 for(const [x,z,w,d] of [[-20,-12,5,.5],[-14,-12,5,.5],[-8,-12,5,.5],[0,-12,5,.5],[9,-12,5,.5],[18,-12,5,.5]])
  collider(x,z,w,d,'PRESSURE BULKHEAD');
 for(let x=-20;x<=20;x+=10){cyl([x,0,-11],[x,5.7,-11],.27,M.gold)}
 const scanner=new THREE.Mesh(new THREE.CylinderGeometry(4.0,4,.045,72),M.holo);
 scanner.position.set(0,.14,-1);roomGroup.add(scanner);
 dressExteriorGantry(roomGroup,{high:quality!=='mobile'});
}
function addCasinoPlanarReflections(){
 // Real-time reflected objects on the polished marble; disabled on low-power
 // devices to keep map navigation and destruction responsive.
 if(cap||quality==='mobile'||window.innerWidth<850)return;
 const px=Math.min(1024,quality==='ultra'?1024:512);
 floorReflector=new Reflector(new THREE.PlaneGeometry(45.2,31.1),{
  clipBias:.004,textureWidth:px,textureHeight:px,color:0x9b9d9e
 });
 floorReflector.rotation.x=-Math.PI/2;
 floorReflector.position.y=.08;
 const material=floorReflector.material;
 material.fragmentShader=material.fragmentShader.replace(
  'gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',
  'gl_FragColor = vec4( blendOverlay( base.rgb, color ), 0.19 );'
 );
 material.transparent=true;material.depthWrite=false;material.needsUpdate=true;
 roomGroup.add(floorReflector);
}
function buildCasino(){
 lighting('casino');
 const details=buildCasinoHero({
   group:roomGroup,
   marble:M.marble,
   addLight:(x,y,z,color,intensity,range)=>light(x,y,z,color,intensity,range),
   addCollision:(x,z,w,d,name,hp=0,physicalMesh=null)=>collider(x,z,w,d,name,hp,physicalMesh),
   earth:makeEarthPhoto,
   high:!cap&&quality!=='mobile'&&window.innerWidth>=850
 });
 const shell=surroundCasino({group:roomGroup,addLight:(x,y,z,color,intensity,range)=>light(x,y,z,color,intensity,range),
   high:!cap&&quality!=='mobile'&&window.innerWidth>=850});
 const scans=dressCasinoWithScans(roomGroup,scanModels,{mobile:cap||quality==='mobile'||window.innerWidth<850});
 addCasinoPlanarReflections();
 addLog('Architectural envelope: '+shell.sealedSides+' enclosed hull sides, '+shell.windows+' observation bays, real upper soffit and ring supports.');
 addLog('CC0 scanned decor: '+scans.chairs+' chairs, '+scans.plants+' potted plants and '+scans.shrubs+' flowering bushes.');
 addLog('Rebuilt photorealism-oriented Casino: two-level mezzanine, 17-step grand staircase, custom red-velvet gaming tables, curved bar and botanical architecture.');
 addLog('Casino art inventory: '+details.gamingTables+' tables, '+details.plants+' architectural trees, gold inlays, panoramic observation windows.');
}
function buildDock(){
 lighting('gantry');buildSky();const tiles=[];
 for(let x=-21;x<=21;x+=2)for(let z=-15;z<=15;z+=2)tiles.push(matrix(x,0,z));
 batch('gantry_floor_panel',tiles);box(0,-.55,0,46,.65,34,M.dark,false);
 const bulks=[];for(let x=-20;x<=20;x+=5)bulks.push(matrix(x,0,-16));
 batch('pressure_bulkhead_5m',bulks);
 const trusses=[];for(let x of [-18,-7,7,18])trusses.push(matrix(x,6,-6));batch('gantry_truss_6m',trusses);
 for(let i=0;i<3;i++){
  const x=-14+i*14;const ship=makeShip(THREE,'crew');ship.scale.setScalar(.53);ship.position.set(x,2.2,-7);roomGroup.add(ship);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(5.1,5.1,.27,64),M.gold);pad.position.set(x,.1,-7);roomGroup.add(pad);
  const circle=new THREE.Mesh(new THREE.TorusGeometry(4.8,.09,12,96),M.holo);circle.rotation.x=Math.PI/2;circle.position.set(x,.32,-7);roomGroup.add(circle);
 }
 for(let x=-18;x<=18;x+=6){const a=clone('cargo_crate_hardcase',x,0,8);
  collider(x,8,1.8,1.45,'DOCK CARGO',22,a)}
 for(let x of [-19,19]){const a=clone('airlock_door_3m',x,0,-15.5);collider(x,-15.5,3.5,.6,'HANGAR AIRLOCK',0,a,true)}
 for(let x of [-19,-7,7,19])clone('gantry_service_console',x,0,12);
 dressDockingCore(roomGroup,{high:quality!=='mobile'});
}
async function start(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x030c17);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.11;
 renderer.shadowMap.enabled=!cap;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.style.touchAction='none';stage.insertBefore(renderer.domElement,stage.firstChild);
 camera=new THREE.PerspectiveCamera(47,1,.15,1600);camera.position.set(17.7,14.1,23.2);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minPolarAngle=.11;controls.maxPolarAngle=Math.PI*.47;
 controls.minDistance=13;controls.maxDistance=140;controls.target.set(0,1,0);
 scene.add(new THREE.HemisphereLight(0xaacdf7,0x162031,1.25));
 lightSun=new THREE.DirectionalLight(0xd8eaff,4.8);lightSun.position.set(-38,75,37);lightSun.castShadow=!cap;
 lightSun.shadow.mapSize.set(2048,2048);lightSun.shadow.camera.left=-95;lightSun.shadow.camera.right=95;
 lightSun.shadow.camera.top=95;lightSun.shadow.camera.bottom=-95;scene.add(lightSun);
 if(!cap||new URLSearchParams(location.search).has('renderMaterial')){try{const p=new THREE.PMREMGenerator(renderer);scene.environment=p.fromScene(new RoomEnvironment(),.08).texture;p.dispose();addLog('Studio PBR reflections active')}catch(e){addLog('IBL probe unavailable')}}
 if(!cap){
   // The panorama is an illumination/reflection probe only. Background remains orbit.
   try{
     const hdriLoader=new RGBELoader();const pmrem=new THREE.PMREMGenerator(renderer);
     for(const key of ['gantry','casino']){
       const hdr=await hdriLoader.loadAsync('./hdri/'+key+'.hdr');
       const tex=pmrem.fromEquirectangular(hdr);hdriBank[key]=tex.texture;hdr.dispose();
     }
     pmrem.dispose();addLog('Photo-based HDRI reflections loaded for orbital and interior surfaces.');
   }catch(e){addLog('HDRI material reflections unavailable: '+e.message)}
 }
 if(!cap){composer=new EffectComposer(renderer,{frameBufferType:THREE.HalfFloatType});composer.addPass(new RenderPass(scene,camera));
  composer.addPass(new EffectPass(camera,new BloomEffect({intensity:.73,luminanceThreshold:.8,luminanceSmoothing:.25,mipmapBlur:true})));}
 try{scannedBank=await loadScannedMaterials(addLog);
 M.plate=scannedBank.gantry_metal;
 M.marble=scannedBank.casino_marble;
 M.wornHull=scannedBank.weathered_hull;
 addLog('Photo-scanned material bank applied to Palace environment.');
 }catch(e){addLog('Scanned textures unavailable, using procedural fallback: '+e.message)}
 try{earthTexture=await new THREE.TextureLoader().loadAsync('./textures/earth_atmos_2048.jpg');earthTexture.colorSpace=THREE.SRGBColorSpace;earthTexture.anisotropy=8;addLog('Loaded photographic-style Earth texture.')}catch(e){addLog('Earth image unavailable; retaining generated sphere.')} 
 el('film').addEventListener('click',()=>{
   document.body.classList.toggle('fd-film');
   el('film').textContent=document.body.classList.contains('fd-film')?'EXIT IMMERSIVE VIEW':'IMMERSIVE VIEW';
   cinematic=true;applyCamera();
   requestAnimationFrame(resize);
 });
 await prepareDestructionPhysics();
 vfx=createCombatVFX(scene,{quality:cap?'mobile':quality});
 destruction=createDestructionPhysics({scene,gravity:-8,
   onDestroyed:(record,{position,stain})=>{scorches.push(stain);vfx.explosion(position,{radius:2.7,space:current==='gantry'});cameraKick=.35;addLog('PHYSICS: '+record.name+' shattered; collision + LOS cleared');},
   onImpact:(p)=>vfx.impact(p),
   onExplosion:(p,e)=>{vfx.explosion(p,{radius:e.radius,space:current==='gantry'});cameraKick=.6;addLog('BLAST: '+e.hit+' cover objects hit, '+e.destroyed+' destroyed');}
 });
 const loaded=await Promise.all(names.map(async n=>{const result=await loader.loadAsync('./models/'+n+'.glb');glb.set(n,result.scene);return n}));
 if(scannedBank)remapAuthoredHullMaterials(glb,scannedBank,addLog);
 addLog('Loaded '+loaded.length+' original GLBs with physically based material channels');
 scanModels=await loadCasinoHeroProps(loader,addLog);
 document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>loadScene(b.dataset.scene));
 for(const [id,handler] of [['shoot',shoot],['scan',scan],['open',openAirlock],['end',endRound],['alarm',()=>{alarm=!alarm;el('alert').style.display=alarm?'block':'none';toast(alarm?'LOCKDOWN / LEVEL 03':'ALARM CLEARED');}],['camera',()=>{cinematic=!cinematic;applyCamera();}],['grenade',blastCover],['shield',toggleShield]])el(id).onclick=handler;
 document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const [dx,dz]=b.dataset.move.split(',').map(Number);move(dx,dz)});
 document.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea'))return;
  const k=e.key.toLowerCase();if('wasd'.includes(k)&&k.length===1){e.preventDefault();move(k==='a'?-1:k==='d'?1:0,k==='w'?-1:k==='s'?1:0)}
  if(k==='f')shoot();if(k==='e')openAirlock();if(k==='g')blastCover();if(k==='v')toggleShield();});
 el('quality').onchange=e=>{quality=e.target.value;resize()};
 new ResizeObserver(resize).observe(stage);
 await loadScene('casino');resize();el('loading').remove();
 requestAnimationFrame(render);
}
function applyCamera(){
 if(cinematic){controls.target.set(0,current==='casino'?1.9:1,current==='gantry'?-1:0);camGoal=current==='gantry'?new THREE.Vector3(17,11,24):current==='casino'?new THREE.Vector3(17.7,14.1,23.2):new THREE.Vector3(22,14,27)}
 else{controls.target.set(0,0,0);camGoal=new THREE.Vector3(1,49,42)}
 toast(cinematic?'CINEMATIC PERSPECTIVE':'TACTICAL OVERHEAD');
}
async function loadScene(mode){
 current=mode;if(floorReflector){floorReflector.dispose();floorReflector=null;}if(destruction)destruction.registerScene([]);if(vfx)vfx.reset();for(const s of scorches)scene.remove(s);scorches.length=0;
 volume.length=0;lights.length=0;animated.length=0;crew.length=0;shields.length=0;fx.length=0;
 if(roomGroup)scene.remove(roomGroup);
 roomGroup=new THREE.Group();scene.add(roomGroup);
 if(mode==='gantry')buildGantry();else if(mode==='casino')buildCasino();else buildDock();
 addCrew(-15,8,'media');addCrew(-16,5,'medic');addCrew(-18,7,'solo');
 enemy=addCrew(8,-4,'security');crew.pop();
 if(destruction){destruction.setGravity(mode==='gantry'?0:-8.5);destruction.registerScene(volume)}
 // Four squad members share the same authored physical map, but this is a test encounter.
 moves=8;action=true;enemyHP=42;round=1;playerHP=55;
 const name=scenes[mode];el('zone-title').textContent=name.title;el('zone-sub').textContent=name.sub;
 el('hp').textContent='CREW HP '+playerHP+' / 55';el('move').textContent='MOVE '+moves;
 el('enemy').textContent='HOSTILE '+enemyHP+' HP';el('dv').textContent='ROUND '+String(round).padStart(2,'0');
 document.querySelectorAll('[data-scene]').forEach(b=>b.classList.toggle('active',b.dataset.scene===mode));
 applyCamera();addLog('Sector '+name.title+' loaded: real GLB geometry + physical cover');refresh();
}
function move(dx,dz){
 if(!moves){toast('NO MOVEMENT LEFT',true);return}
 const p=crew[0].position,from=p.clone(),tx=p.x+dx*1.6,tz=p.z+dz*1.6;
 for(let i=1;i<=12;i++){const x=from.x+(tx-from.x)*i/12,z=from.z+(tz-from.z)*i/12;
  const hit=solidHit(x,z);if(hit){toast('BLOCKED BY '+hit.name,true);return}}
 if(Math.abs(tx)>22||Math.abs(tz)>15){toast('EDGE OF BOARD',true);return}
 p.x=tx;p.z=tz;moves=Math.max(0,moves-2);walkPulse=1;refresh();addLog('Crew advanced 1.6 m')
}
function fireLine(){
 const a=crew[0].position,b=enemy.position;
 const d=b.clone().sub(a),n=Math.ceil(d.length()/.12);
 for(let k=1;k<n;k++){const x=a.x+d.x*k/n,z=a.z+d.z*k/n,hit=solidHit(x,z,0);
  if(hit)return hit}
 return null
}
function shoot(){
 if(!action){toast('ACTION SPENT',true);return}action=false;
 const hit=fireLine();
 if(hit){if(hit.hp>0){const result=destruction.damage(hit,12,{point:new THREE.Vector3(hit.x,1.1,hit.z),impulse:36});
  toast(result.destroyed?'COVER SHATTERED':'COVER HIT: -12',true)}
  else{toast('BULKHEAD BLOCKS SHOT',true);vfx.impact(new THREE.Vector3(hit.x,1.3,hit.z));}}
 else{enemyHP=Math.max(0,enemyHP-15);toast('DIRECT HIT / 15');enemy.userData.hit?.();vfx.impact(enemy.position.clone().add(new THREE.Vector3(0,1.2,0)));if(enemyHP===0)enemy.visible=false}
 addLog(hit?'Ballistics collide with '+hit.name:'Enemy hit; native RED resolver would handle DV & armor');
 // Visible beam traced between player and obstruction or enemy.
 crew[0].userData.fire?.();const from=crew[0].position.clone().add(new THREE.Vector3(0,1.4,0));vfx.muzzle(from);
 const to=hit?new THREE.Vector3(hit.x,1.4,hit.z):enemy.position.clone().add(new THREE.Vector3(0,1.4,0));
 const d=to.clone().sub(from),beam=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,d.length(),10),M.holo);
 beam.position.copy(from).add(to).multiplyScalar(.5);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
 roomGroup.add(beam);fx.push({o:beam,t:1.7});refresh();
}
function blastCover(){
 if(!action){toast('ACTION SPENT',true);return}
 action=false;
 const candidate=volume.filter(o=>o.active&&o.maxHP>0).sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))[0];
 const point=candidate?new THREE.Vector3(candidate.x,1.2,candidate.z):new THREE.Vector3(0,1.2,0);
 const result=destruction.explosion(point,5.1,68,92,volume);
 toast('EXPLOSIVE BREACH: '+result.destroyed+' COVER DESTROYED');
 if(enemy.position.distanceTo(point)<5.1&&enemyHP>0){enemyHP=Math.max(0,enemyHP-20);enemy.userData.hit?.();if(enemyHP===0)enemy.visible=false}
 refresh()
}
function toggleShield(){
 for(const s of shields){s.visible=!s.visible;if(s.visible)vfx.shieldHit(s)}
 toast(shields[0]?.visible?'CYBER SHIELDS ACTIVE':'SHIELDS DISABLED');
}
function scan(){scanOff=performance.now()+3800;toast('TACTICAL SWEEP');addLog('Scan: physical cover and enemy contact mapped')}
function openAirlock(){
 if(!action){toast('ACTION SPENT',true);return}
 const doors=volume.filter(v=>v.active&&v.door).sort((a,b)=>Math.hypot(a.x-crew[0].position.x,a.z-crew[0].position.z)-Math.hypot(b.x-crew[0].position.x,b.z-crew[0].position.z));
 const d=doors[0];if(!d||Math.hypot(d.x-crew[0].position.x,d.z-crew[0].position.z)>3.5){toast('NO AIRLOCK WITHIN REACH',true);return}
 d.active=false;d.obj.visible=false;action=false;toast('AIRLOCK OPEN');addLog('Airlock geometry and collider disabled');refresh()
}
function endRound(){round++;moves=8;action=true;if(enemyHP>0&&!fireLine())playerHP=Math.max(0,playerHP-4);
 refresh();addLog('Initiative advanced to round '+round)}
function refresh(){
 el('hp').textContent='CREW HP '+playerHP+' / 55';el('move').textContent='MOVE '+moves+' / 8';
 el('enemy').textContent='HOSTILE '+enemyHP+' HP';el('dv').textContent='ROUND '+String(round).padStart(2,'0')+' • '+(action?'ACTION':'SPENT')+' • '+(destruction?.metrics().debris||0)+' DEBRIS'
}
function resize(){
 if(!renderer)return;
 const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
 const dpr=cap?.7:Math.min(devicePixelRatio||1,quality==='mobile'?1:quality==='ultra'?2:1.45);
 renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);
 camera.aspect=w/h;camera.updateProjectionMatrix();if(composer)composer.setSize(w,h);
 renderer.shadowMap.enabled=!cap&&quality!=='mobile';
 el('res').textContent=Math.round(w*dpr)+' × '+Math.round(h*dpr)+' • DPR '+dpr.toFixed(2);
}
function render(now){
 requestAnimationFrame(render);const dt=Math.min(.06,(now-last)/1000||.016);last=now;
 if(camGoal){camera.position.lerp(camGoal,Math.min(1,dt*1.6));if(camera.position.distanceTo(camGoal)<.1)camGoal=null}
 lights.forEach((l,i)=>l.intensity=(l.userData.baseIntensity||15)*(alarm&&i%2===0?1.22:1)*(1+Math.sin(now*.0018+i)*.035));
 animated.forEach(({o,speed})=>o.position.x-=dt*speed*11);
 if(ring)ring.rotation.z+=dt*.0018;
 for(let i=fx.length-1;i>=0;i--){fx[i].t-=dt;if(fx[i].t<=0){roomGroup.remove(fx[i].o);fx.splice(i,1)}}
 destruction?.tick(dt);vfx?.tick(dt);
 walkPulse=Math.max(0,walkPulse-dt*1.9);
 crew.forEach((c,i)=>c.userData.animate?.(dt,i===0?walkPulse:.08));enemy?.userData.animate?.(dt,.03);
 if(cameraKick>.003){camera.position.add(new THREE.Vector3(Math.sin(now*.083)*cameraKick*.16,Math.cos(now*.071)*cameraKick*.12,0));cameraKick*=Math.exp(-dt*11)}
 controls.update();if(composer)composer.render();else renderer.render(scene,camera)
}
start().catch(e=>{el('loading').textContent='GRAPHICS LAB COULD NOT START: '+e.message;console.error(e)});
