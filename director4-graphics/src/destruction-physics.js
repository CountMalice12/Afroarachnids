import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import RAPIER from '@dimforge/rapier3d-compat';

/**
 * Shared 3D destruction authority for scene props.
 * The Rapier body and Director collision record are invalidated together.
 * Debris is simulated by Rapier rigid bodies, not by hiding damaged cover.
 */
let rapierReady;
export async function prepareDestructionPhysics(){
 rapierReady ||= RAPIER.init();
 await rapierReady;
 return true;
}

export function createDestructionPhysics({scene,gravity=-8.0,onDestroyed=()=>{},onImpact=()=>{},onExplosion=()=>{},maxFragments=190}={}){
 if(!rapierReady)throw new Error('Call prepareDestructionPhysics before creating the scene world');
 const world=new RAPIER.World({x:0,y:gravity,z:0});
 const originalGravity=gravity;
 let currentGravity=gravity;
 const staticBody=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.67,0));
 const floor=world.createCollider(RAPIER.ColliderDesc.cuboid(25,.48,18).setFriction(.9),staticBody);
 const active=new Map(),fragments=[];
 const fragmentMats=[
  new THREE.MeshPhysicalMaterial({color:0x526d83,metalness:.9,roughness:.31,clearcoat:.15}),
  new THREE.MeshPhysicalMaterial({color:0x172a39,metalness:.76,roughness:.54,clearcoat:.1}),
  new THREE.MeshPhysicalMaterial({color:0xaa9778,metalness:.88,roughness:.3,clearcoat:.18})
 ];
 const scorchMat=new THREE.MeshBasicMaterial({color:0x121015,transparent:true,opacity:.53,depthWrite:false});
 const rand=(seed)=>{let s=seed>>>0;return ()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296)};
 const fixedDt=1/60;
 let accumulated=0,seed=27,stepCount=0;
 function clearBodies(){
  for(const item of active.values())if(item.body)world.removeRigidBody(item.body);
  active.clear();
  for(const f of fragments){scene.remove(f.mesh);f.mesh.geometry.dispose();world.removeRigidBody(f.body)}
  fragments.length=0;
 }
 function register(record){
  if(!record || !record.active || record.hp<=0 || !record.obj)return;
  const center=new THREE.Vector3(record.x,0.78,record.z);
  // Static rigid body represents the real cover footprint.
  const body=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(center.x,center.y,center.z));
  world.createCollider(RAPIER.ColliderDesc.cuboid(Math.max(.1,record.w*.5),.68,Math.max(.1,record.d*.5)).setFriction(.75),body);
  active.set(record,{body});
  return body;
 }
 function registerScene(records){
  clearBodies();for(const r of records)register(r)
 }
 function destroyCover(record,{point=null,impulse=18}={}){
  if(!record?.active)return false;
  record.hp=0;record.active=false;
  if(record.obj)record.obj.visible=false;
  const state=active.get(record);
  if(state?.body)world.removeRigidBody(state.body);
  active.delete(record);
  const rng=rand(++seed*131+Math.abs(Math.round(record.x*37+record.z*57)));
  const center=new THREE.Vector3(record.x,record.y??.78,record.z);
  const hit=point instanceof THREE.Vector3?point:center;
  const n=Math.min(16,maxFragments-fragments.length);
  for(let i=0;i<n;i++){
   const w=.16+rng()*.42,h=.055+rng()*.13,d=.15+rng()*.55;
   // Hard-surface steel splinters and plate fragments have bevels and physically
   // matched cuboid hulls, unlike fake low-poly tetrahedral confetti.
   const geometry=new RoundedBoxGeometry(w,h,d,2,.018);
   const m=new THREE.Mesh(geometry,fragmentMats[i%fragmentMats.length]);
   m.castShadow=true;m.receiveShadow=true;
   const cx=record.x+(rng()-.5)*record.w*.85,cy=(record.y??.53)+rng()*.65,cz=record.z+(rng()-.5)*record.d*.85;
   const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(cx,cy,cz)
      .setLinearDamping(currentGravity===0?.018:.18).setAngularDamping(.34).setCcdEnabled(true));
   world.createCollider(RAPIER.ColliderDesc.cuboid(w*.5,h*.5,d*.5).setDensity(.8).setFriction(.72).setRestitution(.24),body);
   const direction=new THREE.Vector3(cx-hit.x+(rng()-.5)*.4,(rng()*.9)+.2,cz-hit.z+(rng()-.5)*.4).normalize();
   body.applyImpulse({x:direction.x*(impulse/Math.max(n,1))*(.5+rng()),
                      y:direction.y*(impulse/Math.max(n,1))*(.5+rng()),
                      z:direction.z*(impulse/Math.max(n,1))*(.5+rng())},true);
   body.applyTorqueImpulse({x:(rng()-.5)*.7,y:(rng()-.5)*.7,z:(rng()-.5)*.7},true);
   scene.add(m);fragments.push({mesh:m,body,age:0,lifetime:currentGravity===0?15:9});
  }
  const stain=new THREE.Mesh(new THREE.CircleGeometry(Math.max(.45,Math.min(record.w,record.d)*.7),28),scorchMat);
  stain.position.set(record.x,.083,record.z);stain.rotation.x=-Math.PI/2;scene.add(stain);
  onDestroyed(record,{position:center,fragments:n,point:hit,stain});
  return true;
 }
 function damage(record,amount,{point=null,impulse=18}={}){
  if(!record?.active)return {hit:false,destroyed:false};
  if(!(record.maxHP>0))return {hit:true,invulnerable:true,destroyed:false};
  record.hp=Math.max(0,record.hp-Math.max(0,amount));
  const hitPoint=point||new THREE.Vector3(record.x,1,record.z);
  onImpact(hitPoint,{record,amount});
  if(record.hp>0)return {hit:true,destroyed:false,hp:record.hp};
  const destroyed=destroyCover(record,{point:hitPoint,impulse});
  return {hit:true,destroyed,hp:0};
 }
 function explosion(at,radius=5,damageAmount=45,impulse=75,records=[]){
  const p=at instanceof THREE.Vector3?at:new THREE.Vector3(...at);
  let destroyed=0,hit=0;
  for(const r of records){
   if(!r.active || r.hp<=0)continue;
   const dist=Math.hypot(p.x-r.x,p.z-r.z);
   if(dist>radius+Math.max(r.w,r.d)*.5)continue;
   const damageValue=Math.ceil(damageAmount*Math.max(.25,1-dist/(radius+1)));
   const result=damage(r,damageValue,{point:p,impulse});
   hit++;if(result.destroyed)destroyed++;
  }
  for(const f of fragments){
   const b=f.body;
   const v=new THREE.Vector3(b.translation().x,b.translation().y,b.translation().z).sub(p);
   const dist=v.length();if(dist<.01||dist>radius*1.5)continue;
   const force=v.normalize().multiplyScalar(impulse/(1+dist*dist*.2));
   b.applyImpulse({x:force.x,y:force.y+.4,z:force.z},true);
  }
  onExplosion(p,{radius,damage:damageAmount,hit,destroyed});
  return {hit,destroyed};
 }
 function setGravity(g){currentGravity=g;world.gravity={x:0,y:g,z:0}}
 function tick(delta){
  const dt=Math.min(.05,Math.max(0,delta));
  accumulated+=dt;let steps=0;
  while(accumulated>=fixedDt&&steps<3){world.step();accumulated-=fixedDt;steps++;stepCount++}
  for(let i=fragments.length-1;i>=0;i--){
   const f=fragments[i];f.age+=dt;
   if(f.age>f.lifetime){
     scene.remove(f.mesh);f.mesh.geometry.dispose();world.removeRigidBody(f.body);
     fragments.splice(i,1);continue
   }
   const t=f.body.translation(),q=f.body.rotation();
   f.mesh.position.set(t.x,t.y,t.z);f.mesh.quaternion.set(q.x,q.y,q.z,q.w);
   if(f.mesh.position.y<-.7 && currentGravity<0)f.body.setLinvel({x:0,y:0,z:0},true);
  }
 }
 function metrics(){return {activeCover:active.size,debris:fragments.length,steps:stepCount,gravity:currentGravity}}
 function dispose(){clearBodies();world.free()}
 return {world,register,registerScene,destroyCover,damage,explosion,setGravity,tick,metrics,dispose};
}
