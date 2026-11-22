/*
 * Original fully modelled ship, station, planet and debris for the Director 4.0
 * orbital lab. All geometry here is authored procedurally. No Cyberpunk 2077
 * game meshes, reference art, or proprietary textures are redistributed.
 */
const TAU = Math.PI * 2;
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
function rng(seed) { let s=seed>>>0;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;} }
function box(THREE,parent,material,pos,size){
 const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);
 m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function tube(THREE,parent,material,from,to,radius=0.07,segments=12){
 const p=new THREE.Vector3(...from),q=new THREE.Vector3(...to);
 const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,p.distanceTo(q),segments),material);
 m.position.copy(p).add(q).multiplyScalar(.5);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),q.sub(p).normalize());
 m.castShadow=true;parent.add(m);return m;
}
/* Original procedural basecolor, tangent normal, and roughness texture maps. */
let cachedMaps;
function surfaceMaps(T){
 if(cachedMaps)return cachedMaps;
 const n=512,pix=n*n,albedo=new Uint8Array(pix*4),normal=new Uint8Array(pix*4),
 rough=new Uint8Array(pix*4),h=new Float32Array(pix),rnd=rng(180932);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const seam=Math.min(x%128,128-x%128,y%128,128-y%128)<2;
  h[y*n+x]=(rnd()-.5)*.055-(seam?.58:0);
 }
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=y*n+x,j=i*4,dx=h[y*n+(x+1)%n]-h[y*n+(x+n-1)%n],
   dy=h[((y+1)%n)*n+x]-h[((y+n-1)%n)*n+x],l=Math.hypot(dx,dy,1);
  const c=clamp(Math.round(221+h[i]*57+(rnd()-.5)*17),0,255);
  albedo[j]=c-7;albedo[j+1]=c-3;albedo[j+2]=c;albedo[j+3]=255;
  normal[j]=127.5-dx*127.5/l;normal[j+1]=127.5-dy*127.5/l;normal[j+2]=127.5+127.5/l;normal[j+3]=255;
  const r=clamp(Math.round(125+(rnd()-.5)*19-h[i]*40),10,250);
  rough[j]=r;rough[j+1]=r;rough[j+2]=r;rough[j+3]=255;
 }
 const tex=(bytes,srgb=false)=>{const t=new T.DataTexture(bytes,n,n,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;
  t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;
  if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;t.needsUpdate=true;return t;};
 cachedMaps={map:tex(albedo,true),normalMap:tex(normal),roughnessMap:tex(rough)};return cachedMaps;
}
const metal=(T,color,roughness=.32,metalness=.85)=>{
 const maps=surfaceMaps(T);return new T.MeshPhysicalMaterial({
 color,metalness,roughness,clearcoat:.28,clearcoatRoughness:.16,
 map:maps.map,normalMap:maps.normalMap,normalScale:new T.Vector2(.5,.5),roughnessMap:maps.roughnessMap});
};
const emissive=(T,color,intensity=3)=>new T.MeshStandardMaterial({color:0x101827,metalness:.4,roughness:.3,emissive:color,emissiveIntensity:intensity,toneMapped:false});
export function makeShip(THREE,style='crew'){
 const enemy=style!=='crew',heavy=style==='heavy';
 const grp=new THREE.Group();grp.name='D4-High-Detail-'+style;
 const base=metal(THREE,enemy?0x4f5965:0x9fb4c4,.25,.88);
 const armor=metal(THREE,enemy?0x31343c:0x354c62,.39,.84);
 const dark=metal(THREE,0x121d2a,.51,.65);
 const trim=metal(THREE,enemy?0xa64f53:0xbfcbd3,.24,.87);
 const glow=emissive(THREE,enemy?0xff4a55:0x47d9ff,3.8);
 const warm=emissive(THREE,0xffb76c,2.2);
 const canopy=new THREE.MeshPhysicalMaterial({color:0x163d5a,metalness:.31,roughness:.09,clearcoat:1,clearcoatRoughness:.055,transmission:.18,transparent:true,opacity:.91});
 // Symmetrical smooth main fuselage, 80 radial samples instead of crude cubes.
 const profile=[[-5.3,.06],[-5.0,.35],[-4.1,.82],[-2.9,1.03],[-1.2,1.12],[.6,1.13],[2.7,.96],[4.0,.72],[4.5,.31],[4.7,.05]].map(([z,r])=>new THREE.Vector2(r,z));
 const hull=new THREE.Mesh(new THREE.LatheGeometry(profile,80),base);
 hull.rotation.x=Math.PI/2;hull.castShadow=true;grp.add(hull);
 // Reinforced hull ribs and overlapping panels.
 for(let j=0;j<13;j++){
  const z=-3.7+j*.58;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.91+(j<5?j*.045:(12-j)*.027),.025,8,76),j%4===0?trim:armor);
  ring.position.z=z;grp.add(ring);
 }
 // High-curvature split canopy with actual volume and surrounding frame.
 const glass=new THREE.Mesh(new THREE.SphereGeometry(1,56,28,0,TAU,0,Math.PI),canopy);
 glass.scale.set(.78,.44,1.50);glass.position.set(0,.78,-2.0);glass.castShadow=true;grp.add(glass);
 for(const x of [-.62,0,.62])tube(THREE,grp,trim,[x,.95,-3.3],[x,.96,-.7],.027,10);
 // Swept custom extruded wing meshes, mirrored as one real 3D shape per side.
 for(const side of [-1,1]){
  const sh=new THREE.Shape();const s=side;
  sh.moveTo(s*.68,-2.15);sh.lineTo(s*2.2,-1.82);sh.lineTo(s*5.9,1.17);
  sh.lineTo(s*5.85,1.78);sh.lineTo(s*3.75,1.28);sh.lineTo(s*1.26,2.85);sh.closePath();
  const g=new THREE.ExtrudeGeometry(sh,{depth:.24,bevelEnabled:true,bevelThickness:.08,bevelSize:.11,bevelSegments:3,steps:1,curveSegments:12});
  g.rotateX(Math.PI/2);
  const wing=new THREE.Mesh(g,armor);wing.position.y=.2;wing.castShadow=true;grp.add(wing);
  tube(THREE,grp,trim,[s*.95,.38,-1.65],[s*5.25,.34,1.25],.055);
  tube(THREE,grp,trim,[s*1.2,.25,2.48],[s*3.7,.25,1.26],.046);
  // Underwing engine pod: cylindrical chamber, armored fins and physically curved bell.
  const pod=new THREE.Group();pod.position.set(s*2.45,-.34,2.0);grp.add(pod);
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(.42,.54,2.8,40,2),base);
  shell.rotation.x=Math.PI/2;pod.add(shell);
  const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.42,.61,.55,48),dark);
  nozzle.rotation.x=Math.PI/2;nozzle.position.z=1.64;pod.add(nozzle);
  const thruster=new THREE.Mesh(new THREE.CircleGeometry(.38,48),glow);
  thruster.position.z=1.98;pod.add(thruster);
  const halo=new THREE.PointLight(enemy?0xff5c65:0x30bdff,7,10,2);halo.position.z=2;pod.add(halo);
  for(let j=0;j<7;j++){
    const band=new THREE.Mesh(new THREE.TorusGeometry(.47,.025,8,40),j%2?trim:dark);
    band.position.z=-1.15+j*.41;pod.add(band);
  }
  // Detail: intakes, formation lights, flaps, decals represented by meshes.
  box(THREE,grp,dark,[s*3.65,.31,.74],[1.45,.08,.25]);
  box(THREE,grp,glow,[s*5.48,.31,1.38],[.35,.035,.65]);
  box(THREE,grp,trim,[s*4.23,.33,.96],[.9,.03,.1]);
  const blaster=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,2.1,24),dark);
  blaster.rotation.x=Math.PI/2;blaster.position.set(s*3.15,-.3,-1.2);grp.add(blaster);
  const blasterTip=new THREE.Mesh(new THREE.TorusGeometry(.13,.035,8,24),glow);
  blasterTip.position.set(s*3.15,-.3,-2.28);grp.add(blasterTip);
 }
 // Floating plate seam greebles, antennae and hull vents.
 const detailGeoms=[];
 for(let j=0;j<72;j++){
  const a=j*2.3999,z=-3.45+(j%18)*.39,r=.94;
  const m=box(THREE,grp,j%6===0?trim:armor,[Math.cos(a)*r,Math.sin(a)*r,z],[.14,.035,.25]);
  m.rotation.z=a;
  detailGeoms.push(m);
 }
 for(let j=0;j<14;j++){const z=1.85+j*.15;
  box(THREE,grp,dark,[(j%2?1:-1)*.54,.87,z],[.37,.05,.08]);}
 tube(THREE,grp,trim,[0,.85,2.3],[0,2.1,2.62],.025);
 const beacon=new THREE.Mesh(new THREE.SphereGeometry(.07,14,10),warm);
 beacon.position.set(0,2.12,2.62);grp.add(beacon);
 if(heavy){
  grp.scale.setScalar(1.55);
  for(let s of [-1,1]){
   box(THREE,grp,armor,[s*1.35,.7,1.5],[1.9,.65,3]);
   tube(THREE,grp,trim,[s*1.25,1.3,1.5],[s*1.25,1.3,-2.1],.11);
  }
 }
 grp.userData={radius:heavy?8:5,style,physical:true};
 return grp;
}
function makeEarthTexture(THREE){
 // Authored procedural ocean, clouds and coast-like elevation masks.
 const w=1024,h=512,c=document.createElement('canvas');c.width=w;c.height=h;
 const ctx=c.getContext('2d'),img=ctx.createImageData(w,h);
 const rnd=rng(0x51bade),seeds=Array.from({length:16},()=>[rnd()*TAU,rnd()*Math.PI,1.8+rnd()*3]);
 const v=(x,y)=>Math.sin(x*.074+Math.cos(y*.038)*4.5)*.35+Math.sin(x*.021+y*.042)*.31+Math.cos(x*.012-y*.016)*.28;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let f=v(x,y),lat=Math.abs(y-h/2)/(h/2),a=(y*w+x)*4;
  let shore=f>.38, polar=lat>.86,cloud=Math.sin(x*.14+y*.067)*Math.sin(y*.048-x*.023)>.72;
  let color=polar?[190,211,225]:shore?[53+f*36,98+f*35,59+f*16]:[15+f*16,62+f*36,110+f*40];
  if(cloud)color=color.map(ch=>ch*.65+255*.35);
  img.data[a]=clamp(color[0],0,255);img.data[a+1]=clamp(color[1],0,255);img.data[a+2]=clamp(color[2],0,255);img.data[a+3]=255
 }
 ctx.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
