import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// These are deliberately authored placements, not randomized geometry shells.
const PI=Math.PI;
const steel=new THREE.MeshStandardMaterial({color:0x172633,roughness:.61,metalness:.65});
const paint=new THREE.MeshPhysicalMaterial({color:0x314957,roughness:.42,metalness:.68,clearcoat:.12});
const trim=new THREE.MeshPhysicalMaterial({color:0xba9a75,roughness:.28,metalness:.92});
const rubber=new THREE.MeshStandardMaterial({color:0x1b2027,roughness:.89,metalness:.04});
const cyan=new THREE.MeshBasicMaterial({color:0x69eaff,toneMapped:false});
const amber=new THREE.MeshBasicMaterial({color:0xffbe78,toneMapped:false});
const danger=new THREE.MeshBasicMaterial({color:0xe0ae51,toneMapped:false});
const shadow=new THREE.MeshBasicMaterial({color:0x02090f,transparent:true,opacity:.2,depthWrite:false});
const glass=new THREE.MeshPhysicalMaterial({color:0x8fd4e9,metalness:.14,roughness:.09,transmission:.24,transparent:true,opacity:.38,depthWrite:false,side:THREE.DoubleSide,clearcoat:1});

const geom=(w,h,d,bevel=.04)=>new RoundedBoxGeometry(w,h,d,2,Math.min(bevel,w/5,h/5,d/5));
function mesh(group,g,mat,x,y,z,rotate=0){
 const o=new THREE.Mesh(g,mat);o.position.set(x,y,z);o.rotation.y=rotate;o.castShadow=true;o.receiveShadow=true;group.add(o);return o;
}
function bar(group,a,b,r,mat=paint){
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=B.clone().sub(A);
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),12),mat);
 m.position.copy(A.add(B).multiplyScalar(.5));
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());
 m.castShadow=true;group.add(m);return m;
}
function box(group,x,y,z,w,h,d,mat=paint,bevel=.04){
 return mesh(group,geom(w,h,d,bevel),mat,x,y,z);
}
function decalText(content,primary='#b7ecfa',accent='#57ddf6'){
 const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');
 x.fillStyle='#081e2cf0';x.fillRect(0,0,1024,256);
 x.fillStyle=accent;x.fillRect(16,16,14,224);
 x.fillStyle=primary;x.font='800 65px Arial';x.textBaseline='middle';x.fillText(content,62,111,910);
 x.fillStyle=accent;x.font='24px monospace';x.fillText('ORBITAL AUTHORITY   •   PERSONNEL ONLY',66,183,900);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 return new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide});
}
function sign(g,text,x,y,z,w=7){
 const s=mesh(g,new THREE.PlaneGeometry(w,w/4),decalText(text),x,y,z);s.rotation.y=0;
 box(g,x,y,z-.09,w+.2,w/4+.2,.18,steel);
 return s;
}
function bolts(group,positions) {
 const g=new THREE.CylinderGeometry(.042,.043,.045,10);
 const inst=new THREE.InstancedMesh(g,trim,positions.length);
 const dummy=new THREE.Object3D();
 positions.forEach(([x,y,z],i)=>{dummy.position.set(x,y,z);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)});
 inst.instanceMatrix.needsUpdate=true;group.add(inst);
}
function floorContact(group,x,z,scale=1){
 const m=new THREE.Mesh(new THREE.CircleGeometry(1.35*scale,40),shadow);
 m.position.set(x,.083,z);m.rotation.x=-PI/2;group.add(m);
}
function safetyLamps(group,positions){
 const g=new THREE.BoxGeometry(.19,.07,.46),inst=new THREE.InstancedMesh(g,amber,positions.length),dummy=new THREE.Object3D();
 positions.forEach(([x,y,z],i)=>{dummy.position.set(x,y,z);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)});
 inst.instanceMatrix.needsUpdate=true;group.add(inst);
}
function hazardBars(group,positions,mat= danger){
 const shape=new THREE.BoxGeometry(.18,.01,.58),inst=new THREE.InstancedMesh(shape,mat,positions.length),d=new THREE.Object3D();
 positions.forEach(([x,y,z],i)=>{d.position.set(x,y,z);d.rotation.y=.72;d.updateMatrix();inst.setMatrixAt(i,d.matrix)});
 inst.instanceMatrix.needsUpdate=true;group.add(inst);
}
function illuminatedPipe(group,a,b,core=0x58cfff){
 bar(group,a,b,.105,steel);bar(group,a,b,.024,new THREE.MeshBasicMaterial({color:core,toneMapped:false}));
}
function cableSweep(group,start,end,dip=.8){
 const [x1,y1,z1]=start,[x2,y2,z2]=end;
 const v0=new THREE.Vector3(x1,y1,z1),v1=new THREE.Vector3((x1+x2)*.5,(y1+y2)*.5-dip,(z1+z2)*.5),v2=new THREE.Vector3(x2,y2,z2);
 const curve=new THREE.QuadraticBezierCurve3(v0,v1,v2);
 const m=new THREE.Mesh(new THREE.TubeGeometry(curve,28,.045,8,false),rubber);m.castShadow=true;group.add(m)
}
function layeredSteel(group,x,y,z,w,d){
 box(group,x,y,z,w,.17,d,paint);
 box(group,x,y+.09,z,w-.20,.018,d-.14,steel,.01);
 box(group,x-w*.46,y+.12,z,.075,.045,d*.91,trim,.01);
 box(group,x+w*.46,y+.12,z,.075,.045,d*.91,trim,.01);
}
function makeCryoTower(group,x,z,h=5) {
 const o=new THREE.Group();o.position.set(x,0,z);group.add(o);
 box(o,0,1.15,0,1.35,2.3,.96,paint);
 box(o,0,2.41,-.04,1.18,.27,.83,trim);
 box(o,0,3.35,-.02,.8,1.66,.65,steel);
 box(o,0,3.6,.36,.62,.95,.08,glass);
 box(o,0,1.8,.515,.73,.61,.035,cyan);
 for(let yy=.38;yy<2.25;yy+=.29)box(o,0,yy,.495,.9,.037,.054,trim,.01);
 for(const s of [-1,1])bar(o,[s*.61,2.7,0],[s*.61,4.4,0],.04,trim);
 return o;
}
export function dressExteriorGantry(group,{high=true}={}) {
 const boltList=[],edge=[];
 // Three-layer gantry canopy: primary supports, secondary angled ribs, and cables.
 for (const x of [-21,-14,-7,0,7,14,21]) {
  bar(group,[x,5.8,-11],[x,7.85,-5],.21,steel);
  bar(group,[x,7.85,-5],[x,6.2,8.5],.17,paint);
  bar(group,[x,7.75,-5],[x+2.8,7.5,1.3],.075,trim);
  bar(group,[x,6.1,8.5],[x,4.75,9.9],.064,steel);
  illuminatedPipe(group,[x,7.5,-9],[x,7.36,7.3],0xffc788);
 }
 // Edge lighting and engineered railing feet.
 for(let x=-20;x<=20;x+=1.25){
  edge.push([x,.17,11.15]);
  if(Math.round(x)%5===0){boltList.push([x,.12,10.9],[x,.12,11.27])}
 }
 safetyLamps(group,edge);
 for(let z=-9;z<=9;z+=1.75){
  bolts(group,[[21.4,.21,z],[21.65,.21,z]]);
 }
 for(let x=-21;x<=21;x+=5.5){
  box(group,x,.03,-2.7,1.4,.08,.19,trim,.013);
  box(group,x,.04,1.6,1.8,.1,.12,steel,.014)
 }
 for(let x=-18;x<=18;x+=6){
  cableSweep(group,[x,5.2,-8],[x+3,5.3,-2],1.2);
  box(group,x,5.8,-4,2.8,.13,.41,amber,.018);
 }
 // Display panels and hull stencils.
 sign(group,'EVA DECK 04',-10,4.0,-11.63,7);
 sign(group,'AIRLOCK / EXIT',13,4.0,-11.63,7);
 // Multi-scale cargo and maintenance dressing: visible physical silhouettes.
 for(const [x,z] of [[-11,-5],[-8,-4],[0,1],[6,5],[8,5],[14,-3],[15,-2],[-13,7]])
  floorContact(group,x,z,.77);
 for(const [x,z] of [[-17,-3],[-2,-8],[11,1]]){
  makeCryoTower(group,x,z);
  box(group,x,.11,z+1.2,2.2,.16,.2,trim);
 }
 for (let i=0;i<12;i++){
  const x=-19+i*3.4;
  hazardBars(group,[[x,.09,-10.3],[x+.5,.09,-10.3]]);
 }
 const dots=[];for(let x=-20;x<20;x+=3)for(let z=-10;z<11;z+=3)dots.push([x,.11,z]);
 bolts(group,dots);
 return {placed:edge.length+boltList.length+dots.length,lighting:'cool orbital + warm practicals'};
}
export function dressLuxuryCasino(group,{high=true}={}) {
 for(const x of [-20,-16,-11,-6,6,11,16,20]){
  box(group,x,4.8,-13.3,.38,9.6,.54,trim,.13);
  box(group,x,2.3,-13,.68,1.5,.22,steel);
  illuminatedPipe(group,[x,7.0,-12],[x,7.0,3.5],0xffb07c);
  for (const y of [1.1,2.5,4.3,5.8]) {
   box(group,x,y,-13.05,.75,.065,.12,trim,.012);
  }
 }
 sign(group,'STARBURST',-13.5,5.25,-14.2,8);
 sign(group,'THE PALACE',13.5,5.25,-14.2,8);
 // Golden trim and individual light strips in the grand hall.
 for(let z=-9;z<=11;z+=4){
  for(const x of [-18,-9,0,9,18]){
   box(group,x,7.25,z,3.5,.12,.16,trim,.025);
   box(group,x,7.17,z,3.3,.016,.055,amber,.004)
  }
 }
 const tables=[[-15,-9],[15,-9],[-15,8],[15,8],[-5,11],[5,11]];
 for(const [x,z] of tables){
  floorContact(group,x,z,1.0);
  const g=new THREE.Group();g.position.set(x,0,z);group.add(g);
  box(g,0,1.46,-.53,2.3,.14,.24,trim);
  for(let k=0;k<7;k++)box(g,-.85+k*.28,1.55,-.62,.16,.09,.09,k%2?cyan:amber,.018);
  box(g,0,0,.83,2.4,.18,.19,trim);
  for(const s of [-1,1]){box(g,s*1.42,.52,0,.48,.8,.62,paint);box(g,s*1.42,.9,0,.44,.09,.56,trim)}
 }
 // Actual radial stair balustrade with glass panels on both balconies.
 for(const side of [-1,1])for(let i=0;i<12;i++){
  const z=9.85-i*.56,yy=.42+i*.235,x=side*(15.5+i*.09);
  bar(group,[x,yy,z],[x,yy+1.03,z],.06,trim);
  box(group,x,yy+.7,z,.9,.64,.04,glass,.01)
 }
 // Crystal centerpiece gains illuminated plinth/radial paving.
 for(let i=0;i<40;i++){
  const a=i*Math.PI*2/40;
  const r=4.55,x=Math.cos(a)*r,z=Math.sin(a)*r;
  box(group,x,.13,z,.15,.03,.7,i%3===0?amber:trim,.012).rotation.y=-a;
 }
 // Floating display cylinders are real 3D surfaces, not projected scenery.
 for(const [x,z] of [[-20,6],[20,6]]){
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,3.0,24,1,true),glass);
  c.position.set(x,2.2,z);c.castShadow=true;group.add(c);
  box(group,x,3.75,z,1.2,.18,1.2,trim)
 }
 return {tables:tables.length};
}
export function dressDockingCore(group,{high=true}={}){
 for(let x of [-19,-10,0,10,19]){
  for(let z=-15;z<=15;z+=5)layeredSteel(group,x,4.5,z,2.5,3);
  bar(group,[x,0,-16],[x,8,-16],.21,trim);
  illuminatedPipe(group,[x,7.6,-15],[x,7.6,13],0x74cfff)
 }
 sign(group,'ARRIVAL // ORBITAL',0,5.0,-15.85,10);
 for(let i=0;i<3;i++){
  const x=-14+i*14;
  // Landing pads and clamp machinery at the actual dock positions.
  for(let s of [-1,1]){
   box(group,x+s*4,1.15,-6.5,.45,2.3,1.3,paint);
   bar(group,[x+s*4,2.2,-6.4],[x+s*2.7,3.2,-6.6],.17,trim);
   box(group,x+s*3.2,3.12,-6.6,.65,.5,.65,steel)
  }
  for(let k=0;k<16;k++){
   const a=k*Math.PI/8;const rx=x+Math.cos(a)*5.35,rz=-7+Math.sin(a)*5.35;
   box(group,rx,.16,rz,.55,.06,.12,k%2?amber:cyan,.015).rotation.y=a;
  }
 }
 for(let x=-18;x<=18;x+=6)floorContact(group,x,8,.91);
 return {docks:3};
}
