import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Starburst Casino: architectural rebuild for a single real-time 3D showroom.
 * The reference is a two-storey, gold/brass and violet luxury orbital casino.
 * All visible architectural details, furniture, foliage and crystal sculptures
 * are physical 3D meshes. No 2D image of the reference is used as the scene.
 *
 * Coordinate domain: X ±23m, Z ±16m, Y 0..14m.
 * Physics colliders for major furnishing are registered using addCollision.
 */
const TAU=Math.PI*2;
const P=new THREE.Vector3();
const rgb=(hex)=>new THREE.Color(hex);
const metal=(hex,r=.26,metalness=.86)=>new THREE.MeshPhysicalMaterial({color:hex,metalness,roughness:r,clearcoat:.38,clearcoatRoughness:.13,envMapIntensity:1.35});
const aether=new THREE.MeshPhysicalMaterial({color:0x527e91,roughness:.085,metalness:.22,transparent:true,opacity:.30,side:THREE.DoubleSide,clearcoat:1,depthWrite:false,envMapIntensity:1.8});
const gold=metal(0xcaa268,.22),goldDark=metal(0x7b624b,.27),chrome=metal(0xded5ce,.21),black=metal(0x0c151e,.46);
const burgundy=new THREE.MeshPhysicalMaterial({color:0x5b102c,metalness:.08,roughness:.63,clearcoat:.11});
const velvet=new THREE.MeshStandardMaterial({color:0x781d3c,roughness:.95});
const felt=new THREE.MeshStandardMaterial({color:0x530f28,roughness:1});
const purpleGlass=new THREE.MeshPhysicalMaterial({color:0x762cc5,metalness:.13,roughness:.13,transparent:true,opacity:.82,emissive:0x8a30ef,emissiveIntensity:.48,side:THREE.DoubleSide,clearcoat:1,transmission:0});
const amethyst=new THREE.MeshPhysicalMaterial({color:0x8340c3,metalness:.09,roughness:.15,transparent:true,opacity:.87,emissive:0x7c27e7,emissiveIntensity:.69,clearcoat:1});
const glow=(color)=>new THREE.MeshBasicMaterial({color,toneMapped:false});
const roseGold=glow(0xffc892),violet=glow(0xcf63ff),blue=glow(0x73d9ff);
const linen=new THREE.MeshPhysicalMaterial({color:0xdfd8cf,metalness:.08,roughness:.76,clearcoat:.05});
const leafDark=new THREE.MeshStandardMaterial({color:0x194638,side:THREE.DoubleSide,roughness:.88});
const leafGreen=new THREE.MeshStandardMaterial({color:0x276545,side:THREE.DoubleSide,roughness:.82});
const pinkBlossom=new THREE.MeshStandardMaterial({color:0xc8689e,side:THREE.DoubleSide,roughness:.85});
const lilacBlossom=new THREE.MeshStandardMaterial({color:0xe6a2d8,side:THREE.DoubleSide,roughness:.91});
const contactMat=new THREE.MeshBasicMaterial({color:0x0c0918,transparent:true,opacity:.19,depthWrite:false});
function contactShadow(x,z,width=1.2,depth=1.2){
 const d=obj(new THREE.CircleGeometry(1,44),contactMat,x,.094,z);
 d.rotation.x=-Math.PI/2;d.scale.set(width,depth,1);d.renderOrder=1;return d
}
let perf='high',root;
const rand=()=>{rand.seed=(Math.imul(1664525,rand.seed)+1013904223)>>>0;return rand.seed/4294967296};
rand.seed=20261122;
function obj(g,mat,x=0,y=0,z=0,group=root){
 const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);
 m.castShadow=perf==='high';m.receiveShadow=true;group.add(m);return m;
}
function rect(x,y,z,w,h,d,mat=gold,bev=.035,group=root){
 const geometry=bev>0?new RoundedBoxGeometry(w,h,d,2,Math.min(bev,w*.2,h*.2,d*.2)):new THREE.BoxGeometry(w,h,d);
 return obj(geometry,mat,x,y,z,group);
}
function beam(a,b,r=.05,mat=gold,group=root,n=12){
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);
 const m=obj(new THREE.CylinderGeometry(r,r,A.distanceTo(B),n),mat,0,0,0,group);
 m.position.copy(A).add(B).multiplyScalar(.5);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());return m
}
function tube(points,r,mat=gold,group=root){
 const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 return obj(new THREE.TubeGeometry(path,Math.max(24,points.length*8),r,8,false),mat,0,0,0,group)
}
function disc(x,y,z,outer,thick,mat,segments=64,group=root){
 return obj(new THREE.CylinderGeometry(outer,outer,thick,segments),mat,x,y,z,group);
}
function ring(x,y,z,r,t,material,rotationX=-Math.PI/2,group=root){
 const mesh=obj(new THREE.TorusGeometry(r,t,12,96),material,x,y,z,group);
 mesh.rotation.x=rotationX;return mesh
}
function inlayCircle(x,z,r,material=gold){ring(x,.088,z,r,.035,material);ring(x,.089,z,r-.18,.013,material)}
function lineStrip(x1,z1,x2,z2,y=.083,r=.025,material=gold){beam([x1,y,z1],[x2,y,z2],r,material)}
function flickerLight(x,y,z,color,intensity,range,addLight){
 const l=addLight(x,y,z,color,intensity,range);return l
}
function curvedRail(cx,cz,r,a0,a1,y,height=1.1){
 const n=40;
 for(const yy of [y+.08,y+height,y+height-.08]){
  const pts=[];
  for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;pts.push([cx+Math.cos(a)*r,yy,cz+Math.sin(a)*r])}
  tube(pts,yy===y+height?.052:.021,yy===y+height?gold:chrome);
 }
 for(let i=0;i<=n;i+=2){
  const a=a0+(a1-a0)*i/n,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
  beam([x,y+.11,z],[x,y+height,z],.025,i%4===0?gold:chrome);
  disc(x,y+.10,z,.075,.1,gold,12)
 }
}
function stairRibbon(xStart,zStart,upZ,steps,width=4.7,height=4.6){
 // Each step is its own substantial bevel-edged mesh; the side profiles are curved.
 const depths=8.4/steps;
 const pointsLeft=[],pointsRight=[];
 for(let i=0;i<steps;i++){
  const y=.13+(i+.5)*height/steps;
  const z=zStart+(i+.5)*depths*upZ;
  const centerX=xStart+Math.sin(i/steps*Math.PI*.85)*1.35;
  rect(centerX,y,z,width,height/steps+.02,depths+.014,i%2===0?linen:chrome,.038);
  rect(centerX,y+height/steps*.5+.017,z,width,.037,depths-.02,linen,.014);
  rect(centerX,y+height/steps*.5+.035,z+depths*.40*upZ,width,.014,.043,gold,.01);
  pointsLeft.push([centerX-width/2-.12,y+.38,z]);pointsRight.push([centerX+width/2+.12,y+.38,z])
 }
 for(const pts of [pointsLeft,pointsRight]){
  tube(pts,.062,gold);
  for(let i=0;i<pts.length;i+=2){
   const [x,y,z]=pts[i];beam([x,y-.64,z],[x,y,z],.043,gold)
  }
 }
}
function sofa(cx,cz,rot=0,scale=1,y=0){
 if(y===0)contactShadow(cx,cz,1.65*scale,.6*scale);
 const g=new THREE.Group();g.position.set(cx,y,cz);g.rotation.y=rot;g.scale.setScalar(scale);root.add(g);
 rect(0,.61,0,2.55,.54,.88,velvet,.17,g);
 rect(0,1.16,.36,2.6,.77,.24,burgundy,.11,g);
 for(const s of [-1,1]){
  rect(s*1.19,.93,0,.33,.77,.95,burgundy,.13,g);
  rect(s*1.24,.48,.2,.13,.5,.1,gold,.035,g)
 }
 for(let j=0;j<4;j++){
  rect(-.92+j*.61,.94,-.27,.48,.08,.23,burgundy,.05,g);
  rect(-.92+j*.61,.70,-.55,.045,.25,.025,gold,.012,g)
 }
 for(const s of [-1,1])rect(s*1.04,.20,.22,.095,.22,.095,gold,.02,g);
}
function gamingTable(cx,cz,rot=0,r=2.2){
 const g=new THREE.Group();g.position.set(cx,0,cz);g.rotation.y=rot;g.userData.keepSeparate=true;root.add(g);
 // Oval profile has 56 real cylinder side facets, nested wood/brass trim and felt.
 for(const [y,rad,h,material] of [[.92,r,.14,black],[1.035,r+.10,.095,gold],[1.096,r-.16,.045,burgundy],[1.135,r-.29,.028,felt]]){
  const mesh=disc(0,y,0,rad,h,material,64,g);mesh.scale.set(1,.99,.68);
 }
 for(const s of [-1,1])rect(s*r*.35,.49,0,.37,.90,.34,black,.05,g);
 for(let i=0;i<10;i++){
  const a=i*TAU/10,x=Math.cos(a)*(r+.52),z=Math.sin(a)*(r*.68+.36);
  const chair=new THREE.Group();chair.position.set(x,0,z);chair.rotation.y=-a+Math.PI/2;g.add(chair);
  disc(0,.69,0,.34,.13,velvet,20,chair);
  rect(0,1.07,.22,.60,.66,.15,burgundy,.085,chair);
  beam([0,.63,0],[0,.13,0],.055,gold,chair);
  for(const q of [-1,1])beam([q*.21,.18,.18],[q*.21,.18,-.18],.035,gold,chair);
 }
 for(let i=0;i<24;i++){
  const a=i*TAU/24,x=Math.cos(a)*r*.90,z=Math.sin(a)*r*.61;
  disc(x,1.165,z,.072,.018,i%3===0?roseGold:i%3===1?violet:blue,10,g);
 }
 inlayCircle(cx,cz,r+1.5,goldDark);
 contactShadow(cx,cz,r*.87,r*.67);
 return g;
}
function barCounter(){
 const cx=17,cz=9,R=5.4;
 // True curved bar top using annular sectors, not a giant rectangular box.
 const segs=30;
 for(let i=0;i<segs;i++){
  const a=-Math.PI*.05+i*Math.PI*.8/segs,ang2=-Math.PI*.05+(i+1)*Math.PI*.8/segs;
  const vertices=[],faces=[];
  for(const radius of [R-1.05,R])for(const angle of [a,ang2])vertices.push(Math.cos(angle)*radius,0,Math.sin(angle)*radius);
  faces.push(0,2,1,1,2,3);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(faces);g.computeVertexNormals();
  const part=obj(g,black,cx,1.12,cz);part.material.side=THREE.DoubleSide;
  const pos=[cx+Math.cos(a)*R,1.17,cz+Math.sin(a)*R],pos2=[cx+Math.cos(ang2)*R,1.17,cz+Math.sin(ang2)*R];
  beam(pos,pos2,.055,gold);
  if(i%2===0){
   const x=cx+Math.cos(a)*R*.98,z=cz+Math.sin(a)*R*.98;
   beam([x,.29,z],[x,1.01,z],.043,gold);
   disc(x,.21,z,.10,.04,gold,12)
  }
 }
 const backing=new THREE.Group();backing.position.set(19.7,0,12.3);root.add(backing);
 for(let i=0;i<30;i++){
  const a=i%10,b=Math.floor(i/10),x=-2.2+a*.44,y=1.4+b*.55;
  const bottle=disc(x,y,.13,.068,.29,i%4===0?purpleGlass:i%4===1?amethyst:i%4===2?burgundy:aether,12,backing);
  bottle.scale.y=1+(i%3)*.14;
  disc(x,y+.2,.13,.041,.06,gold,12,backing)
 }
 for(let i=0;i<4;i++)rect(0,1+i*.54,-.1,5.0,.07,.72,gold,.02,backing);
 ring(cx, .105,cz,6.6,.047,gold);
}
function tree(cx,cz,{height=5.4,pink=false,seed=1,scale=1}={}){
 const group=new THREE.Group();group.position.set(cx,0,cz);group.scale.setScalar(scale);root.add(group);
 const wood=new THREE.MeshStandardMaterial({color:pink?0x503743:0x5d5345,roughness:.95});
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.105,.26,height,13,7),wood);trunk.position.y=height*.52;group.add(trunk);
 const n=pink?10:9;
 const curveList=[];
 for(let i=0;i<n;i++){
  const angle=TAU*i/n+(seed*.37),reach=pink?2.1:2.7;
  const start=[0,height*.71,0],middle=[Math.cos(angle)*reach*.55,height*1.04,Math.sin(angle)*reach*.55];
  const end=[Math.cos(angle)*reach,height*(pink?.85:.86),Math.sin(angle)*reach];
  tube([start,middle,end],pink?.047:.068,wood,group);
  curveList.push({middle,end,angle})
 }
 const count=pink?(perf==='high'?270:95):(perf==='high'?160:70);
 const leafGeo=new THREE.PlaneGeometry(pink?.18:.53,pink?.18:1.04);
 const mats=pink?[pinkBlossom,lilacBlossom]:[leafDark,leafGreen];
 for(let k=0;k<2;k++){
  const countHalf=Math.floor(count/2);
  const im=new THREE.InstancedMesh(leafGeo,mats[k],countHalf);
  const d=new THREE.Object3D();
  for(let i=0;i<countHalf;i++){
   const b=curveList[i%curveList.length],a=b.angle+(rand()-.5)*.67;
   const rr=.5+rand()*2.2;
   const xx=Math.cos(a)*rr,zz=Math.sin(a)*rr;
   const y=height*(pink?.86:.92)+(rand()-.5)*(pink?1.55:1.35);
   d.position.set(xx,y,zz);d.rotation.set((rand()-.5)*2.1,a,(rand()-.5)*1.4);
   const w=(pink?.65:.59)+rand()*.5;d.scale.setScalar(w);d.updateMatrix();im.setMatrixAt(i,d.matrix);
  }
  im.instanceMatrix.needsUpdate=true;im.frustumCulled=false;group.add(im)
 }
 const pot=disc(0,.22,0,.75,.45,black,32,group);
 disc(0,.46,0,.83,.12,gold,32,group);
 const soil=disc(0,.52,0,.69,.028,wood,32,group);
}
function crystalFountain(addLight){
 // Multiple gold rings, actual radial planes and faceted translucent crystals.
 for(const [rad,y,h,material] of [[4.45,.34,.47,black],[4.20,.60,.09,gold],[3.94,.66,.08,aether],[3.58,.70,.06,black]]){
  disc(0,y,0,rad,h,material,96);
 }
 for(let r of [3.55,3.88,4.36]){
  ring(0,.77,0,r,.045,r===4.36?gold:violet);
 }
 for(let i=0;i<38;i++){
  const a=i*TAU/38,x=Math.cos(a)*4.01,z=Math.sin(a)*4.01;
  const lamp=disc(x,.79,z,.10,.035,i%4===0?roseGold:violet,10);
 }
 const rng=()=>rand();
 for(let i=0;i<36;i++){
  const a=i*2.39996,rad=.45+Math.sqrt(i/36)*2.45;
  const x=Math.cos(a)*rad,z=Math.sin(a)*rad,h=1.4+(i%7)*.27+(i%5)*.22;
  const gem=obj(new THREE.CylinderGeometry(.05,.22,h,6,1),i%4===0?purpleGlass:amethyst,x,.73+h/2,z);
  gem.rotation.z=Math.cos(a)*.22;gem.rotation.x=Math.sin(a)*.19;
  const crown=obj(new THREE.ConeGeometry(.225,.44,6),amethyst,x,.73+h+.22,z);
  crown.rotation.z=Math.cos(a)*.22;
 }
 for(let j=0;j<9;j++){
  const x=(rand()-.5)*3.5,z=(rand()-.5)*3.5;
  const h=3.1+rand()*2.0,gem=obj(new THREE.OctahedronGeometry(.37+rand()*.3,1),purpleGlass,x,h,z);
  gem.scale.y=3;gem.rotation.z=(rand()-.5)*.26
 }
 addLight(0,3.1,0,0xb449ff,46,11);
 addLight(0,.8,0,0xdf8cff,16,6);
}
function arcWindow(addLight){
 // Back/right panoramic window gallery: curved arches and tall glass panes
 // with thin layered frames and the orbital backdrop behind.
 for(let i=0;i<11;i++){
  const x=5.5+i*1.63;
  beam([x,0,-15.5],[x,10.75,-15.5],.16,gold);
  beam([x+.10,0,-15.29],[x+.10,10.55,-15.29],.06,chrome);
  if(i<10)rect(x+.815,5.3,-15.51,1.5,10.55,.036,aether,.01);
 }
 for(const h of [.3,5.3,10.75]){
  tube([[5,h,-15.5],[10,h+Math.sin(h*.3)*.12,-15.5],[16,h,-15.5],[22,h+Math.sin(h*.3)*.12,-15.5]],.16,gold);
  tube([[5,h+.18,-15.36],[11,h+.18,-15.36],[18,h+.18,-15.36],[22,h+.18,-15.36]],.042,chrome);
 }
 for(let i=0;i<7;i++){
  const x=6+i*2.7;
  beam([x,10.8,-15.2],[x,12.6,-13.3],.16,gold);
  beam([x,10.8,-15.1],[x,12.5,-13.15],.035,roseGold);
 }
 for(let x=8;x<22;x+=4) addLight(x,10.9,-13.0,0xffc590,8,8);
}
function balcony(){
 // Rear/left two-tier floating mezzanines.
 const w1=22,d1=9.0;
 // Coiffured ceiling panels anchor the left luxury mezzanine. They never cover
 // the atrium's central top-down tactical camera.
 for(let x=-21;x<=-2;x+=3.2){
   rect(x,11.72,-12.6,2.83,.21,4.25,black,.04);
   rect(x,11.53,-12.6,2.61,.045,3.9,linen,.017);
   for(const s of [-1,1])rect(x+s*1.24,11.49,-12.6,.047,.04,3.7,roseGold,.009);
 }
 // Sculpted curved VIP balcony, modeled as an extruded 3D floor plate
 // rather than the old detached rectangular platform.
 const plan=new THREE.Shape();
 plan.moveTo(-23,14.35);plan.lineTo(-1.6,14.35);plan.lineTo(-1.6,5.45);
 plan.bezierCurveTo(-5.3,.65,-17.1,.65,-23,5.45);plan.closePath();
 const deck=obj(new THREE.ExtrudeGeometry(plan,{
   depth:.48,steps:1,bevelEnabled:true,bevelSize:.10,bevelThickness:.06,bevelSegments:3
 }),black,0,4.55,0);
 deck.rotation.x=-Math.PI/2;
 const finish=obj(new THREE.ShapeGeometry(plan,36),linen,0,5.11,0);
 finish.rotation.x=-Math.PI/2;
 for(const x of [-22,-18,-14,-10,-6,-2]){
  beam([x,0,-14.5],[x,4.7,-14.5],.24,gold);
  beam([x,1.9,-14.55],[x,1.9,-5.15],.09,gold);
 }
 const frontCurve=new THREE.CubicBezierCurve3(
   new THREE.Vector3(-1.6,5.18,-5.45),
   new THREE.Vector3(-5.3,5.18,-.65),
   new THREE.Vector3(-17.1,5.18,-.65),
   new THREE.Vector3(-23,5.18,-5.45)
 );
 const upper=[],lower=[];
 for(let i=0;i<=36;i++){
   const p=frontCurve.getPoint(i/36);
   upper.push([p.x,p.y+1.13,p.z]);
   lower.push([p.x,p.y+.09,p.z]);
   if(i%2===0){
     beam([p.x,p.y+.08,p.z],[p.x,p.y+1.15,p.z],.031,i%6===0?gold:chrome);
     disc(p.x,p.y+.085,p.z,.08,.12,gold,12);
   }
 }
 tube(upper,.053,gold);tube(lower,.035,chrome);
 // Recessed balcony front trim, echoed by the staircase handrails.
 const glowPoints=frontCurve.getPoints(34).map(p=>[p.x,p.y-.20,p.z]);
 tube(glowPoints,.047,roseGold);
 for(let i=0;i<10;i++){
   const p=frontCurve.getPoint(i/9);
   beam([p.x,p.y-.42,p.z],[p.x,p.y-.06,p.z],.075,gold);
 }
 for(let i=0;i<10;i++){
  const x=-21+i*2.3;
  rect(x,4.35,-5.15,.14,.57,.20,gold);
  rect(x,4.37,-5.12,.09,.48,.08,roseGold,.009);
  sofa(x, -11.0,Math.PI, .78, 5.08)
 }
 // Luxury staircase left foreground, visible risers and railing.
 stairRibbon(-17,7,-1,17,4.5,4.6);
 // Upper VIP ceiling and golden rail light fixtures.
 for(let y of [7.2,9.6])for(let x=-21;x<-2;x+=3.2){
  rect(x,y,-13.7,2.65,.065,.28,roseGold,.006)
 }
 for(let x=-21;x<=-2;x+=4){
  const chandelier=new THREE.Group();chandelier.position.set(x,9,-10);root.add(chandelier);
  ring(0,0,0,1.15,.048,gold,0,chandelier);
  ring(0,-.17,0,.92,.035,roseGold,0,chandelier);
  for(let i=0;i<12;i++){
   const a=i*TAU/12;beam([Math.cos(a)*1.15,-.17,Math.sin(a)*1.15],[Math.cos(a)*1.15,.20,Math.sin(a)*1.15],.023,gold,chandelier)
  }
 }
}
function deckFloor(mat){
 rect(0,-.53,0,46,1.05,32,black,.025);
 rect(0,.015,0,45.6,.12,31.65,mat,.012);
 const seam=metal(0x5c5760,.35,.78);
 // Large-format marble tiles, intentionally subtler than prior noisy square tiles.
 for(let x=-22.5;x<23;x+=4.5)lineStrip(x,-15.8,x,15.8,.091,.018,seam);
 for(let z=-15.5;z<=15.5;z+=4.5)lineStrip(-22.7,z,22.7,z,.091,.018,seam);
 for(let r of [5.35,6.1,7.6,9.15])inlayCircle(0,0,r,r%2?goldDark:gold);
 for(let i=0;i<16;i++){
  const a=i*TAU/16;
  lineStrip(Math.cos(a)*9.15,Math.sin(a)*9.15,Math.cos(a)*11.2,Math.sin(a)*11.2,.093,.026,goldDark);
 }
 // Polygonal gold inlays draw eye toward fountain and tables.
 for(const [x,z] of [[-13,-8],[12,-9],[-14,9],[12,8]]){
  for(let r of [3.2,3.33])inlayCircle(x,z,r,r===3.2?gold:goldDark)
 }
}
function structuralDetails(){
 for(const x of [-22,-18,-14,-9,-4,1]){
  beam([x,0,-15],[x,12,-15],.16,gold);
  rect(x,7,-14.85,.28,.65,.30,gold,.03);
 }
 for(let i=0;i<22;i++){
  const x=-21+i*2.0;
  beam([x,11.4,-15],[x,11.9,-9.7],.073,chrome);
  if(i%2===0)rect(x,11.9,-9.3,1.38,.13,.29,roseGold,.01)
 }
 for(const z of [-13,-7,-1,5,11]){
  beam([-22.2,0,z],[-22.2,12,z],.16,gold);
  rect(-22.15,10.8,z,.25,1.1,.5,gold)
 }
}
export function buildCasinoHero({group,marble,addLight,addCollision,earth,high=true,useScannedPlants=false}){
 root=group;perf=high?'high':'capture';rand.seed=20261122;
 deckFloor(marble);
 structuralDetails();
 arcWindow(addLight);
 balcony();
 crystalFountain(addLight);
 const gaming=[
  [-14,-1,Math.PI*.09,2.0],[12,-8,Math.PI*.18,2.0],
  [-13,10,Math.PI*.10,1.85],[8,10,Math.PI*.30,1.85],[17,0,Math.PI*.10,1.8]
 ];
 for(const [x,z,rot,r] of gaming){const table=gamingTable(x,z,rot,r);addCollision(x,z,2.5,2,'Gaming table',22,table);}
 barCounter();addCollision(18,10,8,4,'Luxury bar counter',0);
 for(const [x,z,r] of [[-8,6,.2],[-17,4,.4],[-4,-10,.1],[4,-11,.15],[14,5,.9]]){
  sofa(x,z,r,1.05)
 }
 for(const [x,z,pink,height] of [
  [-18,12,true,5.3],[-11,-12,true,5.0],[-3,11,false,5.4],
  [5,-11,false,6.3],[17,-10,false,5.8],[20,14,false,5.2],
  [-21,-4,true,4.4],[0,-13,true,4.8]
 ]) {if(!pink&&useScannedPlants)continue;tree(x,z,{pink,height,scale:1});}
 const planters=[[-6,-13],[12,-12],[-18,14],[18,14]];
 for(const [x,z] of planters){
  rect(x,.36,z,2.8,.63,1.1,black,.11);rect(x,.69,z,2.93,.07,1.23,gold,.025);
  for(let i=0;i<11;i++){
   const stemX=x+(rand()-.5)*2.3,stemZ=z+(rand()-.5)*.85;
   beam([stemX,.72,stemZ],[stemX,1.3+rand()*.6,stemZ],.026,leafDark);
   const leaf=obj(new THREE.IcosahedronGeometry(.18,1),leafGreen,stemX,1.25+rand()*.65,stemZ);
   leaf.scale.set(1.5,.22,2.0);leaf.rotation.y=rand()*TAU
  }
 }
 for(const [x,z] of [[-18,-14],[-10,-14],[-2,-14],[6,-14],[14,-14],[22,-14]]){
  addLight(x,7.1,z,0xffbf72,22,10);
 }
 for(const [x,z] of [[-20,11],[-10,10],[0,12],[10,12],[19,8]])
  addLight(x,3.8,z,0xffc49a,10,8);
 // Dark vacuum remains physically present behind the panoramic observation glass.
 if(earth){
  const orb=earth();orb.position.set(95,-175,-360);group.add(orb)
 }
 group.userData.hero={scene:'Crystal Palace / Starburst Casino',structural:true,destructibleTables:true};
 return {reference:'Two-level orbital luxury casino',gamingTables:gaming.length,
  plants:8,steps:17,mezzanine:true,wallGeometry:true,material:'scanned marble',stylized:false};
}