export function makeEarth(THREE){
 const group=new THREE.Group();
 const surface=new THREE.Mesh(new THREE.SphereGeometry(152,80,64),
 new THREE.MeshStandardMaterial({map:makeEarthTexture(THREE),roughness:.92,metalness:0,emissive:0x071524,emissiveIntensity:.55}));
 surface.rotation.z=.31;group.add(surface);
 const atmo=new THREE.Mesh(new THREE.SphereGeometry(155.4,80,64),new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,side:THREE.BackSide,
   uniforms:{glowColor:{value:new THREE.Color(0x328ce7)}},
   vertexShader:'varying vec3 vn;varying vec3 vv;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vn=normalize(normalMatrix*normal);vv=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying vec3 vn;varying vec3 vv;uniform vec3 glowColor;void main(){float a=pow(1.-abs(dot(normalize(vn),normalize(vv))),3.);gl_FragColor=vec4(glowColor,a*.55);}'
 }));group.add(atmo);
 return group;
}
export function makePalace(THREE){
 const p=new THREE.Group(),hull=metal(THREE,0x777e8f,.42,.89),silver=metal(THREE,0xc7d1db,.24,.9);
 const blue=emissive(THREE,0x35bdff,3.5),warm=emissive(THREE,0xffae61,2.7);
 const spine=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,95,48),hull);spine.castShadow=true;p.add(spine);
 for(let r=0;r<5;r++){
  const y=(r-2)*12,radius=r===2?24:21.5;
  const torus=new THREE.Mesh(new THREE.TorusGeometry(radius,2.45,24,192),hull);torus.rotation.x=Math.PI/2;torus.position.y=y;torus.castShadow=true;p.add(torus);
  for(let d of [-1.6,-.48,.65,1.6]){
   const edge=new THREE.Mesh(new THREE.TorusGeometry(radius+2.18,.13,10,192),d===-.48?blue:silver);
   edge.rotation.x=Math.PI/2;edge.position.y=y+d;p.add(edge);
  }
  const count=144;
  const winGeo=new THREE.BoxGeometry(.26,.66,.98);
  const windows=new THREE.InstancedMesh(winGeo,r===1?warm:blue,count);windows.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
   const a=i/count*TAU;dummy.position.set(Math.cos(a)*(radius+2.37),y+.35,Math.sin(a)*(radius+2.37));
   dummy.rotation.set(0,-a,0);dummy.updateMatrix();windows.setMatrixAt(i,dummy.matrix)
  }
  windows.instanceMatrix.needsUpdate=true;p.add(windows);
  const spokes=12;
  for(let j=0;j<spokes;j++){
   const a=j/spokes*TAU,x=Math.cos(a)*(radius-1),z=Math.sin(a)*(radius-1);
   tube(THREE,p,silver,[0,y,0],[x,y,z],.32,16);
   tube(THREE,p,hull,[0,y+2.7,0],[x,y,z],.18,12);
  }
 }
 for(let j=0;j<12;j++){
  const a=j/12*TAU;
  const docking=new THREE.Group();docking.position.set(Math.cos(a)*28,0,Math.sin(a)*28);docking.rotation.y=-a;p.add(docking);
  box(THREE,docking,hull,[0,0,0],[3.6,3.5,6]);
  box(THREE,docking,warm,[0,0,-3.05],[2.45,2.55,.1]);
  for(let k=0;k<3;k++)box(THREE,docking,blue,[(k-1)*1.2,2,-.3],[.5,.08,4]);
 }
 const upper=new THREE.Mesh(new THREE.CylinderGeometry(4.5,3.4,7,64),silver);upper.position.y=49;p.add(upper);
 const lower=new THREE.Mesh(new THREE.ConeGeometry(5,14,64),hull);lower.rotation.x=Math.PI;lower.position.y=-54;p.add(lower);
 const beacon=new THREE.PointLight(0x35c3ff,18,45,2);beacon.position.y=47;p.add(beacon);
 p.userData={colliderRadius:32,physical:true};return p;
}
export function makeAsteroids(THREE,seed=44){
 const rnd=rng(seed),group=new THREE.Group(),asteroids=[];
 const g=new THREE.IcosahedronGeometry(1,3);
 const pos=g.attributes.position;for(let i=0;i<pos.count;i++){
  const v=new THREE.Vector3().fromBufferAttribute(pos,i);
  const noisy=1+Math.sin(v.x*8+v.z*3)*.09+Math.cos(v.y*11-v.z*7)*.08;
  pos.setXYZ(i,v.x*noisy,v.y*noisy,v.z*noisy);
 }
 g.computeVertexNormals();
 const m=new THREE.MeshStandardMaterial({color:0x7a8089,metalness:.28,roughness:.93,flatShading:false});
 const count=170,inst=new THREE.InstancedMesh(g,m,count);const ob=new THREE.Object3D();
 for(let i=0;i<count;i++){
  const x=(rnd()-.5)*240,y=(rnd()-.5)*100,z=-35-rnd()*340,r=.9+rnd()*5.2;
  ob.position.set(x,y,z);ob.rotation.set(rnd()*TAU,rnd()*TAU,rnd()*TAU);ob.scale.set(r*.85,r*.8,r*1.2);ob.updateMatrix();inst.setMatrixAt(i,ob.matrix);
  asteroids.push({position:ob.position.clone(),radius:r*1.12});
 }
 inst.instanceMatrix.needsUpdate=true;inst.castShadow=true;inst.receiveShadow=true;group.add(inst);
 const wreckMat=metal(THREE,0x4d606a,.47,.86);
 for(let k=0;k<26;k++){
  const x=(rnd()-.5)*140,y=(rnd()-.5)*65,z=-25-rnd()*240;
  const chunk=new THREE.Mesh(new THREE.BoxGeometry(2+rnd()*5,.5+rnd()*2,2+rnd()*7),wreckMat);
  chunk.position.set(x,y,z);chunk.rotation.set(rnd()*TAU,rnd()*TAU,rnd()*TAU);chunk.castShadow=true;group.add(chunk);
  asteroids.push({position:chunk.position.clone(),radius:4.8});
 }
 return {group,colliders:asteroids};
}
export function makeStars(THREE,seed=2026){
 const rnd=rng(seed),g=new THREE.BufferGeometry(),p=[],colors=[];
 for(let i=0;i<9000;i++){
  const u=rnd()*2-1,angle=rnd()*TAU,rr=300+rnd()*1050,s=Math.sqrt(1-u*u);
  p.push(rr*s*Math.cos(angle),rr*u,rr*s*Math.sin(angle));
  let a=rnd();colors.push(.58+a*.42,.71+a*.27,.86+a*.14);
 }
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 return new THREE.Points(g,new THREE.PointsMaterial({size:1.6,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:.85,depthWrite:false}));
}
