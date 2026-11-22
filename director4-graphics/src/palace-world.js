import {generatePalaceMaterials} from './palace-textures.js';
/**
 * Crystal Palace sector authoring v1. Original 3D architectural interpretation
 * of the user's ten existing Director 4.0 floor plans and the detailed casino /
 * exterior gantry background art. Artwork is a DESIGN REFERENCE, not projected
 * background or an extracted 3D asset. Everything rendered here is 3D geometry.
 * 2 meters per tactical cell. Scene extents 46 x 34 meters.
 */
const TAU=Math.PI*2;
const CEIL=6.7;
const rand=seed=>{let a=seed>>>0;return ()=>((a=(a*1664525+1013904223)>>>0)/4294967296)};
const THEMES={
 'CP-01':{name:'Docking Core',zone:'PRESSURIZED • ARRIVALS',gravity:'0.8g',tint:0x4cb9e8,rooms:['Arrival Airlock','Hangar North','Shuttle Bay','Cargo Inspection','Customs Corridor','Dock Operations']},
 'CP-02':{name:'Immigration & Customs',zone:'CUSTOMS • TRANSIT',gravity:'0.8g',tint:0x45d1cf,rooms:['Entry Control','Biometrics','Warrant Check','Detention','Baggage','Transit Hall']},
 'CP-03':{name:'Starburst Casino',zone:'RESORT RING • PROMENADE',gravity:'0.8g',tint:0xb16cff,rooms:['Crystal Atrium','VIP Gaming','Luxury Bar','Private Tables','Reception','Secure Vault']},
 'CP-04':{name:'Celestial Hotel',zone:'RESIDENTIAL RING',gravity:'0.8g',tint:0xffbe8c,rooms:['Grand Lobby','Penthouse','Guest Suites','Service Corridor','Private Clinic','Sky Lounge']},
 'CP-05':{name:'Glass Biosphere',zone:'PARK RING',gravity:'0.8g',tint:0x83e4ac,rooms:['Orchid Walk','Rain Garden','Biopods','Water Gallery','Botany Lab','Service Roots']},
 'CP-06':{name:'Habitation Quarter',zone:'CIVILIAN RING',gravity:'0.8g',tint:0xe3b07f,rooms:['North Housing','Local Market','Community Hall','School & Clinic','Neighborhood Arcade','Maintenance']},
 'CP-07':{name:'Industrial Torus',zone:'MANUFACTURING RING',gravity:'0.8g',tint:0xf4a55d,rooms:['Print Forge','Drone Bay','Robotics','Refining Deck','Conveyors','Ship Components']},
 'CP-08':{name:'Orbital Medtech Archive',zone:'MEDICAL RING',gravity:'0.8g',tint:0x62d7ef,rooms:['Triage','Surgery','Cryostorage','Neural Lab','Records','Quarantine']},
 'CP-09':{name:'Administration Spindle',zone:'CENTRAL SPINDLE',gravity:'ZERO-G',tint:0x91b2ff,rooms:['Command Bridge','Security Hub','Transmission','Navigation','Relay Core','Power Control']},
 'CP-10':{name:'Exterior Service Gantry',zone:'EXTERIOR HULL',gravity:'VACUUM / ZERO-G',tint:0x6acaff,rooms:['EVA Airlock','Maintenance Truss','Sensor Cluster','Exterior Relay','Tether Corridor','Outer Platform']}
};
export const PALACE_SECTORS=THEMES;
const rgba=(T,color)=>new T.Color(color);
export function buildPalaceSector(T,id){
 const def=THEMES[id];if(!def)throw Error('Unknown Palace sector '+id);
 const group=new T.Group();group.name=id+' '+def.name;
 const solids=[],doors=[],interactables=[],lights=[];
 const metallic=(c,r=.36,m=.83)=>new T.MeshPhysicalMaterial({color:c,metalness:m,roughness:r,clearcoat:.24,clearcoatRoughness:.13});
 const glow=(c,intensity=3)=>new T.MeshStandardMaterial({color:0x243040,emissive:c,emissiveIntensity:intensity,roughness:.4,metalness:.34,toneMapped:false});
 const authored=generatePalaceMaterials(T);
 const mats={
  floor:id==='CP-03'||id==='CP-04'?authored.marble:metallic(id==='CP-05'?0x405759:0x344758,.22,.62),
  dark:metallic(0x111e29,.63,.7),steel:metallic(0x82949f,.3,.85),white:metallic(0xc3d6d9,.32,.32),
  gold:metallic(0xd2ad64,.24,.87),glass:new T.MeshPhysicalMaterial({color:0x67b9ce,metalness:.12,roughness:.11,transparent:true,opacity:.48,depthWrite:false,clearcoat:.9,side:T.DoubleSide}),
  accent:glow(def.tint,2.7),amber:glow(0xfca961,2.7),danger:glow(0xf45878,2.8),
  foliage:new T.MeshStandardMaterial({color:0x348263,roughness:.82,side:T.DoubleSide}),
  leaf:new T.MeshStandardMaterial({color:0x4eaa7a,roughness:.81,side:T.DoubleSide}),
  water:new T.MeshPhysicalMaterial({color:0x338ca5,roughness:.1,metalness:.23,transparent:true,opacity:.82,clearcoat:1,clearcoatRoughness:.09}),
  violet:new T.MeshPhysicalMaterial({color:0x9d44de,roughness:.11,metalness:.25,transmission:.22,clearcoat:.92}),
  red:metallic(0x723b56,.45,.33), rubber:metallic(0x24303b,.78,.13)
 };
 function mesh(parent,geo,mat,x,y,z,shadow=true){
  const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;
 }
 function box(x,y,z,w,h,d,material=mats.steel,opts={}){
  const o=mesh(group,new T.BoxGeometry(w,h,d),material,x,y,z,opts.shadows!==false);
  if(opts.solid)register(o,x,z,w,d,opts.hp||0,opts.name||'Architectural cover',opts.door||false);
  return o;
 }
 function register(obj,x,z,w,d,hp=0,name='Cover',isDoor=false){
  const s={obj,x,z,w,d,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,
           active:true,hp,maxHP:hp,name,isDoor};
  solids.push(s);if(isDoor)doors.push(s);return s
 }
 function cylinder(x,y,z,rt,rb,h,material=mats.steel,n=32){
  return mesh(group,new T.CylinderGeometry(rt,rb,h,n),material,x,y,z)
 }
 function torus(x,y,z,r,th,material=mats.gold,n=64){
  let o=mesh(group,new T.TorusGeometry(r,th,10,n),material,x,y,z);
  o.rotation.x=Math.PI/2;return o
 }
 function span(a,b,r,material=mats.steel){
  const A=new T.Vector3(...a),B=new T.Vector3(...b),dif=B.clone().sub(A);
  const o=mesh(group,new T.CylinderGeometry(r,r,dif.length(),12),material,
    (a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
  o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dif.normalize());return o;
 }
 function light(x,y,z,color=def.tint,power=19,range=15){
  const l=new T.PointLight(color,power,range,2);l.position.set(x,y,z);group.add(l);lights.push(l);return l;
 }
 function fixture(x,z,color=def.tint){
  box(x,CEIL-.35,z,2,.1,.43,mats.gold,{shadows:false});box(x,CEIL-.48,z,1.55,.055,.25,mats.accent,{shadows:false});
 }
 function plaque(x,y,z,w=1.5){box(x,y,z,w,.05,.07,mats.accent,{shadows:false})}
 function platform(x,z,w,d,y=0.24,material=mats.dark){return box(x,y,z,w,.48,d,material,{solid:false})}
 function stairs(x,z,count=6,dir=1,width=4){
  for(let i=0;i<count;i++){
   box(x,0.16+i*.20,z+dir*i*.60,width,.28,.58,mats.gold);
   box(x,0.32+i*.20,z+dir*i*.60,width,.055,.1,mats.dark,{shadows:false});
  }
 }
 function crate(x,z,w=1.7,d=1.5,hp=18){
  box(x,.75,z,w,1.5,d,mats.steel,{solid:true,hp,name:'Reinforced supply crate'});
  for(const s of [-1,1])box(x+s*(w/2-.09),.8,z,.07,1.35,d,mats.gold,{shadows:false});
 }
 function holo(x,z,rad=1.2){cylinder(x,1.7,z,rad,rad, .03,mats.accent,32);torus(x,2.1,z,rad,.04,mats.accent)}
 function furnitureTable(x,z,round=true,hp=8){
  if(round){cylinder(x,.72,z,1.14,1.14,.14,mats.gold,48);cylinder(x,.38,z,.27,.27,.6,mats.dark,24);
    box(x,.52,z,1.6,.5,1.55,mats.dark,{solid:true,hp,name:'Gaming table cover'})}
  else box(x,.7,z,3.1,1.4,1.65,mats.steel,{solid:true,hp,name:'Service counter'});
 }
 function glassWall(x,z,w=5,h=4){box(x,h/2,z,w,h,.12,mats.glass,{solid:true,name:'Glazed partition'})}
 function door(x,z,w=2.2){
  box(x,1.85,z,w,3.7,.32,mats.dark,{solid:true,door:true,name:'Security door'});
  box(x,3.8,z,w+.28,.12,.42,mats.gold);box(x,1.7,z+.25,.1,1.8,.05,mats.accent,{shadows:false})
 }
 function curvedRail(x,z,r,a0=0,a1=TAU,y=1.6){
  const points=[];for(let i=0;i<=52;i++){
   const a=a0+(a1-a0)*i/52;points.push(new T.Vector3(x+Math.cos(a)*r,y,z+Math.sin(a)*r))}
  const path=new T.CatmullRomCurve3(points);mesh(group,new T.TubeGeometry(path,52,.055,8,false),mats.gold,0,0,0,false);
  for(let i=0;i<12;i++){let a=a0+(a1-a0)*i/11;span([x+Math.cos(a)*r,.45,z+Math.sin(a)*r],[x+Math.cos(a)*r,y,z+Math.sin(a)*r],.035,mats.gold)}
 }
 function plant(x,z,scale=1){
  cylinder(x,.37*scale,z,.6*scale,.55*scale,.75*scale,mats.gold,16);
  const trunk=cylinder(x,1.25*scale,z,.13*scale,.18*scale,1.2*scale,mats.dark,10);
  const leaves=new T.IcosahedronGeometry(1,2);
  const canopy=mesh(group,leaves,mats.leaf,x,2.15*scale,z);canopy.scale.set(1.2*scale,1.3*scale,1.15*scale);
  return trunk
 }
 function bed(x,z){
  box(x,.32,z,2.2,.55,3.8,mats.dark,{solid:true,hp:5,name:'Guest bed'});
  box(x,.68,z,2.0,.27,3.6,mats.white);box(x,.88,z-1.25,1.7,.23,.7,mats.gold)
 }
 function wallSegment(x,z,w,d,material=mats.dark){
  return box(x,CEIL/2,z,w,CEIL,d,material,{solid:true,name:'Solid bulkhead'});
 }
 function panelRoomDesign(){
  // Preserve the original 3-across / 2-down tactical topology,
  // leaving wide walk-through connections rather than sealed dead-ends.
  if(['CP-01','CP-02','CP-06','CP-07','CP-08'].includes(id)){
   for(let x of [-7.7,7.7])for(let z of [-10,10]){
    wallSegment(x,z,.30,10.2);box(x,4.0,z,.45,.05,10.1,mats.gold,{shadows:false});
   }
   for(let x of [-15,0,15])for(let z of [-.1]){
    wallSegment(x-3.2,z,3.6,.3);wallSegment(x+3.2,z,3.6,.3);
    door(x,z,.8);
   }
  }
 }
 // Shared architecture. Original 2D board perimeter, converted to 3D shell.
 box(0,-.28,0,46,.55,34,mats.floor);
 for(let x=-22;x<=22;x+=2){box(x,.012,0,.025,.015,33.4,mats.gold,{shadows:false})}
 for(let z=-16;z<=16;z+=2){box(0,.012,z,45.4,.015,.025,mats.gold,{shadows:false})}
 // Front facade open for camera; rear wall is modeled transparent glazing with struts.
 wallSegment(-22.8,0,.6,34);wallSegment(22.8,0,.6,34);wallSegment(0,16.7,46,.5);
 for(let x=-21;x<=21;x+=3){span([x,.1,-16.6],[x,CEIL,-16.6],.10,mats.gold);
  box(x,CEIL+.25,-16.6,1.5,.11,.3,mats.accent,{shadows:false})}
 for(let x=-21;x<=21;x+=6){glassWall(x,-16.6,5.8,CEIL-1.2)}
 for(let x of [-17,-8,0,8,17]){fixture(x,10);fixture(x,-8)}
 panelRoomDesign();

 const rr=rand(parseInt(id.slice(3),10)*317),sx=[-15,0,15],sz=[-9,7];
 if(id==='CP-01'){
  // Docking: vehicle platforms, gantries, clamps, arc guides, maintenance.
  for(let i=0;i<3;i++){
   const x=sx[i],z=-7;
   cylinder(x,.17,z,4.2,4.2,.31,mats.dark,64);torus(x,.34,z,3.85,.11,mats.accent,80);
   const shuttle=new T.Group();shuttle.position.set(x,1.45,z);group.add(shuttle);
   const main=mesh(shuttle,new T.SphereGeometry(1,36,22),mats.white,0,0,0);main.scale.set(1.5,.48,3.1);
   boxShip(shuttle);
   for(const side of [-1,1])span([x+side*4.4,3.1,z-3],[x+side*4.4,.2,z+4],.18,mats.gold)
  }
  for(let i=0;i<5;i++)crate(-17+i*8,9,1.9,1.7);
  for(let i=0;i<4;i++){light(-18+i*12,4.8,-10,def.tint,22,15)}
 }else if(id==='CP-02'){
  for(let i=0;i<8;i++){
   const x=-17+i*4.8;box(x,.65,-5,2.8,1.3,1.2,mats.steel,{solid:true,hp:11,name:'Customs inspection kiosk'});
   box(x,1.45,-5.34,1.4,.8,.08,mats.accent);
   for(let z of [3,7]){box(x,.5,z,.25,1,1.65,mats.gold,{solid:true,name:'Turnstile'});torus(x,1.05,z,.65,.05,mats.accent)}
  }
  for(let x of [-17,0,17]){holo(x,-11,.9);light(x,4,-11)}
  for(let i=0;i<4;i++)glassWall(-13+i*8,12,6,3.8);
 }else if(id==='CP-03'){
  // Casino geometry follows the previous illustrated master: central
  // amethyst fountain, sweeping mezzanines, brass staircase, VIP islands.
  // This scene remains physically 3D at every freely rotating camera angle.
  cylinder(0,.34,-2,4.0,4.0,.7,mats.gold,80);
  cylinder(0,.74,-2,3.55,3.55,.22,mats.water,80);
  for(let j=0;j<23;j++){
   let a=j*2.3999,r=.22+(j%7)*.3,sz=.6+(j%6)*.43;
   const c=mesh(group,new T.ConeGeometry(.18+(j%3)*.18,sz,6),mats.violet,Math.cos(a)*r,1.15+sz*.32,-2+Math.sin(a)*r);
   c.rotation.set(Math.sin(a)*.15,0,Math.cos(a)*.1)}
  torus(0,.76,-2,3.62,.09,mats.accent);
  // Twin spiral gallery bridges: concentric elevated curved steel and glass.
  for(const s of [-1,1]){
   const x=s*13,z=-2,r=6;
   const deck=new T.Mesh(new T.RingGeometry(r-1.5,r,96,1,s===-1?Math.PI*.1:Math.PI*1.1,Math.PI*.8),mats.gold);
   deck.rotation.x=-Math.PI/2;deck.position.set(x,3.3,z);group.add(deck);
   curvedRail(x,z,r-.12,s===-1?Math.PI*.1:Math.PI*1.1,s===-1?Math.PI*.9:Math.PI*1.9,4.5);
   stairs(s*12,10,10,-1,3.2);
  }
  for(const [x,z] of [[-17,-9],[17,-9],[-15,9],[15,9],[-5,11],[5,11]]){
   furnitureTable(x,z,true);torus(x,.78,z,1.22,.06,mats.accent);}
  for(let i=0;i<8;i++){const a=i/8*TAU;
   cylinder(0+Math.cos(a)*6.8,3.7,-2+Math.sin(a)*5.5,.21,.21,CEIL-.5,mats.gold,18);
  }
  for(let i=0;i<5;i++){light(-18+i*9,4.1,8,0xb760ff,15,10)}
  for(let i=0;i<3;i++){light(-12+i*12,4.4,-9,0xffb15b,21,12)}
  for(let x of [-20,20]){plant(x,1,1.2);plant(x,12,1)}
 }else if(id==='CP-04'){
  for(let x of [-15,0,15]){
   box(x,.7,0,6,1.4,2,mats.gold,{solid:true,hp:12,name:'Hotel reception'});
   for(let z of [-9,9])bed(x,z);
   glassWall(x+4,7,2.5,4);
   light(x,4.8,0,0xffc18c,15,11);
  }
  for(let x of [-8,8])stairs(x,11,8,-1,3);
  for(let x of [-18,18]){plant(x,-3,1.0);plant(x,12,1.1)}
 }else if(id==='CP-05'){
  // Transparent ribbed biosphere and 3D botanical canopy.
  const canopy=mesh(group,new T.SphereGeometry(24,64,32,0,Math.PI,0,Math.PI*.43),mats.glass,0,-12,0,false);
  canopy.scale.set(1,.83,.66);
  for(let i=0;i<25;i++){
   let a=i/25*TAU;span([Math.cos(a)*20,.4,Math.sin(a)*14],[Math.cos(a)*16,5,Math.sin(a)*11.7],.085,mats.gold)
  }
  for(let j=0;j<38;j++){
   const x=-19+rr()*38,z=-13+rr()*26;
   if(Math.abs(x)<3.5&&Math.abs(z)<5.5)continue;
   plant(x,z,.55+rr()*.65)
  }
  cylinder(0,.28,0,4.5,4.5,.32,mats.gold,64);cylinder(0,.49,0,4.1,4.1,.17,mats.water,64);
  for(const x of [-11,11]){platform(x,1,3.2,9,.2,mats.gold);curvedRail(x,1,2,0,Math.PI,1.4)}
  light(0,5,0,0xaaffd4,36,21);
 }else if(id==='CP-06'){
  for(let x of sx)for(let z of sz){
   box(x,.8,z,7,1.55,2.5,mats.steel,{solid:true,hp:11,name:'Habitation market counter'});
   for(let dx of [-2.5,2.5]){box(x+dx,2.4,z,1.7,1.5,.12,mats.accent,{shadows:false});
    box(x+dx,.4,z+3,1.8,.8,1.4,mats.gold,{solid:true,name:'Residential bench'})}
  }
  for(let i=0;i<12;i++)box(-20+i*3.6,CEIL-.6,12,2,.11,.45,mats.accent,{shadows:false});
 }else if(id==='CP-07'){
  for(let x of sx)for(let z of sz){
   box(x,1.2,z,6.8,2.4,3.5,mats.dark,{solid:true,hp:26,name:'Fabrication machinery'});
   for(let k=0;k<6;k++)box(x-2.5+k,2.55,z, .8,.08,3.8,mats.gold);
   cylinder(x-2,3.5,z,.35,.35,1.4,mats.steel,20);
   span([x-2,4.1,z],[x+1,2.8,z+.8],.22,mats.gold);
   light(x,5,z,0xffb267,26,13);
  }
  for(let i=0;i<10;i++)span([-21+i*4.5,4.4,13],[-21+i*4.5,4.4,-14],.075,mats.gold);
 }else if(id==='CP-08'){
  for(let x of sx)for(let z of sz){
   cylinder(x,.4,z,2.0,2.0,.3,mats.dark,32);
   const pod=mesh(group,new T.CapsuleGeometry(.95,2.1,8,24),mats.glass,x,1.6,z);pod.rotation.x=Math.PI/2;
   box(x,1.9,z,2.8,.17,1.6,mats.white,{solid:true,hp:12,name:'Cryo-medical apparatus'});
   for(let side of [-1,1])box(x+side*2.6,1.25,z,1.25,2,.9,mats.steel,{solid:true,hp:9,name:'Medical console'});
   light(x,4.5,z,0x58e1ef,19,11);
  }
 }else if(id==='CP-09'){
  // Central core: radial structures, high technical density, zero gravity.
  for(let i=0;i<12;i++){
   const a=i/12*TAU,x=Math.cos(a)*12,z=Math.sin(a)*12;
   box(x,2.6,z,2.1,5,1.55,mats.dark,{solid:true,hp:28,name:'Relay server'});
   box(x,2.0,z+1,1.4,2.9,.1,mats.accent);
   span([0,5,0],[x,5,z],.16,mats.gold)
  }
  cylinder(0,1.65,0,3.2,2.5,3.3,mats.steel,48);
  torus(0,3.7,0,4,.12,mats.accent,72);
  for(let i=0;i<5;i++)torus(0,1.4+i*.7,0,2.45,.06,mats.gold);
  for(let i=0;i<8;i++){let a=i/8*TAU;light(Math.cos(a)*8,4,Math.sin(a)*8,0x76b8ff,14,12)}
 }else if(id==='CP-10'){
  // True 3D exposed exterior platform. Large hull, truss framing, tethers,
  // Earth-facing windows and safety railings. No flat reference image.
  for(let x=-21;x<=21;x+=4){
   box(x,.24,0,.36,.48,31,mats.steel,{shadows:false});
   for(let z of [-15,15])span([x,.45,z],[x,2.1,z],.07,mats.gold);
   for(let z of [-12,12])span([x,.5,z],[x+3,2.0,z],.065,mats.steel)
  }
  for(let z of [-15.5,15.5]){
   for(let x=-21;x<=21;x+=3)span([x,.2,z],[x,1.85,z],.06,mats.gold);
   span([-22,1.85,z],[22,1.85,z],.08,mats.gold)
  }
  for(let x of [-15,0,15])crate(x,3,1.9,1.65,22);
  for(let x of [-18,-9,0,9,18]){holo(x,-8,.5);light(x,4,-8,0x59bbf4,11,9)}
  const hull=mesh(group,new T.CylinderGeometry(48,48,120,80,1,true),mats.steel,0,3,-51);
  hull.rotation.z=Math.PI/2;hull.material.side=T.DoubleSide;hull.scale.set(1,1,1);
 }
 // Every area includes meaningful real world objects with physical footprints.
 if(id!=='CP-03'&&id!=='CP-05'&&id!=='CP-09'&&id!=='CP-10'){
  for(let i=0;i<5;i++)crate(-18+i*9,13,1.3,1.1,12);
 }
 // FX strips across real ceiling supports.
 for(let x=-20;x<=20;x+=8){box(x,CEIL,0,.20,.16,30,mats.steel,{shadows:false});}
 const atmos=new T.Color(def.tint);
 return {
  id,def,group,solids,doors,lights,interactables,
  spawn:new T.Vector3(-3,0,13),enemy:new T.Vector3(12,0,-9),
  palette:{accent:atmos},background:id==='CP-10'?0x061326:0x0a1220
 };
 // Small shuttle authored in local space, not a picture.
 function boxShip(p){
  const shuttle=mesh(p,new T.SphereGeometry(1,20,12),mats.steel,0,0,-1);
  shuttle.scale.set(1.1,.52,2.2);
  for(let s of [-1,1]){
   const wing=mesh(p,new T.BoxGeometry(4,.16,1.5),mats.dark,s*1.4,-.05,.25);wing.rotation.y=s*.25;
   mesh(p,new T.CylinderGeometry(.36,.46,2,20),mats.dark,s*.95,-.20,1.9).rotation.x=Math.PI/2;
   mesh(p,new T.CircleGeometry(.30,20),mats.accent,s*.95,-.20,3.0)
  }
 }
}
