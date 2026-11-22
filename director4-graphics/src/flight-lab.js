import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing';
import { makeShip, makeEarth, makePalace, makeStars, makeAsteroids } from './orbital-assets.js';

/**
 * Director 4.0 High-Fidelity Orbital Lab
 * The flight physics, mesh geometry, ray/sphere obstacles and effects run live.
 * A self-contained experimental renderer; it does NOT read/write campaign state.
 * Requires a WebGL2-capable browser, GPU memory and locally installed packages.
 */
const MAPS = {
 earth:{title:'EARTH-LIMB PURSUIT',subtitle:'High orbit // Arasaka interception',description:'Blue atmospheric limb, high-speed interceptor pursuit, and orbital hull reflections.',spawn:[0,2,60],enemies:3},
 debris:{title:'DEBRIS FIELD AMBUSH',subtitle:'Shrapnel corridor // Derelict salvage zone',description:'Dense asteroid occlusion, 3D wreckage, and interception through hazardous debris.',spawn:[0,1,58],enemies:4},
 cordon:{title:'CRYSTAL PALACE CORDON',subtitle:'L1 station perimeter // Restricted docking approach',description:'Five-ring habitat, illuminated docking arrays, rotating armatures, and station security.',spawn:[0,0,42],enemies:4}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const $=id=>document.getElementById(id);
const root=$('orbital-app');
root.innerHTML=`<style>
*{box-sizing:border-box}body{overflow-x:hidden;background:#06111c;color:#d8ecf6}
#d4-outer{min-height:100vh;display:flex;flex-direction:column;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
#d4-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 14px;background:linear-gradient(90deg,#101b2b,#091e32);border-bottom:1px solid #2d6b7c}
#d4-head strong{font-size:15px;letter-spacing:1px}#d4-head small{display:block;color:#5fc9e0;font-size:10px}
#d4-head a{color:#8fe3f5;font-size:11px;text-decoration:underline}
#d4-grid{display:grid;grid-template-columns:minmax(0,1fr) 290px;flex:1;min-height:0}
#d4-stage{position:relative;min-width:0;height:calc(100vh - 58px);min-height:410px;overflow:hidden;background:#01030c;touch-action:none}
#d4-stage canvas.webgl{width:100%;height:100%;display:block}
.d4-overlay{position:absolute;z-index:3;pointer-events:none}
#d4-top{left:12px;top:10px;right:10px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;font-size:10px}
#d4-level{padding:12px;background:#06182ae0;border:1px solid #337e91;border-radius:7px;max-width:290px}
#d4-level strong{display:block;font-size:14px;color:#defbff;margin-bottom:6px}
#d4-minihud{padding:9px;background:#06182ae0;border:1px solid #337e91;border-radius:7px;text-align:right}
#d4-crosshair{width:25px;height:25px;top:50%;left:50%;transform:translate(-50%,-50%);border:1px solid #7edbfe;border-radius:50%;box-shadow:0 0 10px #26baff94}
#d4-crosshair:after,#d4-crosshair:before{content:'';position:absolute;background:#8ce6fa}
#d4-crosshair:before{width:1px;height:37px;left:11px;top:-7px}
#d4-crosshair:after{height:1px;width:37px;top:11px;left:-7px}
#d4-bottom{left:12px;right:12px;bottom:12px;display:flex;justify-content:space-between;align-items:end;gap:10px;font-size:11px}
#d4-shipstats{padding:10px;background:#071b2ee8;border:1px solid #2c7f91;border-radius:7px;min-width:210px}
#d4-shipstats b{color:#69e4fc}
#d4-targetbox{padding:10px;background:#071b2ee8;border:1px solid #a04d5c;border-radius:7px;text-align:right}
#d4-side{background:#0b1c2c;padding:12px;border-left:1px solid #315163;overflow:auto;max-height:calc(100vh - 58px)}
#d4-side h3{font-size:11px;letter-spacing:1px;color:#78dff0;margin:15px 0 7px}
#d4-side p{font-size:11px;color:#a8c0ca;line-height:1.55}
#d4-side button,#d4-side select{border:1px solid #316d82;background:#133245;color:#e2faff;border-radius:7px;padding:10px 8px;font-family:inherit;font-size:11px;cursor:pointer}
#d4-side button:hover{background:#20566e}#d4-side button:disabled{opacity:.45;cursor:not-allowed}
#d4-side button.selected{border-color:#8af3ff;background:#17607b}
#d4-mapbuttons{display:grid;grid-template-columns:1fr;gap:6px}
#d4-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#d4-actions button{min-height:44px}
#d4-log{border:1px solid #304f5a;background:#07131e;padding:9px;height:136px;overflow:auto;font-size:10px;line-height:1.6}
#d4-controls{font-size:10px;border:1px solid #274857;border-radius:6px;padding:10px;color:#b5cad1;background:#102535}
#d4-radar{display:block;border:1px solid #315163;background:#05111c;border-radius:50%;margin:10px auto}
#d4-touch{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:8px 0}
#d4-touch button{touch-action:none}
#d4-toast{position:absolute;left:50%;top:25%;transform:translate(-50%,-50%);font-size:14px;font-weight:bold;color:white;text-shadow:0 0 14px #2dd7ff;pointer-events:none;z-index:5;opacity:0;transition:opacity .15s;text-align:center}
#d4-error{display:none;padding:18px;background:#351824;color:#ffd5db;font-size:12px}
.metric{padding:7px;border:1px solid #365364;border-radius:5px;margin:8px 0;background:#112838;font-size:11px}
@media(max-width:850px){#d4-grid{display:flex;flex-direction:column}#d4-stage{height:58vh;min-height:330px}#d4-side{max-height:none;overflow:visible;border-left:0;border-top:1px solid #315163}#d4-head{padding:10px}#d4-top{font-size:9px}#d4-level{max-width:195px}#d4-bottom{font-size:9px}}
</style>
<div id="d4-outer">
<header id="d4-head"><div><strong>GHOSTS // OPERATION ZERO</strong><small>DIRECTOR 4.0 • ORBITAL FLIGHT • GRAPHICS LAB</small></div><a href="./index.html">Back to tactical lab</a></header>
<div id="d4-error"></div><div id="d4-grid">
<main id="d4-stage"><div id="d4-top" class="d4-overlay"><div id="d4-level"><strong id="d4-sector">EARTH-LIMB PURSUIT</strong><span id="d4-subtitle">High orbit</span></div><div id="d4-minihud"><div id="d4-fps">FPS --</div><div id="d4-res">RES --</div><div id="d4-mapcount">CONTACTS --</div></div></div><div id="d4-crosshair" class="d4-overlay"></div><div id="d4-bottom" class="d4-overlay"><div id="d4-shipstats"></div><div id="d4-targetbox">NO TARGET</div></div><div id="d4-toast"></div></main>
<aside id="d4-side">
<h3>ENGAGEMENT ZONE</h3><div id="d4-mapbuttons"></div>
<h3>SHIP WEAPONS</h3><div id="d4-actions">
<button id="d4-lock">T • Lock target</button><button id="d4-rail">G • Railgun</button>
<button id="d4-missile">M • Guided missile</button><button id="d4-cam">C • Camera mode</button></div>
<h3>FLIGHT CONTROLS</h3>
<div id="d4-controls">W/S thrust or reverse • A/D yaw • ↑/↓ pitch • Q/E roll • R/F vertical thrust • J/L strafe • Shift boost • Space dampeners • T target • G gun • M missile • C camera</div>
<div id="d4-touch"><button data-key="KeyW">THRUST</button><button data-key="KeyA">YAW −</button><button data-key="KeyD">YAW +</button><button data-key="Space">BRAKE</button><button data-key="ArrowUp">PITCH ↑</button><button data-key="ArrowDown">PITCH ↓</button><button data-key="KeyR">ASCEND</button><button data-key="ShiftLeft">BOOST</button></div>
<h3>RENDER QUALITY</h3><div style="display:flex;gap:6px"><select id="d4-quality" style="flex:1"><option value="low">Low / Mobile</option><option value="balanced" selected>Balanced</option><option value="ultra">Ultra / Desktop</option></select><button id="d4-sfx">Enable SFX</button></div>
<p>Same pixel-density sizing for all three flight maps. Drag the scene to orbit the camera in Free Camera mode; pinch or wheel to zoom. No saved campaign state is changed.</p>
<canvas id="d4-radar" width="150" height="150"></canvas>
<h3>ENGAGEMENT LOG</h3><div id="d4-log" role="log"></div>
<p id="d4-description"></p>
</aside></div></div>`;
const stage=$('d4-stage'), buttons=$('d4-mapbuttons');
const CAPTURE_MODE=new URLSearchParams(location.search).get('capture')==='1';
const shipInfo=$('d4-shipstats'),targetInfo=$('d4-targetbox');
const keys=new Set(),clock=new THREE.Clock(),v0=new THREE.Vector3();
const forwardAxis=new THREE.Vector3(0,0,-1),upAxis=new THREE.Vector3(0,1,0),rightAxis=new THREE.Vector3(1,0,0);
let renderer,composer,scene,camera,orbit,sun,playerShip,player,env,targets=[],projectiles=[],beamFX=[],asteroidColliders=[],stationCollider=null,currentMap='earth',target=null,cameraMode='chase',mapFrames=0,quality='balanced',dpr=1.25,canFireAt=0,canMissileAt=0,lastHud=0,lastRadar=0,audio=null,muted=true,collisionCooldown=0;
const IDLE='IDLE';
const state={time:0,lastMap:'earth',shipDamage:0,shots:0,collisions:0};
function toast(message,isBad=false){const el=$('d4-toast');el.textContent=message;el.style.color=isBad?'#ff8592':'#92ebff';el.style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.opacity=0,1250)}
function log(message,color=''){const e=document.createElement('div');e.textContent='› '+message;e.style.color=color==='bad'?'#ff8d9c':color==='ok'?'#89f1c5':'#adcbd5';$('d4-log').prepend(e)}
function sfx(type){
 if(muted)return;try{
  audio ||= new (window.AudioContext||window.webkitAudioContext)();
  if(audio.state==='suspended')audio.resume();
  const osc=audio.createOscillator(),gain=audio.createGain();
  const now=audio.currentTime;osc.type=type==='impact'?'sawtooth':type==='gun'?'square':'sine';
  osc.frequency.setValueAtTime(type==='gun'?430:type==='impact'?95:680,now);
  osc.frequency.exponentialRampToValueAtTime(type==='gun'?60:type==='impact'?29:250,now+.20);
  gain.gain.setValueAtTime(.07,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.21);
  osc.connect(gain).connect(audio.destination);osc.start(now);osc.stop(now+.22);
 }catch(e){}
}
function setup(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x01050c);
 camera=new THREE.PerspectiveCamera(58,1,.15,2200);camera.position.set(0,8,35);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.65;
 renderer.shadowMap.enabled=!CAPTURE_MODE;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.className='webgl';stage.insertBefore(renderer.domElement,stage.firstChild);
 if(!CAPTURE_MODE){try{const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;pmrem.dispose()}catch(e){log('Reflection probe unavailable; using analytic lighting')}}
 if(!CAPTURE_MODE){composer=new EffectComposer(renderer,{frameBufferType:THREE.HalfFloatType});composer.addPass(new RenderPass(scene,camera));
 composer.addPass(new EffectPass(camera,new BloomEffect({intensity:.65,luminanceThreshold:.72,luminanceSmoothing:.22,mipmapBlur:true})));}
 const ambient=new THREE.HemisphereLight(0x91b6f4,0x101c2a,2);scene.add(ambient);
 sun=new THREE.DirectionalLight(0xffe1c6,3.4);sun.position.set(-100,150,-90);sun.castShadow=true;
 sun.shadow.camera.left=-115;sun.shadow.camera.right=115;sun.shadow.camera.top=115;sun.shadow.camera.bottom=-115;sun.shadow.camera.near=1;sun.shadow.camera.far=550;
 sun.shadow.bias=-.00013;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
 const rim=new THREE.DirectionalLight(0x2679f9,1.55);rim.position.set(60,-5,90);scene.add(rim);
 scene.add(makeStars(THREE));
 playerShip=makeShip(THREE,'crew');playerShip.scale.setScalar(1.1);scene.add(playerShip);
 const glowMat=new THREE.MeshBasicMaterial({color:0x30d7ff,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});
 for(let x of [-2.7,2.7]){
  const plume=new THREE.Mesh(new THREE.ConeGeometry(.37,3.7,28,3),glowMat.clone());
  plume.rotation.x=-Math.PI/2;plume.position.set(x,-.35,5.0);
  playerShip.add(plume);plume.userData.plume=true;
 }
 player={pos:new THREE.Vector3(),vel:new THREE.Vector3(),rot:new THREE.Quaternion(),hull:160,shield:120,energy:100,missiles:8,collisionRadius:5};
 orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.maxDistance=360;orbit.minDistance=7;orbit.enabled=false;
 document.querySelectorAll('[data-key]').forEach(button=>{
  button.addEventListener('pointerdown',e=>{keys.add(button.dataset.key);button.setPointerCapture(e.pointerId);e.preventDefault()});
  for(const t of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(t,()=>keys.delete(button.dataset.key))
 });
 document.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
  const code=e.code;if(['Space','ArrowUp','ArrowDown'].includes(code))e.preventDefault();
  if(!e.repeat){if(code==='KeyT')selectTarget();if(code==='KeyG')fireRailgun();if(code==='KeyM')fireMissile();if(code==='KeyC')switchCamera()}
  keys.add(code);
 });document.addEventListener('keyup',e=>keys.delete(e.code));
 $('d4-lock').onclick=selectTarget;$('d4-rail').onclick=fireRailgun;$('d4-missile').onclick=fireMissile;$('d4-cam').onclick=switchCamera;
 $('d4-quality').onchange=e=>setQuality(e.target.value);
 $('d4-sfx').onclick=()=>{muted=!muted;$('d4-sfx').textContent=muted?'Enable SFX':'Disable SFX';sfx('confirm')};
 for(const [id,m] of Object.entries(MAPS)){
  const b=document.createElement('button');b.textContent=m.title;b.onclick=()=>loadMap(id);b.id='d4-map-'+id;buttons.append(b)
 }
 new ResizeObserver(resize).observe(stage);setQuality('balanced');loadMap('earth');resize();animate();
 log('Hardware-rendered 3D ships and three orbital arenas initialized','ok')
}
function createEnemy(index,heavy=false){
 const style=heavy?'heavy':'interceptor',mesh=makeShip(THREE,heavy?'heavy':'interceptor');
 mesh.scale.setScalar(heavy?.86:.75);scene.add(mesh);
 const enemy={name:heavy?'Heavy interceptor '+(index+1):'Arasaka interceptor '+(index+1),mesh,vel:new THREE.Vector3(),hp:heavy?125:75,shield:heavy?80:45,radius:heavy?8:5,lastShot:state.time+Math.random()*3,dead:false};
 const offset=(index-1.5)*38;mesh.position.set(offset,((index%3)-1)*24,-85-index*38);
 if(currentMap==='cordon')mesh.position.set(30+offset,((index%3)-1)*22,-125-index*16);
 if(currentMap==='debris')mesh.position.set(offset*1.25,((index%3)-1)*21,-65-index*40);
 return enemy
}
function clearScene(){
 if(env){scene.remove(env);env.traverse(obj=>{if(obj.geometry)obj.geometry.dispose()});env=null}
 for(const t of targets){scene.remove(t.mesh);t.mesh.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
 targets.length=0;for(const p of projectiles){scene.remove(p.mesh);p.mesh.geometry?.dispose()}projectiles.length=0;
 for(const b of beamFX){scene.remove(b.mesh);b.mesh.geometry?.dispose()}beamFX.length=0;
 asteroidColliders=[];stationCollider=null;target=null;
}
function loadMap(id){
 clearScene();currentMap=id;state.lastMap=id;
 env=new THREE.Group();scene.add(env);
 const m=MAPS[id];
 player.pos.set(...m.spawn);player.vel.set(0,0,0);player.rot.identity();
 // Preserve ship condition while changing encounters; no free healing.
 playerShip.position.copy(player.pos);playerShip.quaternion.copy(player.rot);
 const earth=makeEarth(THREE);env.add(earth);
 if(id==='earth'){earth.position.set(-40,-215,-415);earth.rotation.z=.3}
 if(id==='debris'){earth.position.set(150,-360,-720);env.add(new THREE.PointLight(0x4f95ff,30,140,2));const field=makeAsteroids(THREE,7231);
  env.add(field.group);asteroidColliders=field.colliders}
 if(id==='cordon'){earth.position.set(130,-330,-650);const station=makePalace(THREE);station.position.set(24,1,-182);env.add(station);stationCollider={position:station.position.clone(),radius:31};
  const glow=new THREE.PointLight(0x39cbff,70,180,2);glow.position.set(24,0,-182);env.add(glow)}
 if(id==='earth'){
  const farPalace=makePalace(THREE);farPalace.scale.setScalar(.48);farPalace.position.set(200,40,-550);env.add(farPalace);
 }
 for(let i=0;i<m.enemies;i++)targets.push(createEnemy(i,i===m.enemies-1));
 $('d4-sector').textContent=m.title;$('d4-subtitle').textContent=m.subtitle;
 $('d4-description').textContent=m.description;
 document.querySelectorAll('#d4-mapbuttons button').forEach(b=>b.classList.toggle('selected',b.id==='d4-map-'+id));
 $('d4-targetbox').textContent='NO TARGET • PRESS T';
 toast(m.title);log('Sector loaded: '+m.title+'. Geometry and colliders rebuilt.','ok');
}
function setQuality(q){
 quality=q;const caps={low:1,balanced:1.5,ultra:2};
 const cap=caps[q]||1.5;dpr=CAPTURE_MODE?0.75:Math.min(devicePixelRatio||1,cap);
 if(renderer){renderer.shadowMap.enabled=!CAPTURE_MODE&&q!=='low';sun.shadow.mapSize.set(q==='ultra'?2048:1024,q==='ultra'?2048:1024);resize()}
}
function resize(){
 if(!renderer)return;const r=stage.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
 renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);
 camera.aspect=w/h;camera.updateProjectionMatrix();if(composer)composer.setSize(w,h);
 $('d4-res').textContent=Math.round(w*dpr)+' × '+Math.round(h*dpr)+' px • DPR '+dpr.toFixed(2);
}
function switchCamera(){
 cameraMode=cameraMode==='chase'?'free':'chase';orbit.enabled=cameraMode==='free';
 if(cameraMode==='free'){orbit.target.copy(player.pos);camera.position.copy(player.pos).add(new THREE.Vector3(24,14,35))}
 toast(cameraMode==='free'?'FREE ORBIT CAMERA':'CHASE CAMERA')
}
function selectTarget(){
 const inRange=targets.filter(t=>!t.dead);
 if(!inRange.length){toast('NO CONTACTS');return}
 const sorted=inRange.sort((a,b)=>a.mesh.position.distanceTo(player.pos)-b.mesh.position.distanceTo(player.pos));
 target=sorted[target?((sorted.indexOf(target)+1)%sorted.length):0];toast('TARGET: '+target.name.toUpperCase());sfx('confirm')
}
function sightBlocked(a,b){
 const direct=b.clone().sub(a),len=direct.length();
 if(len<.01)return false;
 const n=direct.divideScalar(len);
 for(const c of asteroidColliders){
  const v=c.position.clone().sub(a),along=clamp(v.dot(n),0,len);
  if(c.position.distanceToSquared(a.clone().addScaledVector(n,along))<c.radius*c.radius)return true;
 }
 if(stationCollider){
  const v=stationCollider.position.clone().sub(a),along=clamp(v.dot(n),0,len);
  if(stationCollider.position.distanceToSquared(a.clone().addScaledVector(n,along))<stationCollider.radius**2)return true
 }
 return false;
}
function targetSolution(minDot=.96,maxDist=350){
 if(!target||target.dead)return {ok:false,why:'SELECT TARGET'};
 const aim=new THREE.Vector3(0,0,-1).applyQuaternion(player.rot),vec=target.mesh.position.clone().sub(player.pos),dist=vec.length();
 if(dist>maxDist)return {ok:false,why:'TARGET OUT OF RANGE'};
 if(aim.dot(vec.normalize())<minDot)return {ok:false,why:'ALIGN RETICLE WITH TARGET'};
 if(sightBlocked(player.pos,target.mesh.position))return {ok:false,why:'ASTEROID OR STATION BLOCKS LOS'};
 return {ok:true,dist}
}
function drawBeam(from,to,color=0x31c9ff,size=.075){
 const dir=to.clone().sub(from),len=dir.length(),mesh=new THREE.Mesh(
  new THREE.CylinderGeometry(size,size,len,10),
  new THREE.MeshBasicMaterial({color,transparent:true,opacity:.96,blending:THREE.AdditiveBlending,depthWrite:false}));
 mesh.position.copy(from).add(to).multiplyScalar(.5);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
 scene.add(mesh);beamFX.push({mesh,life:.2,max:.2});
}
function damageEnemy(e,amount){
 if(e.dead)return;
 const shieldHit=Math.min(e.shield,amount);e.shield-=shieldHit;e.hp=Math.max(0,e.hp-(amount-shieldHit));
 if(e.hp<=0){e.dead=true;scene.remove(e.mesh);log(e.name+' DESTROYED','ok');toast('HOSTILE DISABLED')}
 else log(e.name+' takes '+amount+' damage ('+e.shield+' shields remain)','ok');
}
function damagePlayer(amount){
 if(player.hull<=0)return;
 const soak=Math.min(player.shield,amount);player.shield-=soak;player.hull=Math.max(0,player.hull-amount+soak);
 if(player.hull<=0){toast('HULL CRITICAL // RESTART SECTOR',true);log('SHIP DISABLED. Choose a sector to restart the sortie.','bad')}
 else if(amount>10)toast('INCOMING DAMAGE',true);
}
function fireRailgun(){
 if(state.time<canFireAt||player.hull<=0)return;
 canFireAt=state.time+.38;
 const sol=targetSolution(.95,420);
 const from=player.pos.clone().add(new THREE.Vector3(0,-.3,-5).applyQuaternion(player.rot));
 let impact=from.clone().addScaledVector(forwardAxis.clone().applyQuaternion(player.rot),420);
 if(sol.ok){
  impact.copy(target.mesh.position);damageEnemy(target,13+Math.floor(Math.random()*15));
 }else if(sol.why){toast(sol.why,true);log('Railgun: '+sol.why,'bad')}
 drawBeam(from,impact,0x37deff,.085);state.shots++;sfx('gun')
}
function fireMissile(){
 if(state.time<canMissileAt||player.missiles<=0||player.hull<=0)return;
 const sol=targetSolution(.76,450);
 if(!sol.ok){toast(sol.why,true);return}
 canMissileAt=state.time+2.5;player.missiles--;sfx('gun');
 const mesh=new THREE.Group();
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,1.8,20),new THREE.MeshStandardMaterial({color:0xcad7dc,metalness:.8,roughness:.2}));
 body.rotation.x=Math.PI/2;mesh.add(body);
 const fire=new THREE.Mesh(new THREE.ConeGeometry(.3,1.4,20),new THREE.MeshBasicMaterial({color:0xff873e,transparent:true,opacity:.7}));fire.rotation.x=-Math.PI/2;fire.position.z=1.25;mesh.add(fire);
 mesh.position.copy(player.pos).addScaledVector(rightAxis.clone().applyQuaternion(player.rot),(player.missiles%2?2.5:-2.5));
 mesh.quaternion.copy(player.rot);scene.add(mesh);projectiles.push({mesh,target,velocity:forwardAxis.clone().applyQuaternion(player.rot).multiplyScalar(98),ttl:8});
 log('Guided missile launched at '+target.name,'ok')
}
function fixedPhysics(dt){
 const turn=1.12,accel=39;const local=new THREE.Quaternion();
 const yaw=(keys.has('KeyA')?1:0)-(keys.has('KeyD')?1:0);
 const pitch=(keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0);
 const roll=(keys.has('KeyQ')?1:0)-(keys.has('KeyE')?1:0);
 if(yaw)player.rot.multiply(local.setFromAxisAngle(upAxis,yaw*turn*dt));
 if(pitch)player.rot.multiply(local.setFromAxisAngle(rightAxis,pitch*turn*dt));
 if(roll)player.rot.multiply(local.setFromAxisAngle(forwardAxis,roll*turn*dt));
 const fwd=forwardAxis.clone().applyQuaternion(player.rot),up=upAxis.clone().applyQuaternion(player.rot),right=rightAxis.clone().applyQuaternion(player.rot);
 const thrust=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?.75:0);
 const boost=keys.has('ShiftLeft')||keys.has('ShiftRight');
 const boostFactor=boost&&player.energy>1?2.3:1;
 if(boost&&thrust>0)player.energy=Math.max(0,player.energy-20*dt);else player.energy=Math.min(100,player.energy+9*dt);
 player.vel.addScaledVector(fwd,thrust*accel*boostFactor*dt);
 player.vel.addScaledVector(up,((keys.has('KeyR')?1:0)-(keys.has('KeyF')?1:0))*accel*.45*dt);
 player.vel.addScaledVector(right,((keys.has('KeyL')?1:0)-(keys.has('KeyJ')?1:0))*accel*.45*dt);
 if(keys.has('Space'))player.vel.multiplyScalar(Math.exp(-2.9*dt));else player.vel.multiplyScalar(Math.exp(-.036*dt));
 const maxSpeed=boost?215:155;if(player.vel.length()>maxSpeed)player.vel.setLength(maxSpeed);
 const before=player.pos.clone();player.pos.addScaledVector(player.vel,dt);
 if(collisionCooldown>0)collisionCooldown-=dt;
 if(collisionCooldown<=0){
  for(const rock of asteroidColliders){
   if(player.pos.distanceToSquared(rock.position)<(rock.radius+player.collisionRadius)**2){
    player.pos.copy(before);player.vel.multiplyScalar(-.45);collisionCooldown=1.3;state.collisions++;damagePlayer(12+Math.floor(Math.random()*20));
    toast('DEBRIS COLLISION',true);log('Collision: hull impulse and damage','bad');sfx('impact');break}
  }
  if(stationCollider&&Math.hypot(player.pos.x-stationCollider.position.x,player.pos.z-stationCollider.position.z)<stationCollider.radius+player.collisionRadius
     &&Math.abs(player.pos.y-stationCollider.position.y)<52){
    player.pos.copy(before);player.vel.multiplyScalar(-.4);collisionCooldown=1.5;state.collisions++;damagePlayer(25);
    toast('STATION STRUCTURE COLLISION',true);log('Physical station exclusion zone hit','bad');sfx('impact')
  }
 }
 if(player.pos.length()>1200){player.pos.setLength(1200);player.vel.multiplyScalar(.3)}
 playerShip.position.copy(player.pos);playerShip.quaternion.copy(player.rot);
 playerShip.children.filter(c=>c.userData.plume).forEach(p=>p.scale.z=1+Math.abs(thrust)*(boost?2.5:1.2));
 player.shield=Math.min(120,player.shield+1.35*dt);
 for(const e of targets){
  if(e.dead)continue;const to=player.pos.clone().sub(e.mesh.position),dist=to.length();
  if(dist>29){e.vel.addScaledVector(to.normalize(),dt*11);if(e.vel.length()>41)e.vel.setLength(41)}
  else e.vel.multiplyScalar(.97);
  e.mesh.position.addScaledVector(e.vel,dt);
  e.mesh.lookAt(player.pos);e.mesh.rotateY(Math.PI);
  if(dist<185&&state.time-e.lastShot>2.2&&player.hull>0){
   e.lastShot=state.time+Math.random()*.8;
   if(!sightBlocked(e.mesh.position,player.pos)){
    drawBeam(e.mesh.position,player.pos,0xff5361,.08);damagePlayer(6+Math.floor(Math.random()*9));sfx('impact')}
  }
 }
 for(let i=projectiles.length-1;i>=0;i--){
  const p=projectiles[i];p.ttl-=dt;
  if(!p.target.dead){
   const seek=p.target.mesh.position.clone().sub(p.mesh.position);
   if(seek.length()<4.5){damageEnemy(p.target,32);log('Missile impact on '+p.target.name,'ok');sfx('impact');p.ttl=0}
   else {p.velocity.lerp(seek.normalize().multiplyScalar(135),dt*3);p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),p.velocity.clone().normalize())}
  }
  p.mesh.position.addScaledVector(p.velocity,dt);
  if(p.ttl<=0){scene.remove(p.mesh);projectiles.splice(i,1)}
 }
 for(let i=beamFX.length-1;i>=0;i--){
  const b=beamFX[i];b.life-=dt;b.mesh.material.opacity=Math.max(0,b.life/b.max);
  if(b.life<=0){scene.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();beamFX.splice(i,1)}
 }
}
function cameraTick(dt){
 if(cameraMode==='free'){orbit.update();return}
 const offset=new THREE.Vector3(0,6.5,20).applyQuaternion(player.rot);
 const wanted=player.pos.clone().add(offset);
 camera.position.lerp(wanted,Math.min(1,dt*5));
 const focus=player.pos.clone().addScaledVector(forwardAxis.clone().applyQuaternion(player.rot),30);
 camera.lookAt(focus);
}
function radar(){
 const c=$('d4-radar'),ctx=c.getContext('2d'),w=c.width,h=c.height,cx=w/2,cy=h/2;
 ctx.clearRect(0,0,w,h);
 ctx.strokeStyle='#184f62';ctx.lineWidth=1;
 for(let r of [20,44,70]){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke()}
 ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();
 ctx.fillStyle='#59ebff';ctx.beginPath();ctx.moveTo(cx,cy-6);ctx.lineTo(cx-4,cy+5);ctx.lineTo(cx+4,cy+5);ctx.fill();
 const q=player.rot.clone().invert();
 for(const e of targets){
  if(e.dead)continue;
  const rel=e.mesh.position.clone().sub(player.pos).applyQuaternion(q);
  const xx=cx+clamp(rel.x*.26,-68,68),yy=cy+clamp(rel.z*.26,-68,68);
  ctx.fillStyle=e===target?'#ffe78a':'#ff536b';ctx.beginPath();ctx.arc(xx,yy,e===target?4:2.5,0,Math.PI*2);ctx.fill()
 }
}
function hud(fps){
 const ms=player.vel.length(),living=targets.filter(t=>!t.dead).length;
 const p=player.pos;
 shipInfo.innerHTML='SHIP <b>KESTREL-7</b> | SPEED <b>'+Math.round(ms)+' m/s</b><br>'+
 'HULL <b>'+Math.ceil(player.hull)+'/160</b> • SHIELD <b>'+Math.ceil(player.shield)+'/120</b><br>'+
 'MISSILES <b>'+player.missiles+'</b> • ENERGY <b>'+Math.floor(player.energy)+'%</b><br>'+
 'XYZ '+[p.x,p.y,p.z].map(n=>Math.round(n)).join(' / ');
 if(target&&!target.dead){
  const v=target.mesh.position.clone().sub(player.pos),distance=Math.round(v.length()),locked=targetSolution(.76,450);
  targetInfo.innerHTML='<b>'+target.name+'</b><br>RANGE '+distance+' m • HULL '+target.hp+' • SHIELD '+Math.floor(target.shield)+'<br>'+
  (locked.ok?'LOCK AVAILABLE':'LOCK: '+locked.why);
 }else targetInfo.textContent='NO TARGET • PRESS T';
 $('d4-fps').textContent='FPS '+Math.round(fps);
 $('d4-mapcount').textContent='CONTACTS '+living+'/'+targets.length;
}
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(.033,clock.getDelta());
 state.time+=dt;
 if(player.hull>0){const steps=Math.max(1,Math.ceil(dt/(1/90))),sub=dt/steps;for(let k=0;k<steps;k++)fixedPhysics(sub)}
 cameraTick(dt);if(CAPTURE_MODE)renderer.render(scene,camera);else composer.render();
 mapFrames++;if(state.time-lastHud>.25){hud(mapFrames/(state.time-lastHud));mapFrames=0;lastHud=state.time}
 if(state.time-lastRadar>.1){radar();lastRadar=state.time}
}
try{setup()}catch(e){$('d4-error').style.display='block';$('d4-error').textContent='3D renderer unavailable: '+e.message+' . Use a WebGL2-enabled browser with hardware acceleration.';console.error(e)}
