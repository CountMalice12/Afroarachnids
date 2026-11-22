import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing';
import RAPIER from '@dimforge/rapier3d-compat';
import { directorBridge } from './director-bridge.js';

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

const root = document.querySelector('#app');
root.innerHTML = `<style>
*{box-sizing:border-box}body{overflow-x:hidden}header{background:#0d1d2a;border-bottom:1px solid #264657;padding:12px 16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}h1{font-size:17px;letter-spacing:.08em;margin:0}header span{font-size:11px;color:#70d9ef}#layout{display:grid;grid-template-columns:minmax(0,1fr) 288px;min-height:calc(100vh - 55px)}#viewport{position:relative;height:calc(100vh - 55px);min-height:360px;overflow:hidden;background:#060b15}#viewport canvas{display:block;width:100%;height:100%}aside{padding:16px;background:#0b1928;border-left:1px solid #264657}p{font-size:12px;color:#9ac2d1;line-height:1.55}button{background:#18384a;color:#c9f5ff;padding:10px;border:1px solid #36899c;border-radius:6px;cursor:pointer;font-family:inherit}button:hover{background:#255064}.row{display:flex;gap:6px;flex-wrap:wrap}.row button{flex:1 0 80px}.metric{background:#122637;padding:10px;border-radius:6px;border:1px solid #335364;margin:8px 0;font-size:12px}#hud{position:absolute;bottom:12px;left:12px;right:12px;background:#0a1923c8;border:1px solid #356b7d;border-radius:8px;padding:8px;display:flex;gap:8px;justify-content:space-between;font-size:11px;pointer-events:none}#log{height:142px;overflow:auto;border:1px solid #305064;background:#06121e;padding:10px;font-size:11px;line-height:1.5}.ok{color:#8dedbd}.blocked{color:#ff7f94}@media(max-width:760px){#layout{display:flex;flex-direction:column}#viewport{height:52vh;min-height:300px}aside{border-left:0;border-top:1px solid #264657}}</style>
<header><h1>GHOSTS // DIRECTOR 4.0 <span>3D GRAPHICS LAB</span></h1><span>ISOLATED TEST • NOT THE LIVE WEBSITE</span></header>
<div id="layout"><div id="viewport"><div id="hud"><span id="mode">TACTICAL // CRYSTAL PALACE</span><span id="res">RENDERER INITIALIZING</span></div></div>
<aside><b>3D CONTROLS</b><p>Drag to rotate; pinch or wheel to zoom. Move using WASD or buttons. The crate blocks both travel and firing lines.</p>
<div class="row"><button id="tactical">Casino</button><button id="flight">Flight</button><button id="shot">Fire LOS test</button></div>
<div class="row" style="margin-top:8px"><button data-move="0,-1">↑</button><button data-move="-1,0">←</button><button data-move="0,1">↓</button><button data-move="1,0">→</button></div>
<div class="metric" id="state">Initializing geometry…</div><b>DIRECTOR EVENT LOG</b><div id="log"></div>
<p>GLB/texture import points, collision proxies, native action-budget adapter and performance checklist are described in the README.</p>
</aside></div>`;
const logEl=document.querySelector('#log');
function log(message, type=''){const p=document.createElement('div');p.textContent='> '+message;p.className=type;logEl.prepend(p)}
const host=document.querySelector('#viewport');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x091421);
scene.fog=new THREE.FogExp2(0x091421,0.008);
const camera=new THREE.PerspectiveCamera(50,1,0.15,500);
camera.position.set(13,16,21);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.35;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
host.insertBefore(renderer.domElement,host.firstChild);
const orbit=new OrbitControls(camera,renderer.domElement);
orbit.enableDamping=true;orbit.maxPolarAngle=Math.PI*.49;
orbit.target.set(0,0,0);
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
composer.addPass(new EffectPass(camera,new BloomEffect({intensity:0.4,luminanceThreshold:0.65})));
const hemi=new THREE.HemisphereLight(0xaad8ff,0x182131,2);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffd8ae,3);
sun.position.set(8,18,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;
scene.add(sun);
const pink=new THREE.PointLight(0xc32fff,90,26,2);pink.position.set(-4,4,0);scene.add(pink);
const blue=new THREE.PointLight(0x1dccff,75,25,2);blue.position.set(4,4,-4);scene.add(blue);

const mat={
floor:new THREE.MeshStandardMaterial({color:0x354154,roughness:.24,metalness:.43}),
gold:new THREE.MeshStandardMaterial({color:0xe1ad56,roughness:.24,metalness:1}),
wall:new THREE.MeshStandardMaterial({color:0x283543,roughness:.61,metalness:.63}),
crate:new THREE.MeshStandardMaterial({color:0x53687c,roughness:.48,metalness:.76}),
glass:new THREE.MeshPhysicalMaterial({color:0x6eb4df,roughness:.09,metalness:.12,transmission:.58,thickness:.35,transparent:true,opacity:.58}),
crystal:new THREE.MeshPhysicalMaterial({color:0xdb6bff,emissive:0xa313e5,emissiveIntensity:1.3,roughness:.08,metalness:.2,transmission:.2}),
crew:new THREE.MeshStandardMaterial({color:0x00c9ff,roughness:.3,metalness:.6,emissive:0x003d57}),
enemy:new THREE.MeshStandardMaterial({color:0xe84d68,roughness:.4,metalness:.5,emissive:0x4b0813})
};
function addBox(parent,x,y,z,w,h,d,material){const g=new THREE.BoxGeometry(w,h,d);g.computeBoundsTree();const mesh=new THREE.Mesh(g,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
const interior=new THREE.Group();scene.add(interior);
const occluders=[],collisionBoxes=[];
let physics;
function solid(x,y,z,w,h,d,material=mat.wall,destructible=false){
 const mesh=addBox(interior,x,y,z,w,h,d,material);
 occluders.push(mesh);
 collisionBoxes.push({mesh,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,destructible});
 if(physics){const b=physics.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));
 physics.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b)}
 return mesh
}
const floor=addBox(interior,0,-.16,0,30,.30,22,mat.floor);floor.receiveShadow=true;
for(let x=-14;x<=14;x+=2){const line=addBox(interior,x,.008,0,.015,.015,21,mat.gold);line.castShadow=false}
for(let z=-10;z<=10;z+=2){const line=addBox(interior,0,.009,z,29,.015,.015,mat.gold);line.castShadow=false}
for(let x of [-14.5,14.5]){solid(x,2.7,0,.6,5.4,22);for(let z=-8;z<=8;z+=4){addBox(interior,x,4,z,1,.09,3,mat.gold)}}
for(let z of [-10.5,10.5])solid(0,2.6,z,29,5.2,.6);
const ring=new THREE.Mesh(new THREE.TorusGeometry(3,0.17,12,100),mat.gold);ring.rotation.x=Math.PI/2;ring.position.set(0,.08,0);interior.add(ring);
const pool=new THREE.Mesh(new THREE.CylinderGeometry(2.8,2.8,.28,72),mat.glass);pool.position.y=.15;interior.add(pool);
for(let i=0;i<9;i++){
 const ang=i*2.399,rad=.25+(i%3)*.44;
 const crystal=new THREE.Mesh(new THREE.ConeGeometry(.22+(i%2)*.15,1.2+(i%4)*.6,5),mat.crystal);
 crystal.position.set(Math.cos(ang)*rad,.8+(i%4)*.2,Math.sin(ang)*rad);crystal.castShadow=true;interior.add(crystal)
}
solid(0,.75,5,2,1.5,2,mat.crate,true);
for(const [x,z] of [[-8,6],[8,6],[-9,-5],[9,-5]]){addBox(interior,x,.48,z,2.5,.8,1.3,mat.gold);addBox(interior,x,.94,z,2.25,.16,1.13,mat.crate)}
for(let i=0;i<6;i++){const x=-10+i*4;addBox(interior,x,3.2,-9,.25,5.5,.25,mat.gold)}
const player=new THREE.Group();const avatar=new THREE.Mesh(new THREE.CapsuleGeometry(.4,1.1,6,12),mat.crew);avatar.position.y=1.05;avatar.castShadow=true;player.add(avatar);
const light=new THREE.PointLight(0x21dfff,8,4);light.position.set(0,1.6,0);player.add(light);interior.add(player);
player.position.set(0,0,8);
const hostile=new THREE.Mesh(new THREE.CapsuleGeometry(.42,1.1,6,12),mat.enemy);hostile.position.set(0,1.1,-7);hostile.castShadow=true;interior.add(hostile);
const space=new THREE.Group();space.visible=false;scene.add(space);
const stars=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({size:.7,color:0xffffff}));
const arr=[];for(let i=0;i<1800;i++)arr.push((Math.random()-.5)*250,(Math.random()-.5)*180,(Math.random()-.5)*250);
stars.geometry.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));space.add(stars);
const earth=new THREE.Mesh(new THREE.SphereGeometry(37,64,32),new THREE.MeshStandardMaterial({color:0x2862a4,roughness:1,emissive:0x091f37}));earth.position.set(0,-47,-90);space.add(earth);
const palace=new THREE.Group();space.add(palace);palace.position.set(0,0,-22);
for(let i=-2;i<=2;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(6.5,0.54,12,96),mat.glass);r.position.y=i*3.4;r.rotation.x=Math.PI/2;r.castShadow=true;palace.add(r)}
const spine=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,22,18),mat.gold);palace.add(spine);
const ship=new THREE.Group();space.add(ship);
addBox(ship,0,0,0,2.6,.9,5,mat.crate);
for(let x of [-2.4,2.4])addBox(ship,x,0,.1,2.7,.15,1.8,mat.gold);
for(let x of [-.8,.8]){const e=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,1.2,16),mat.crystal);e.rotation.x=Math.PI/2;e.position.set(x,-.1,2.6);ship.add(e)}
ship.position.set(0,-3,8);
let mode='tactical';
const bridge=directorBridge({scene,canMove,clearLineOfSight});
function canMove(from,to){
 const dx=to.x-from.x,dz=to.z-from.z,steps=Math.ceil(Math.hypot(dx,dz)/.15);
 for(let i=1;i<=steps;i++){
  const x=from.x+(dx*i/steps),z=from.z+(dz*i/steps);
  if(collisionBoxes.some(c=>x>c.minX-.43&&x<c.maxX+.43&&z>c.minZ-.43&&z<c.maxZ+.43))return false;
 }
 return true
}
function clearLineOfSight(from,to){
 const start=new THREE.Vector3(from.x,1.55,from.z),end=new THREE.Vector3(to.x,1.5,to.z);
 const ray=new THREE.Raycaster(start,end.clone().sub(start).normalize(),.01,start.distanceTo(end)-.1);
 return ray.intersectObjects(occluders,false).length===0
}
function move(dx,dz){if(mode!=='tactical'){ship.position.x+=dx*.65;ship.position.y-=dz*.65;updateState();return}
 const from={x:player.position.x,z:player.position.z},to={x:from.x+dx,z:from.z+dz};
 if(bridge.previewMove(from,to).allowed){player.position.set(to.x,0,to.z);log('Movement accepted. New position '+to.x+', '+to.z,'ok')}
 else log('Blocked by registered 3D collision geometry','blocked');
 updateState()}
