import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Original high-detail tactical character art for the Director 4.0 prototype.
 * Articulated scene hierarchy, authored armor shapes and role-specific details.
 * These are not motion-captured/photogrammetric human scans or production rigs.
 */
const makeMat=(c,metalness=.65,roughness=.4,emissive=0,emissiveIntensity=0)=>
 new THREE.MeshPhysicalMaterial({color:c,metalness,roughness,clearcoat:.34,clearcoatRoughness:.16,emissive,emissiveIntensity});
function cuboid(group,at,size,material,bevel=.055,rotation=null){
 const [w,h,d]=size;const o=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(bevel,w/4,h/4,d/4)),material);
 o.position.set(...at);if(rotation)o.rotation.set(...rotation);o.castShadow=true;o.receiveShadow=true;group.add(o);return o
}
function capsule(group,at,r,h,material){
 const o=new THREE.Mesh(new THREE.CapsuleGeometry(r,h,8,16),material);o.position.set(...at);o.castShadow=true;group.add(o);return o
}
function rod(group,a,b,r,material){
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,A.distanceTo(B),12),material);
 m.position.copy(A).add(B).multiplyScalar(.5);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());
 m.castShadow=true;group.add(m);return m;
}
const PALETTE={
 media:{primary:0x162734,secondary:0x344b59,accent:0x25e1fa,light:0x8feeff,skin:0x6e483a,scale:1.01},
 medic:{primary:0x33434b,secondary:0x82959f,accent:0x5ee7b8,light:0xd4ffe8,skin:0x79503d,scale:1.03},
 solo:{primary:0x272c37,secondary:0x5d6674,accent:0xff5d91,light:0xffb4d3,skin:0x624033,scale:1.21},
 security:{primary:0x33333d,secondary:0x646a79,accent:0xf35a72,light:0xffabb2,skin:0x765d50,scale:1.05}
};
export function createTacticalCharacter(role='media',position=[0,0,0]){
 const p=PALETTE[role]||PALETTE.security;
 const root=new THREE.Group();root.name='Director tactical character: '+role;
 root.position.set(...position);root.scale.setScalar(p.scale);
 const skin=makeMat(p.skin,.07,.85),primary=makeMat(p.primary,.82,.36),secondary=makeMat(p.secondary,.8,.34),
 chrome=makeMat(0xb4bcca,.91,.21),flex=makeMat(0x0b1019,.18,.85),trim=makeMat(0xb08b68,.91,.25),
 emissive=makeMat(0x052331,.29,.26,p.accent,2.5),
 light=new THREE.MeshBasicMaterial({color:p.accent,toneMapped:false}),lens=makeMat(0x1f465f,.18,.11,p.accent,.23);
 const pivot=new THREE.Group();root.add(pivot);
 const torso=new THREE.Group();torso.position.y=1.38;pivot.add(torso);
 cuboid(torso,[0,.06,0],[.71,.75,.36],primary,.14);
 cuboid(torso,[0,.05,-.25],[.64,.5,.10],secondary,.06);
 cuboid(torso,[0,-.26,-.3],[.42,.09,.09],emissive,.025);
 // Real armor grading: clavicle scales, segmented cuirass, joints and visor.
 for(let i=0;i<5;i++)cuboid(torso,[0,-.13+i*.128,-.313],[.56-(i%2)*.035,.055,.048],i%2?chrome:trim,.015);
 for(const s of [-1,1]){
  cuboid(torso,[s*.30,.26,-.275],[.22,.21,.12],primary,.06,[0,s*.22,s*.16]);
  cuboid(torso,[s*.32,-.16,-.27],[.13,.35,.07],secondary,.025);
 }
 // Tabard fabric panels on jacket, angular shoulder profiles.
 for(const s of [-1,1]){
  const sh=new THREE.Mesh(new THREE.IcosahedronGeometry(.29,2),secondary);
  sh.position.set(s*.49,.34,.07);sh.scale.set(1.5,.6,1.5);sh.castShadow=true;torso.add(sh);
  cuboid(torso,[s*.5,.26,-.27],[.22,.09,.26],chrome,.03,[0,s*.18,s*.17]);
 }
 // Belt with realistic mechanical buckles and grenades.
 cuboid(pivot,[0,.96,0],[.75,.17,.48],flex,.04);
 cuboid(pivot,[0,.98,-.30],[.22,.12,.045],trim,.018);
 for(const s of [-1,1]) {
  cuboid(pivot,[s*.27,.92,-.32],[.16,.22,.14],primary);
  cuboid(pivot,[s*.27,.91,-.40],[.10,.1,.02],emissive,.01)
 }
 // Articulated arms and multi-layer forearm gauntlets.
 const arms=[];
 for(const s of [-1,1]){
  const arm=new THREE.Group();arm.position.set(s*.52,1.64,.055);pivot.add(arm);
  cuboid(arm,[s*.07,-.30,0],[.25,.57,.3],secondary,.10,[s*.13,0,s*.09]);
  cuboid(arm,[s*.1,-.57,-.035],[.275,.41,.28],primary,.055);
  cuboid(arm,[s*.1,-.55,-.21],[.17,.25,.05],chrome,.018);
  for(let j=0;j<3;j++)cuboid(arm,[s*.1,-.49-j*.11,-.248],[.14,.034,.018],emissive,.01);
  capsule(arm,[s*.1,-.91,-.015],.115,.11,skin);
  arms.push({obj:arm,side:s})
 }
 // Boot assemblies contain metal toes, knee armor, shin plating, calf cables.
 const legs=[];
 for(const s of [-1,1]){
  const leg=new THREE.Group();leg.position.set(s*.2,.87,0);pivot.add(leg);
  cuboid(leg,[0,-.28,0],[.34,.57,.36],primary,.105);
  cuboid(leg,[0,-.57,-.24],[.34,.20,.115],secondary,.045);
  cuboid(leg,[0,-.79,.02],[.28,.45,.32],secondary,.066);
  cuboid(leg,[0,-.78,-.215],[.23,.36,.07],chrome,.027);
  cuboid(leg,[0,-1.04,-.12],[.33,.15,.61],flex,.048);
  cuboid(leg,[0,-1.06,-.43],[.32,.12,.22],chrome,.037);
  rod(leg,[s*.10,-.56,.2],[s*.10,-.94,.20],.027,trim);
  legs.push({obj:leg,side:s});
 }
 // Neck/helmet are intentionally a separate silhouette, not one capsule token.
 rod(pivot,[0,1.68,0],[0,1.93,0],.12,flex);
 const head=new THREE.Group();head.position.set(0,2.0,0);pivot.add(head);
 const skull=new THREE.Mesh(new THREE.SphereGeometry(.29,36,28),skin);skull.scale.set(1,.95,.92);head.add(skull);skull.castShadow=true;
 const helm=new THREE.Mesh(new THREE.SphereGeometry(.335,36,24,0,Math.PI*2,0,Math.PI*.65),primary);
 helm.position.y=.08;helm.castShadow=true;head.add(helm);
 cuboid(head,[0,-.01,-.31],[.53,.19,.12],lens,.057);
 cuboid(head,[0,-.16,-.27],[.35,.09,.16],secondary,.025);
 for(const s of [-1,1]){
  cuboid(head,[s*.33,-.005,0],[.12,.26,.23],secondary,.042);
  rod(head,[s*.32,-.01,-.08],[s*.34,.17,.03],.025,emissive);
 }
 cuboid(head,[0,.30,0],[.32,.05,.34],chrome,.03);
 // Role-specific stylized mechanical detail and attached equipment.
 if(role==='media'){
  cuboid(torso,[-.12,.1,-.39],[.19,.31,.07],emissive,.023);
  for(let i=0;i<3;i++)rod(head,[.16+i*.052,.17,.22],[.16+i*.052,.37,.29],.022,chrome);
  const scanner=new THREE.Mesh(new THREE.TorusGeometry(.12,.022,12,32),light);
  scanner.position.set(-.38,-.02,.06);head.add(scanner);
  cuboid(pivot,[.42,.28,.25],[.18,.49,.26],primary);
 }else if(role==='medic'){
  cuboid(torso,[0,.23,-.395],[.39,.29,.05],secondary,.027);
  cuboid(torso,[0,.23,-.429],[.31,.055,.02],light,.008);
  cuboid(torso,[0,.23,-.44],[.05,.26,.02],light,.008);
  for(const s of [-1,1]){
   cuboid(pivot,[s*.47,.65,.29],[.24,.68,.36],secondary);
   cuboid(pivot,[s*.48,.73,.49],[.16,.29,.025],emissive,.008)
  }
 }else if(role==='solo'){
  for(const s of [-1,1]){
   cuboid(torso,[s*.57,.37,.04],[.34,.40,.4],primary,.08);
   cuboid(torso,[s*.56,.31,-.21],[.17,.31,.08],emissive,.03)
  }
  cuboid(torso,[0,.21,-.41],[.44,.28,.13],chrome,.03);
  for(let k=0;k<7;k++)rod(torso,[-.28+k*.092,.18,-.505],[-.28+k*.092,-.08,-.505],.016,emissive);
 }else{
  cuboid(torso,[0,.25,-.37],[.32,.21,.06],emissive,.027);
  cuboid(torso,[0,.04,-.39],[.29,.11,.07],chrome,.023);
 }
 // Weapon: geometry in the character's hands, not a screen-space sprite.
 const rifle=new THREE.Group();rifle.position.set(.29,1.14,-.45);rifle.rotation.y=-.19;pivot.add(rifle);
 cuboid(rifle,[0,.03,-.25],[.17,.18,.8],primary,.035);
 rod(rifle,[0,.03,-.45],[0,.03,-1.13],.044,chrome);
 cuboid(rifle,[0,.13,-.40],[.18,.15,.27],secondary,.033);
 cuboid(rifle,[0,-.15,-.11],[.13,.34,.19],flex,.029,[.12,0,.21]);
 cuboid(rifle,[0,.17,-.24],[.23,.045,.20],emissive,.02);
 for(const s of [-1,1])cuboid(rifle,[s*.13,.02,-.57],[.055,.10,.34],secondary,.021);
 // World-space ring stays legible at tactical zoom.
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.51,.045,8,48),light);
 ring.rotation.x=Math.PI/2;ring.position.y=.058;root.add(ring);
 const lamp=new THREE.PointLight(p.accent,2.1,3,.3);lamp.position.set(0,1.5,0);root.add(lamp);
 let elapsed=0,hitFlash=0,recoil=0,velocity=0;
 root.userData.role=role;
 root.userData.animate=(dt,motion=0)=>{
  elapsed+=dt;velocity=THREE.MathUtils.lerp(velocity,Math.min(1,motion),Math.min(1,dt*8));
  const pace=elapsed*9,step=Math.sin(pace)*.36*velocity;
  legs[0].obj.rotation.x=step;legs[1].obj.rotation.x=-step;
  arms[0].obj.rotation.x=-step*.6;arms[1].obj.rotation.x=step*.6;
  torso.rotation.z=Math.sin(elapsed*1.4)*.012;
  pivot.position.y=Math.abs(Math.sin(pace))*.055*velocity;
  rifle.rotation.x=-recoil*.19;
  recoil=Math.max(0,recoil-dt*7);
  if(hitFlash>0){hitFlash-=dt;ring.material.color.setHex(0xffffff)}
  else ring.material.color.setHex(p.accent);
 };
 root.userData.fire=()=>{recoil=1};
 root.userData.hit=()=>{hitFlash=.2};
 return root;
}
