import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildPalaceSector,PALACE_SECTORS} from './palace-world.js';
import {makeEarth,makePalace,makeStars} from './orbital-assets.js';

const CAPTURE_MODE=new URLSearchParams(location.search).get('capture')==='1';
const root=document.querySelector('#palace-app');
root.innerHTML=`<style>
*{box-sizing:border-box}
body{color:#dfedf6;background:#08111a;font-family:ui-monospace,Menlo,monospace}
#cp-app{min-height:100vh;display:flex;flex-direction:column}
#cp-head{padding:13px 16px;background:#0e2030;border-bottom:1px solid #397283;display:flex;justify-content:space-between;flex-wrap:wrap;gap:9px;align-items:center}
#cp-head strong{font-size:17px}#cp-head small{display:block;color:#74d5e9;font-size:10px;letter-spacing:1px}
#cp-head a{color:#8be5ef;font-size:12px}
#cp-main{display:grid;grid-template-columns:minmax(0,1fr) 315px;flex:1}
#cp-stage{height:calc(100vh - 64px);min-height:420px;position:relative;overflow:hidden;background:#030914;touch-action:none}
#cp-stage canvas{display:block;width:100%;height:100%}
.cp-hud{position:absolute;pointer-events:none;color:#c4f4ff;font-size:11px}
#cp-left{left:12px;top:12px;max-width:62%;padding:12px;border:1px solid #3d8a9b;background:#071d2bdc;border-radius:8px}
#cp-left strong{display:block;font-size:16px;margin-bottom:4px}
#cp-right{right:12px;top:12px;text-align:right;padding:11px;border:1px solid #3d8a9b;background:#071d2bdc;border-radius:8px}
#cp-bottom{left:12px;bottom:12px;right:12px;padding:10px;border:1px solid #3d8a9b;background:#071d2be3;border-radius:8px;display:flex;gap:9px;justify-content:space-between}
#cp-side{background:#0d1f2d;border-left:1px solid #397283;padding:12px;max-height:calc(100vh - 64px);overflow:auto}
#cp-side h3{font-size:11px;letter-spacing:.9px;margin:16px 0 8px;color:#8cdbed}
#cp-side p{font-size:11px;color:#acc6cc;line-height:1.6}
#cp-side button,#cp-side select{border:1px solid #367488;border-radius:6px;background:#153648;color:#d8f4fc;padding:10px 8px;cursor:pointer;font:inherit;font-size:11px}
#cp-side button.selected{background:#1b637e;border-color:#9deaff}
#cp-side button:disabled{opacity:.4;cursor:not-allowed}
#cp-floors{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#cp-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#cp-actions button{min-height:42px}
#cp-log{height:136px;overflow-y:auto;background:#071521;border:1px solid #315464;padding:8px;font-size:10px;line-height:1.55}
#cp-rooms{display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:10px;color:#c0d6d9}
#cp-rooms span{padding:5px 7px;border:1px solid #375367;border-radius:4px}
#cp-touch{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}
#cp-touch button{touch-action:none;min-height:38px}
#cp-status{padding:10px;border-radius:7px;border:1px solid #3c6272;background:#10293b;font-size:11px;line-height:1.7}
#cp-error{display:none;color:#ffbbc9;background:#4c1f2d;padding:15px;font-size:13px}
#cp-toast{position:absolute;top:25%;left:50%;transform:translate(-50%,-50%);color:#c2fbff;text-align:center;font-weight:bold;text-shadow:0 0 12px #66daff;pointer-events:none;opacity:0;transition:opacity .2s}
@media(max-width:830px){#cp-main{display:flex;flex-direction:column}#cp-stage{height:58vh;min-height:340px}#cp-side{max-height:none;border-left:0;border-top:1px solid #397283}#cp-head strong{font-size:14px}#cp-left strong{font-size:12px}#cp-left,#cp-right,#cp-bottom{font-size:9px;padding:7px}}
</style>
<div id="cp-app">
<header id="cp-head"><div><strong>CRYSTAL PALACE // WORLD DIRECTOR 4.0</strong><small>MODELED 3D SECTORS • GRAPHICS TOOLKIT LAB</small></div><div><a href="./flight.html">Space combat</a> · <a href="./index.html">Tactical lab</a></div></header>
<div id="cp-error"></div>
<div id="cp-main">
<div id="cp-stage"><div id="cp-left" class="cp-hud"><strong id="cp-title">DOCKING CORE</strong><span id="cp-zone"></span><div id="cp-gravity"></div></div>
<div id="cp-right" class="cp-hud"><div id="cp-resolution">RES --</div><div id="cp-turn">ROUND 1</div><div id="cp-actions-left">ACTION READY</div></div>
<div id="cp-bottom" class="cp-hud"><div id="cp-hp">CREW HP 55/55</div><div id="cp-move">MOVE 8/8</div><div id="cp-sight">LOS --</div></div>
<div id="cp-toast"></div></div>
<aside id="cp-side">
<h3>CRYSTAL PALACE • TEN INTERCONNECTED SECTORS</h3><div id="cp-floors"></div>
<h3>TACTICAL MOVEMENT & INTERACTIONS</h3><div id="cp-actions">
<button id="cp-fire">F • Fire / Damage Cover</button><button id="cp-door">E • Open Door</button>
<button id="cp-end">End Round</button><button id="cp-camera">Follow Camera</button>
<button id="cp-alert">Toggle Alarm</button><button id="cp-debug">Show Colliders</button>
</div>
<div id="cp-touch"><span></span><button data-move="0,-1">▲</button><span></span><button data-move="-1,0">◀</button><button data-move="0,1">▼</button><button data-move="1,0">▶</button></div>
<p>Tap a point on the modeled floor to move. Drag to orbit the 3D camera; pinch to zoom. WASD moves the player. F shoots; E opens a nearby door. Cover blocks movement and gunfire. Destroyed cover stops blocking.</p>
<div id="cp-status">Loading map...</div>
<h3>ROOMS & CONNECTIONS</h3><div id="cp-rooms"></div>
<h3>RENDERING</h3><select id="cp-quality"><option value="mobile">Mobile</option><option value="balanced" selected>Balanced</option><option value="high">High detail</option></select>
<p>3D meshes, PBR-style materials, real elevations, area lights and spatial collision. This is an architectural prototype rather than a finished photorealistic game asset package.</p>
<h3>EVENT LOG</h3><div id="cp-log"></div>
</aside></div></div>`;
const $=id=>document.getElementById('cp-'+id),stage=$('stage'),floorNames=Object.keys(PALACE_SECTORS);
const keys=new Set();let renderer,scene,camera,controls,world,environment,avatar,enemy,
reflections,stars,earth,remotePalace,quality='balanced',alertOn=false,followCamera=false,debugOn=false;
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const state={floor:'CP-01',round:1,action:1,move:8,hp:55,max:55,security:0,shooting:0,enemyHP:42};
const lTmp=new THREE.Vector3(), targetPos=new THREE.Vector3();
let savedProgress=new Map(),movementGoal=null,lastMoveAt=0,lastFrame=0,frames=0,lastFPSAt=0,trackObjects=[];
function writeLog(t,level=''){const n=document.createElement('div');n.textContent='› '+t;n.style.color=level==='bad'?'#fa8594':level==='good'?'#8bf1b9':'#aacbd5';$('log').prepend(n)}
function toast(msg,bad=false){$('toast').textContent=msg;$('toast').style.color=bad?'#ff93a5':'#9eeeff';$('toast').style.opacity='1';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').style.opacity='0',1400)}
function body(x,z,mat){
 const g=new THREE.Group(),armor=new THREE.MeshStandardMaterial({color:mat,roughness:.25,metalness:.64,emissive:mat,emissiveIntensity:.15});
 const shell=new THREE.Mesh(new THREE.CapsuleGeometry(.42,1.06,6,16),armor);shell.position.y=1.1;g.add(shell);
 const chest=new THREE.Mesh(new THREE.BoxGeometry(.78,.48,.39),armor);chest.position.y=1.35;g.add(chest);
 const visor=new THREE.Mesh(new THREE.SphereGeometry(.22,20,12),new THREE.MeshStandardMaterial({color:0x113a47,emissive:0x16849d,emissiveIntensity:.4,metalness:.8,roughness:.18}));
 visor.position.set(0,1.92,-.27);g.add(visor);
 for(const s of [-1,1]){const arm=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,.8,12),armor);arm.position.set(s*.57,1.25,0);g.add(arm)}
 const halo=new THREE.Mesh(new THREE.RingGeometry(.51,.61,32),new THREE.MeshBasicMaterial({color:mat,side:THREE.DoubleSide,transparent:true,opacity:.75}));halo.position.y=.035;halo.rotation.x=-Math.PI/2;g.add(halo);
 g.position.set(x,0,z);return g;
}
function setup(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x08101b);
 camera=new THREE.PerspectiveCamera(52,1,.1,2500);
 camera.position.set(18,18,29);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.38;
 renderer.shadowMap.enabled=!CAPTURE_MODE;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.style.touchAction='none';stage.insertBefore(renderer.domElement,stage.firstChild);
 if(!CAPTURE_MODE){try{const p=new THREE.PMREMGenerator(renderer);reflections=p.fromScene(new RoomEnvironment(),.04);scene.environment=reflections.texture;p.dispose()}catch(e){writeLog('Reflection probe unavailable')}}
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=9;controls.maxDistance=100;
 controls.minPolarAngle=.13;controls.maxPolarAngle=Math.PI*.475;controls.target.set(0,0,0);
 scene.add(new THREE.HemisphereLight(0xaad5ff,0x171e30,2.0));
 const sun=new THREE.DirectionalLight(0xffe6cb,2.7);sun.position.set(-8,22,7);sun.castShadow=true;
 sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;
 sun.shadow.mapSize.set(1536,1536);sun.shadow.bias=-.00018;scene.add(sun);
 stars=makeStars(THREE);scene.add(stars);
 const ids=floorNames;
 for(let i=0;i<ids.length;i++){
  const id=ids[i],b=document.createElement('button');b.id='cp-btn-'+id;b.textContent=id+' '+PALACE_SECTORS[id].name;
  b.onclick=()=>loadFloor(id);$('floors').append(b)
 }
 for(const [id,fn] of [['fire',shoot],['door',openDoor],['end',endTurn],['camera',()=>{followCamera=!followCamera;toast(followCamera?'CAMERA FOLLOW':'CAMERA FREE')}],['alert',()=>{alertOn=!alertOn;state.security+=alertOn?1:0;toast(alertOn?'STATION ALARM ACTIVE':'ALARM DISABLED',alertOn)}],['debug',()=>{debugOn=!debugOn;updateDebug();toast(debugOn?'COLLIDERS VISIBLE':'COLLIDERS HIDDEN')}]])$(id).onclick=fn;
 $('quality').onchange=e=>{quality=e.target.value;resize()};
 document.querySelectorAll('[data-move]').forEach(button=>button.onclick=()=>{const [dx,dz]=button.dataset.move.split(',').map(Number);moveRequest(dx,dz)});
 document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
  const k=e.key.toLowerCase();if(['w','a','s','d'].includes(k)){e.preventDefault();moveRequest(k==='a'?-1:k==='d'?1:0,k==='w'?-1:k==='s'?1:0)}
  if(k==='f')shoot();if(k==='e')openDoor();
 });
 let pt=null;renderer.domElement.addEventListener('pointerdown',e=>{pt={x:e.clientX,y:e.clientY}});
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!pt)return;
  if(Math.hypot(e.clientX-pt.x,e.clientY-pt.y)<9){const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
   raycaster.setFromCamera(mouse,camera);
   const hit=raycaster.intersectObject(world.group,true)[0];
   if(hit){const obj=world.solids.find(s=>s.obj===hit.object);if(obj&&obj.active){window.d4Cover=obj;toast('SELECTED: '+obj.name);updateStatus()}
   else if(hit.point.y<.1&&hit.point.y>-.8){moveToward(hit.point.x,hit.point.z)}
  }}
  pt=null
 });
 new ResizeObserver(resize).observe(stage);
 loadFloor('CP-01');resize();requestAnimationFrame(loop);
 writeLog('Ten physical Crystal Palace floor scenes initialized','good');
}
function disposeWorld(){
 if(!world)return;
 scene.remove(world.group);
 world.group.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();
  if(obj.material){const mm=Array.isArray(obj.material)?obj.material:[obj.material];mm.forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}});
 if(avatar)scene.remove(avatar);
 if(enemy)scene.remove(enemy);
 if(earth)scene.remove(earth);
 if(remotePalace)scene.remove(remotePalace);
 world=null;
}
function loadFloor(id){
 if(!PALACE_SECTORS[id])return;
 if(world)savedProgress.set(state.floor,{pos:avatar.position.clone(),hp:state.hp,round:state.round});
 disposeWorld();
 state.floor=id;state.action=1;state.move=8;state.enemyHP=42;window.d4Cover=null;
 world=buildPalaceSector(THREE,id);scene.add(world.group);
 scene.background=new THREE.Color(world.background);
 avatar=body(-3,13,0x39cbf2);scene.add(avatar);
 enemy=body(12,-9,0xf15d71);scene.add(enemy);
 const saved=savedProgress.get(id);
 if(saved){avatar.position.copy(saved.pos);state.round=saved.round;state.hp=saved.hp}
 camera.position.set(18,19,32);controls.target.set(0,0,0);controls.update();
 $('title').textContent=id+' / '+world.def.name.toUpperCase();
 $('zone').textContent=world.def.zone;$('gravity').textContent='GRAVITY '+world.def.gravity;
 $('rooms').innerHTML='';
 world.def.rooms.forEach(r=>{const s=document.createElement('span');s.textContent=r;$('rooms').append(s)});
 for(let i=0;i<floorNames.length;i++)$('btn-'+floorNames[i]).classList.toggle('selected',floorNames[i]===id);
 if(id==='CP-10'||id==='CP-01'||id==='CP-03'){
  earth=makeEarth(THREE);earth.position.set(0,-185,-370);scene.add(earth)
 }
 if(id==='CP-10'){remotePalace=makePalace(THREE);remotePalace.position.set(0,0,-120);remotePalace.scale.setScalar(1.6);scene.add(remotePalace)}
 updateDebug();updateStatus();toast(world.def.name.toUpperCase());
 writeLog('Loaded '+id+': '+world.def.name+'. 3D architecture and cover registered.','good')
}
function blockedStep(x,z,fromX,fromZ){
 if(Math.abs(x)>22.05||Math.abs(z)>16.05)return true;
 const n=Math.max(1,Math.ceil(Math.hypot(x-fromX,z-fromZ)/.15));
 for(let i=1;i<=n;i++){
  const xx=fromX+(x-fromX)*i/n,zz=fromZ+(z-fromZ)*i/n;
  if(world.solids.some(s=>s.active&&xx>s.minX-.44&&xx<s.maxX+.44&&zz>s.minZ-.44&&zz<s.maxZ+.44))return true
 }return false
}
function moveToward(x,z){
 if(state.move<=0){toast('NO MOVEMENT LEFT',true);return}
 const from=avatar.position,vec=new THREE.Vector3(x-from.x,0,z-from.z),dist=vec.length();
 if(dist<.1)return;
 if(dist>state.move){vec.setLength(state.move);x=from.x+vec.x;z=from.z+vec.z}
 if(blockedStep(x,z,from.x,from.z)){toast('MOVEMENT BLOCKED BY 3D COLLIDER',true);writeLog('Move rejected: physical obstacle','bad');return}
 const spent=Math.ceil(Math.hypot(x-from.x,z-from.z));state.move=Math.max(0,state.move-spent);movementGoal=new THREE.Vector3(x,0,z);
 writeLog('Move '+spent+'m through navigable 3D floor');updateStatus();
}
function moveRequest(dx,dz){moveToward(avatar.position.x+dx*1.6,avatar.position.z+dz*1.6)}
function rayShot(){
 const start=avatar.position.clone().add(new THREE.Vector3(0,1.48,0));
 const end=enemy.position.clone().add(new THREE.Vector3(0,1.4,0));
 const delta=end.clone().sub(start),max=delta.length(),ray=new THREE.Raycaster(start,delta.normalize(),.08,max-.12);
 const obstacles=world.solids.filter(o=>o.active);
 let hit=null,hitDist=Infinity;
 for(const o of obstacles){
  const intersections=ray.intersectObject(o.obj,false);
  if(intersections.length&&intersections[0].distance<hitDist){hit=o;hitDist=intersections[0].distance}
 }
 return {hit,start,end,length:max,clear:!hit};
}
function shoot(){
 if(state.action<1){toast('ACTION ALREADY SPENT',true);return}
 if(state.enemyHP<=0){toast('NO ACTIVE HOSTILE');return}
 const r=rayShot();
 if(r.length>36){toast('TARGET OUT OF RANGE',true);return}
 state.action=0;state.shooting+=1;
 if(r.hit){
  const s=r.hit;
  if(s.hp>0){
   s.hp=Math.max(0,s.hp-12);toast('COVER ABSORBED THE SHOT',true);
   writeLog('Shot hits '+s.name+' for 12 damage. Cover '+s.hp+'/'+s.maxHP,'bad');
   if(s.hp===0){s.active=false;s.obj.visible=false;
    writeLog('COVER DESTROYED. LOS & movement automatically updated.','good')}
  }else{toast('SOLID BULKHEAD BLOCKS FIRE',true);writeLog('Ballistics rejected: '+s.name,'bad')}
 }else{
  state.enemyHP=Math.max(0,state.enemyHP-15);toast('HOSTILE HIT: 15');writeLog('Hostile takes 15 direct HP. '+state.enemyHP+' remains','good');
  if(state.enemyHP<=0)enemy.visible=false
 }
 updateDebug();updateStatus();
}
function openDoor(){
 if(state.action<1){toast('ACTION ALREADY USED',true);return}
 const doors=world.doors.filter(s=>s.active).sort((a,b)=>Math.hypot(a.x-avatar.position.x,a.z-avatar.position.z)-Math.hypot(b.x-avatar.position.x,b.z-avatar.position.z));
 const door=doors[0];if(!door||Math.hypot(door.x-avatar.position.x,door.z-avatar.position.z)>3.4){toast('NO DOOR WITHIN REACH',true);return}
 state.action=0;door.active=false;door.obj.visible=false;
 writeLog('Bulkhead unlocked. Collider and obstruction removed.','good');toast('DOOR OPENED');updateDebug();updateStatus()
}
function endTurn(){
 state.round++;state.action=1;state.move=8;
 const offset=avatar.position.clone().sub(enemy.position),d=offset.length();
 if(state.enemyHP>0&&d>4){
  offset.normalize().multiplyScalar(1.5);const x=enemy.position.x+offset.x,z=enemy.position.z+offset.z;
  if(!blockedStep(x,z,enemy.position.x,enemy.position.z))enemy.position.set(x,0,z)
 }
 if(state.enemyHP>0&&d<14&&rayShot().clear){state.hp=Math.max(0,state.hp-4);
  writeLog('Security guard returns fire: 4 HP damage','bad');if(state.hp===0)toast('CREW INCAPACITATED',true)}
 else if(state.enemyHP>0)writeLog('Guard cannot get a clear firing line');
 updateStatus()
}
let debugMeshes=[];
function updateDebug(){
 debugMeshes.forEach(m=>{scene.remove(m);m.geometry.dispose();m.material.dispose()});debugMeshes=[];
 if(!debugOn)return;
 for(const s of world.solids.filter(s=>s.active)){
  const g=new THREE.BoxGeometry(s.w,.035,s.d),mat=new THREE.MeshBasicMaterial({color:s.isDoor?0xffc74c:s.hp?0xff536e:0x52daf7,transparent:true,opacity:.25,depthWrite:false});
  const m=new THREE.Mesh(g,mat);m.position.set(s.x,.055,s.z);scene.add(m);debugMeshes.push(m)
 }
}
function updateStatus(){
 if(!world)return;
 const r=rayShot(),colliders=world.solids.filter(s=>s.active).length,active=state.enemyHP>0;
 $('status').innerHTML='ACTIVE: '+world.def.name+'<br>PLAYABLE OBJECTS '+colliders+
 '<br>POSITION '+avatar.position.x.toFixed(1)+','+avatar.position.z.toFixed(1)+
 '<br>SELECTED '+(window.d4Cover?.name||'none')+
 '<br>GRAVITY '+world.def.gravity+'<br>ALARM '+(alertOn?'ACTIVE':'OFF');
 $('turn').textContent='ROUND '+state.round+' • '+(alertOn?'ALARM':'STEALTH');
 $('actions-left').textContent=state.action?'ACTION READY':'ACTION SPENT';
 $('hp').textContent='CREW HP '+state.hp+'/'+state.max;
 $('move').textContent='MOVE '+state.move+'/8';
 $('sight').textContent=active?'SIGHTLINE '+(r.clear?'CLEAR':'BLOCKED BY '+r.hit.name):'HOSTILE DISABLED'
}
function resize(){
 if(!renderer)return;
 const rect=stage.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
 let density=quality==='high'?2:quality==='mobile'?1:1.45;
 const dpr=CAPTURE_MODE?.72:Math.min(window.devicePixelRatio||1,density);
 renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);
 renderer.shadowMap.enabled=!CAPTURE_MODE&&quality!=='mobile';
 camera.aspect=w/h;camera.updateProjectionMatrix();
 $('resolution').textContent=Math.round(w*dpr)+' × '+Math.round(h*dpr)+' • DPR '+dpr.toFixed(1)
}
let last=0;
function loop(now){
 requestAnimationFrame(loop);
 const dt=Math.min(.05,(now-last)/1000||.016);last=now;
 if(movementGoal){
  avatar.position.lerp(movementGoal,Math.min(1,dt*7));
  if(avatar.position.distanceTo(movementGoal)<.06){avatar.position.copy(movementGoal);movementGoal=null;updateStatus()}
 }
 if(followCamera){const target=avatar.position.clone().add(new THREE.Vector3(0,.5,0));controls.target.lerp(target,Math.min(1,dt*2.4))}
 if(world){world.lights.forEach((l,i)=>l.intensity=15+(Math.sin(now*.0018+i*2)*3)+((alertOn&&i%2===0)?5:0))}
 if(remotePalace)remotePalace.rotation.y+=dt*.018;
 controls.update();renderer.render(scene,camera);
}
try{setup()}catch(err){$('error').style.display='block';$('error').textContent='WebGL scene could not start: '+err.message+' . A hardware-accelerated browser is required.';console.error(err)}