function updateState(){
 const isClear=bridge.previewShot({x:player.position.x,z:player.position.z},{x:hostile.position.x,z:hostile.position.z}).clear;
 document.querySelector('#state').textContent=mode==='tactical'?
 'CREW ['+player.position.x.toFixed(1)+', '+player.position.z.toFixed(1)+'] | LOS '+(isClear?'CLEAR':'BLOCKED'):
 'FLIGHT PREVIEW | SHIP ['+ship.position.x.toFixed(1)+', '+ship.position.y.toFixed(1)+', '+ship.position.z.toFixed(1)+']';
}
function switchMode(next){mode=next;interior.visible=next==='tactical';space.visible=next==='flight';
 camera.position.set(next==='flight'?17:13,next==='flight'?11:16,next==='flight'?29:21);
 orbit.target.set(0,0,next==='flight'?-13:0);orbit.update();
 document.querySelector('#mode').textContent=next==='flight'?'FLIGHT // ORBITAL PREVIEW':'TACTICAL // CRYSTAL PALACE';
 updateState();log('Switched to '+next+' (same renderer and viewport resolution)','ok')}
document.querySelector('#tactical').onclick=()=>switchMode('tactical');
document.querySelector('#flight').onclick=()=>switchMode('flight');
document.querySelector('#shot').onclick=()=>{
 if(mode!=='tactical'){log('Fire a LOS test in tactical mode','blocked');return}
 const ok=bridge.previewShot({x:player.position.x,z:player.position.z},{x:hostile.position.x,z:hostile.position.z}).clear;
 log(ok?'SIGHTLINE CLEAR. Native Director would still resolve weapon + action.':'SHOT BLOCKED. Physical 3D cover obstructs target.',ok?'ok':'blocked')};
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const [dx,dz]=b.dataset.move.split(',').map(Number);move(dx,dz)});
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d'].includes(k)){if(e.target.closest('input,textarea'))return;e.preventDefault();move(k==='a'?-1:k==='d'?1:0,k==='w'?-1:k==='s'?1:0)}});
function resize(){const rect=host.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
 const dpr=Math.min(window.devicePixelRatio||1,2);renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();composer.setSize(w,h);
 document.querySelector('#res').textContent=Math.round(w*dpr)+' × '+Math.round(h*dpr)+' / DPR '+dpr.toFixed(1)}
new ResizeObserver(resize).observe(host);resize();updateState();
try{await RAPIER.init();physics=new RAPIER.World({x:0,y:-9.81,z:0});
 collisionBoxes.forEach(c=>{const b=physics.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(c.mesh.position.x,c.mesh.position.y,c.mesh.position.z));
 const p=new THREE.Vector3();new THREE.Box3().setFromObject(c.mesh).getSize(p);physics.createCollider(RAPIER.ColliderDesc.cuboid(p.x/2,p.y/2,p.z/2),b)});
 log('Rapier registered '+collisionBoxes.length+' static colliders','ok')}catch(e){log('Physics module unavailable: LOS/movement proxy checks remain active. '+String(e),'blocked')}
const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();pink.intensity=85+Math.sin(t*1.7)*17;blue.intensity=75+Math.sin(t*1.1)*9;palace.rotation.y=t*.014;
 if(mode==='flight'){ship.rotation.z=Math.sin(t)*.05;ship.position.z=8+Math.sin(t*.6)*.35}
 orbit.update();composer.render()}
animate();log('Scene created; use controls to exercise physical cover and resolution','ok');
