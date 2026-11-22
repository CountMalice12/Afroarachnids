import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Fully spatial architectural envelope for Crystal Palace CP-03.
 * Replaces the exposed diorama edges with actual pressure hull, glazed
 * observation bays, ring supports, VIP walls and soffits.
 *
 * The front (positive Z) is intentionally left open to the tactical camera.
 * The rear, west and east boundaries are enclosed with real meshes.
 */
const brass=new THREE.MeshPhysicalMaterial({color:0xc69b65,metalness:.93,roughness:.22,clearcoat:.55,clearcoatRoughness:.15});
const pewter=new THREE.MeshPhysicalMaterial({color:0xb3c4d1,metalness:.87,roughness:.22});
const midnight=new THREE.MeshPhysicalMaterial({color:0x0c1b28,metalness:.68,roughness:.34});
const velvet=new THREE.MeshPhysicalMaterial({color:0x391327,metalness:.17,roughness:.67,clearcoat:.2});
const purple=new THREE.MeshBasicMaterial({color:0xc36cff,toneMapped:false});
const amber=new THREE.MeshBasicMaterial({color:0xffc991,toneMapped:false});
const vitrine=new THREE.MeshPhysicalMaterial({color:0x72a5c6,metalness:.09,roughness:.085,transparent:true,opacity:.23,transmission:.2,side:THREE.DoubleSide,depthWrite:false,clearcoat:1,envMapIntensity:1.7});
function box(group,x,y,z,w,h,d,mat=midnight,bev=.045){
 const m=new THREE.Mesh(bev?new RoundedBoxGeometry(w,h,d,3,Math.min(bev,w*.22,h*.22,d*.22)):new THREE.BoxGeometry(w,h,d),mat);
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m
}
function rod(group,a,b,r=.065,mat=brass){
 const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);
 const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),12),mat);
 o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());o.castShadow=true;group.add(o);return o
}
function curve(group,points,r=.07,mat=brass){
 const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 const m=new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(28,points.length*5),r,12,false),mat);
 m.castShadow=true;group.add(m);return m
}
export function surroundCasino({group,addLight,high=true}){
 // Obsidian hull to the left and rear of the mezzanine, with buttresses.
 box(group,-22.9,6.65,-4.2,.95,13.3,23.8,midnight);
 box(group,-11.3,6.45,-15.8,23.2,12.9,.9,midnight);
 for(let x=-22.2;x<2;x+=2.5){
  box(group,x,6.1,-15.12,.25,11.5,.37,brass,.032);
  box(group,x,5.7,-14.82,2.12,5.65,.12,velvet,.035);
  box(group,x,8.7,-14.79,2.13,.085,.1,purple,.018);
  box(group,x,2.6,-14.75,1.98,.068,.12,amber,.018);
  box(group,x,11.32,-14.83,2.08,.09,.21,pewter,.018);
 }
 for(let z=-15;z<13;z+=2.7){
  box(group,-22.30,6.25,z,.39,12.3,.2,brass,.03);
  for(let y of [1.7,4.6,7.4,10.45]){
   box(group,-22.04,y,z,.08,.23,2.32,pewter,.012)
  }
  box(group,-21.96,10.8,z,.13,.075,2.3,amber,.01)
 }
 // Recessed VIP alcove panels. The dark, warm surfaces give actual contrast
 // and prevent the room from appearing like a marble slab in empty space.
 for(let i=0;i<6;i++){
  const x=-20+i*3.5;
  box(group,x,6.55,-14.65,3.0,3.2,.16,velvet,.055);
  box(group,x,8.1,-14.51,2.65,.064,.16,brass,.015);
  for(const s of [-1,1])box(group,x+s*1.38,6.55,-14.47,.064,3.3,.15,brass,.012);
  box(group,x,6.50,-14.43,1.15,1.35,.035,midnight,.015);
 }
 // Giant glass observation bays wrap the whole right section of the resort.
 for(let i=0;i<11;i++){
  const x=2.3+i*2.0;
  box(group,x,6.9,-16.1,.24,13.7,.39,brass,.034);
  box(group,x+.11,6.9,-15.86,.07,13.4,.085,pewter,.018)
 }
 for(let i=0;i<11;i++){
  const x=3.3+i*2.0;
  box(group,x,6.65,-16.0,1.87,12.75,.045,vitrine,.001);
 }
 for(let h of [0.3,4.1,9.2,13.2]){
  box(group,12.8,h,-16.0,21.4,.13,.32,brass,.024)
 }
 // Right observation gallery with angled glazing (the prominent ring-like vista).
 for(let i=0;i<=10;i++){
  const z=-15+i*2.95;
  box(group,23.0,7.0,z,.35,14.0,.28,brass,.03);
  const o=box(group,22.78,7.1,z,.07,13.8,.06,pewter,.018);
  if(i<10)box(group,23.00,6.7,z+1.48,.055,13.0,2.72,vitrine,.001)
 }
 for(const h of [.55,5.4,10.1,13.75]){
  box(group,23.01,h,.05,.24,.10,31.0,brass,.023)
 }
 // Multi-meter station-ring arch is modeled in 3D, immediately outside
 // the observation glass, with illuminated second-layer trim.
 for(const r of [16.5,17.25]){
  const points=[];
  for(let i=0;i<=48;i++){
   const angle=(-.30+i/48*2.0);
   points.push([13+Math.cos(angle)*r,6.5+Math.sin(angle)*r,-18.5]);
  }
  curve(group,points,r===16.5?.36:.095,r===16.5?pewter:amber)
 }
 // Upper service beams and 2-tier ceiling lattice on the closed side;
 // tactical camera can still see the atrium through the open roof.
 for(let x=-22;x<=0;x+=3.25){
  rod(group,[x,11.4,-15.1],[x,12.6,-8.4],.12,pewter);
  rod(group,[x,12.6,-8.4],[x,12.0,-5.7],.078,brass);
  box(group,x,12.65,-9.8,2.65,.13,.55,midnight,.04);
  box(group,x,12.53,-9.8,2.55,.025,.13,amber,.009);
 }
 for(let z=-14;z<=-6;z+=2.25){
  rod(group,[-22,12.15,z],[1,12.15,z],.08,pewter)
 }
 // Lit border makes the station floor visually anchored in the hull.
 for(const x of [-22.9,22.9]){
  box(group,x,-.06,0,.44,.35,32.2,brass,.03);
  box(group,x,.14,0,.11,.05,32.0,amber,.009)
 }
 for(const z of [-15.9,15.9]){
  box(group,0,-.04,z,46,.29,.35,brass,.04)
 }
 // Localized practicals along walls: warm alcove lamps with violet accents.
 for(let x=-19;x<=-1;x+=6){
  addLight(x,8.5,-13.3,0xffc39b,8,8);
  addLight(x,2.3,-13.3,0x8a52ff,3.8,6)
 }
 for(let z=-12;z<13;z+=7){
  addLight(21.1,10.0,z,0xffc9a2,8,10);
 }
 return {sealedSides:3,windows:21,partialRoof:true,stationArches:true};
}
